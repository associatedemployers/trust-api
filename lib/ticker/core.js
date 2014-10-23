/*
  Ticker Core
  ---
  Due to performance best practices on the mongoose adapter, Ticker DOES NOT register a new HistoryEvent for 
  update, findByIdAndUpdate, findOneAndUpdate, findOneAndRemove, and findByIdAndRemove db operations. Use 
  Model.find & Document.save to trigger an event registration.
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    _       = require('lodash');

var Promise = require('bluebird'); // jshint ignore:line

var mongoose     = require('mongoose'),
    Schema       = mongoose.Schema,
    dbConnection = require(process.cwd() + '/config/mongoose').init(),
    HistoryEvent = require(process.cwd() + '/models/history-event'),
    diff         = require('deep-diff').diff,
    indexOfId    = require('../utilities/find-by-objectid');

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
    console.log('Ticker :: Ticking...');
    var err;

    // Prelim checks
    if( !updated || !previous ) {
      err = new Error('Please pass an updated and previous document to Ticker.tick');
      err.type = 'documentError';
      return reject( err );
    }

    if( !( updated instanceof mongoose.Document ) || !( previous instanceof mongoose.Document ) ) {
      err = new Error('One or all of the records you passed is not a mongoose document');
      err.type = 'typeError';
      return reject( err );
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

    he.updater    = ( mongoose.Types.ObjectId.isValid( updater ) ) ? updater : null;
    he.delta      = diff( leanDocs.previous, leanDocs.updated ); // Calculate delta

    if( !he.delta ) {
      winston.log('warning', chalk.yellow('Attempted to run Ticker.tick without a modified document, resolving...') );
      return resolve();
    }

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
    
    var compDescript = ( mongoose.Types.ObjectId.isValid( updater ) ) ? 'user ' + updater.toString() : 'SYSTEM';  // Computed Description Part
    he.description   = 'Properties ' + he.deltaTypes.join('/') + ' by ' + compDescript;                          // Using it here

    // HistoryEvent Creation
    var historyEvent = new HistoryEvent(_.merge(he, {
      documents:     leanDocs,
      eventDate:     ( options ) ? options.date : null, // Default set in model schema
      documentId:    updated._id.toString(),
      documentModel: updated.constructor.modelName
    }));

    historyEvent.save(function ( err, eventRecord ) {
      if( err ) {
        return reject( err );
      }

      console.log('Ticker :: Created Event', eventRecord._id);

      if( options.saveToRecord !== false && !options.auto ) {
        
        if( indexOfId( doc.historyEvents, ev._id ) < 0 ) {
          updated.historyEvents.push( eventRecord._id );

          updated.save(function ( err, newRecord ) {
            if( err ) {
              return reject( err );
            }

            resolve( newRecord );
          });
        } else {
          resolve( updated );
        }
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
        return reject(new Error('There is no HistoryEvent with the id: ' + historyEvent));
      }

      // Lookup the document resource
      var Model = dbConnection.model( ev.documentModel );

      Model.findById(ev.documentId, function ( err, document ) {
        if( err ) {
          return reject( err );
        }

        // Update superseded events
        HistoryEvent.where({ documentId: ev.documentId, eventDate: { $gt: ev.eventDate, $lt: new Date() } }).update({ $addToSet: { eventFlags: 'Superseded by Rollback' } }, function ( err, events ) {
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
    updater:       Schema.ObjectId,
    inRollback:    Boolean,
    saveToRecord:  Boolean,
    historyEvents: [{ type: Schema.ObjectId, ref: 'HistoryEvent' }],
    eventDate:     Date
  });

  schema.pre('save', function ( next ) {
    if( this.isNew || !this._id || !mongoose.Types.ObjectId.isValid( this._id.toString() || this.noEvent ) ) {
      return next();
    }

    var Model = dbConnection.model( this.constructor.modelName ),
        doc   = this;

    var previousLookup = function ( err, previous ) {
      if( err ) {
        winston.log('error', err);
      }

      if( err || !previous ) {
        return next( err );
      }

      var options = {
        auto: true,
        date: doc.eventDate
      };

      var createdEvent = function ( ev ) {
        if( ev && doc.saveToRecord !== false && indexOfId( doc.historyEvents, ev._id ) < 0 ) {
          doc.historyEvents.push( ev._id );
        }

        // Remove Ticker stuff
        delete doc.updater;
        delete doc.inRollback;
        delete doc.eventDate;
        delete doc.saveToRecord;

        next.call( doc );
      };

      self.tick( doc, previous, doc.updater, options ).then( createdEvent ).catch(function ( err ) {
        winston.log('error', chalk.bgRed( err ));
        next( err );
      });

    };

    Model.findById(this._id, previousLookup);

  });

  return schema;

};
