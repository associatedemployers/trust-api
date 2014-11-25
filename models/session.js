/*
  Session - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var Promise     = require('bluebird'), // jshint ignore:line
    createModel = require('./helpers/create-model'),
    tokenModule = require(process.cwd() + '/lib/security/token');

expirationGen = tokenModule.expirationGenerator(2, 'hours');

// Doc Schema
var sessionSchema = new Schema({
  publicKey:  { type: String, index: true },
  privateKey: String,

  user: { type: Schema.ObjectId, ref: 'User', index: true },

  expiration: { type: Date, default: expirationGen, index: true },
  created:    { type: Date, default: Date.now }
});

sessionSchema.virtual('isExpired').get(function () {
  var now = new Date();

  return this.expiration < now;
});

/**
 * Removes stale sessions
 * 
 * @return {Object} Promise
 */
sessionSchema.methods.removeStale = function () {
  var self = this;

  return new Promise(function ( resolve, reject ) {
    var now = new Date();

    self.model('Session').remove({ user: self.user, expiration: { $lt: now } }, function ( err, removed ) {
      if( err ) {
        return reject( err );
      }

      resolve( removed );
    });
  });
};

/**
 * Refreshes expiration
 *
 * @return {Object} Promise
 */
sessionSchema.methods.refresh = function () {
  var self = this;

  return new Promise(function ( resolve, reject ) {
    self.expiration = expirationGen();

    self.save(function ( err, refreshed ) {
      if( err ) {
        return reject( err );
      }

      resolve( refreshed );
    });
  });
};

module.exports = createModel('Session', sessionSchema);
