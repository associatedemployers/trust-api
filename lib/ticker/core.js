/*
 Ticker Core
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    _       = require('lodash');

var Promise = require('bluebird'); // jshint ignore:line

var mongoose     = require('mongoose'),
    HistoryEvent = require(process.cwd() + '/models/history-event'),
    diff         = require('deep-diff').diff;

module.exports = Ticker;

/**
 * Ticker Constructor
 * @param  {Object} options
 * @return {Object} this
 */
function Ticker ( options ) {
  this.options = options;

  return this;
}

Ticker.prototype.constructor = Ticker;

/**
 * Tick - Create history event
 * @param  {Object} updated  Mongoose document
 * @param  {Object} previous Mongoose document
 * @param  {Object} updater  Document updater (user)
 * @param  {Date}   date     Defaults to current time, can be used for back-dating changes
 * @return {Promise}
 */
Ticker.prototype.tick = function ( updated, previous, updater, date ) {

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
    var he = {
      delta: diff( leanDocs.updated, leanDocs.previous ),
      deltaTypes: _.uniq(delta.map(function ( o ) {
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
      })),
      updater: ( mongoose.Schema.ObjectId.isValid( updater ) ) ? updater : null
    };

    // Computed Description Part
    var compDescript = ( mongoose.Schema.ObjectId.isValid( updater ) ) ? 'user ' + updater.toString() : updater;
    he.description   = 'Properties ' + he.deltaTypes.join('/') + ' by ' + compDescript;

    // HistoryEvent Creation
    var historyEvent = new HistoryEvent(_.merge(he, {
      documents: leanDocs
    }));

    historyEvent.save(function ( err, event ) {

    });

  });

};
