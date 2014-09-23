/*
  Ticker Core
  ---
  Due to performance best practices on the mongoose adapter, Ticker DOES NOT register a new HistoryEvent for 
  update, findByIdAndUpdate, findOneAndUpdate, findOneAndRemove, and findByIdAndRemove db operations. Use
  Ticker.tick directly or use Model.find & Document.save to trigger an event registration.
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    _       = require('lodash');

var Promise = require('bluebird'); // jshint ignore:line

var mongoose     = require('mongoose'),
    dbConnection = require(process.cwd() + '/config/mongoose').init(),
    HistoryEvent = require(process.cwd() + '/models/history-event'),
    diff         = require('deep-diff').diff;

module.exports = Ticker;

/**
 * Ticker Constructor
 * 
 * @param  {Object} options
 * @return {Object} this
 */
function Ticker ( options ) {
  this.options = options;

  return this;
}

Ticker.prototype.constructor = Ticker;

/**
 * Tick
 * 
 * Creates a new history event with the updated and previous document
 * 
 * @param  {Object} updated  Mongoose document
 * @param  {Object} previous Mongoose document
 * @param  {Object} updater  Document updater (user)
 * @param  {Date}   date     Defaults to current time, can be used for back-dating changes
 * @return {Promise}
 */
Ticker.prototype.tick = function ( updated, previous, updater, options ) {

  return new Promise(function ( resolve, reject ) {
    // Prelim checks
    if( !updated || !previous ) {
      return reject(new Error({
        name:    'documentError',
        message: 'Please pass an updated and previous document to Ticker.tick'
      }));
    }

    if( !( updated instanceof mongoose.Document ) || !( previous instanceof mongoose.Document ) ) {
      return reject(new Error({
        name:    'typeError',
        message: 'One or all of the records you passed is not a mongoose document'
      }));
    }

    if( !updated.isModified() ) {
      winston.log('warning', chalk.yellow('Attempted to run Ticker.tick without a modified document, resolving...') );
      return resolve( updated );
    }

    // Strip the mongoose docs for comparison
    var docDefaults = {
      depopulate: true
    };

    var leanDocs = {
      updated:  updated.toObject( docDefaults ),
      previous: previous.toObject( docDefaults )
    };

    // Delete historyEvents in lean docs
    for ( var key in leanDocs ) {
      delete leanDocs[ key ].historyEvents;
    }

    // HistoryEvent Computations
    var he = {};

    he.updater    = ( mongoose.Schema.ObjectId.isValid( updater ) ) ? updater : null;
    he.delta      = diff( leanDocs.updated, leanDocs.previous ); // Calculate delta
    he.deltaTypes = _.uniq(he.delta.map(function ( o ) {
      var s;

      switch ( o.kind ) {
        case 'N':
          s = 'Added';
          break;
        case 'D':
          s = 'Deleted';
          break;
        case 'E':
        case 'A':
          s = 'Changed';
      }

      return s;
    }));
    
    var compDescript = ( mongoose.Schema.ObjectId.isValid( updater ) ) ? 'user ' + updater.toString() : updater; // Computed Description Part
    he.description   = 'Properties ' + he.deltaTypes.join('/') + ' by ' + compDescript;                          // Using it here

    // HistoryEvent Creation
    var historyEvent = new HistoryEvent(_.merge(he, {
      documents:     leanDocs,
      time_stamp:    ( options ) ? options.date : null, // Default set in model schema
      documentId:    updated._id.toString,
      documentModel: updated.constructor.modelName
    }));

    historyEvent.save(function ( err, eventRecord ) {
      if( err ) {
        return reject( err );
      }

      if( options.saveToRecord ) {
        updated.historyEvents.push( eventRecord._id );

        updated.save(function ( err, newRecord ) {
          if( err ) {
            return reject( err );
          }

          resolve( newRecord );
        });
      } else {
        resolve( eventRecord );
      }
    });
  });

};

/**
 * Rollback
 * 
 * Rolls back document records, flags superseded events, and triggers a new rollback event registration
 * 
 * @param  {[type]} historyEvent [description]
 * @return {[type]}              [description]
 */
Ticker.prototype.rollback = function ( historyEvent ) {

  return new Promise(function ( resolve, reject ) {

    if( historyEvent instanceof mongoose.Document ) {
      historyEvent = historyEvent._id;
    }

    // Retrieve latest HistoryEvent w/ that id
    HistoryEvent.findById(historyEvent, function ( err, ev ) {
      if( err ) {
        return reject( err );
      }

      // Reject if we don't have a HistoryEvent
      if( !ev ) {
        return reject(new Error({
          name:    'HistoryEventError',
          message: 'There is no HistoryEvent with the id' + historyEvent
        }));
      }

      // Lookup the document resource
      var Model = dbConnection.model( ev.documentModel );

      Model.findById(ev.documentId, function ( err, document ) {
        if( err ) {
          return reject( err );
        }

        // Update superseded events
        HistoryEvent.where({ documentId: ev.documentId, time_stamp: { $gt: ev.time_stamp, $lt: new Date() } }).update({ $addToSet: { eventFlags: 'Superseded by Rollback' } }, function ( err, events ) {
          if( err ) {
            reject( err );
          }

          // Update the document
          _.merge( document, ev.documents.updated );
          document.inRollback = true;

          // Triggers a Ticker.tick to register a rollback event
          document.save(function ( err, nDocument ) {
            if( err ) {
              return reject( err );
            }

            resolve( nDocument );
          });
        });
      });
    });
  });

};

/**
 * Attach
 *
 * Attaches appropriate mongoose schema middleware and fields necessary for automatically registering HistoryEvents
 * NOTE: Must be called before model registration
 * 
 * @param  {Object} schema Mongoose Schema
 * @return {Object}        Mongoose Schema, updated
 */
Ticker.prototype.attach = function ( schema ) {

  var self = this;

  schema.add({
    updater:        Schema.ObjectId,
    inRollback:     Boolean,
    historyEvents:  [{ type: Schema.ObjectId, ref: 'HistoryEvent' }],
    backDate:       Date
  });

  schema.post('save', function ( next ) {
    if( !this._id || !mongoose.Schema.ObjectId.isValid( this._id ) ) {
      return next();
    }

    var Model = dbConnection.model( this.constructor.modelName );

    Model.findById(this._id, previousLookup);

    var previousLookup = function ( err, previous ) {
      if( err ) {
        winston.log('error', err);
      }

      if( err || !previous ) {
        return next();
      }

      var options = {};

      if( this.backDate ) {
        options.date = this.backDate;
        delete this.backDate;
      }

      self.tick( this, previous, this.updater, options ).then( createdEvent ).catch(function ( err ) {
        winston.log('error', chalk.bgRed( err ));
      });

      var createdEvent = function ( ev ) {
        this.historyEvents.push( ev._id );

        // Remove Ticker stuff
        delete this.updater;
        delete this.inRollback;

        next();
      }.bind( this );

    }.bind( this );
  });

  return schema;

};
