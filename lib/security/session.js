/*
  Session Module
*/

var winston = require('winston').loggers.get('default'),
    chalk   = require('chalk'),
    _       = require('lodash');

var mongoose = require('mongoose'),
    token    = require('./token'),
    Session  = require(process.cwd() + '/models/session');


/**
 * Session Retrieval ( refresh & creation )
 * 
 * @param  {String|ObjectId} id User's id
 * @param  {Object} data        Data to be encoded in the User's token
 * @param  {String} modelName   Model to use
 * @return {Object}             Promise
 */
exports.retrieve = function ( id, data, modelName ) {
  return new Promise(function ( resolve, reject ) {
    if( !id ) {
      return reject( new Error('removeStale requires an id to be specified.') );
    }

    var now          = new Date(),
        SessionModel = ( modelName ) ? mongoose.model( modelName ) : Session;

    SessionModel.findOne({ user: id, expiration: { $gt: now } }).exec(function ( err, existingSession ) {
      if( err ) {
        return reject( err );
      }

      if( existingSession ) {
        existingSession.expiration = undefined; // Forces a regeneration of the expiration field ( refresh time )
      }

      var keypair = token.createKeypair( data );

      var session = existingSession || new Session( _.merge( {}, {
        user: id
      }, keypair ) );

      session.save(function ( err, newSession ) {
        if( err ) {
          return reject( err );
        }

        resolve( newSession );
      });
    });
  });
};

/**
 * Removes stale sessions
 * 
 * NOTE: Non-prototypal access; use SessionModel.removeStale for moduleless access
 * 
 * @param  {String|ObjectId} id User's id
 * @param  {String} modelName   Model to use
 * @return {Object}             Promise
 */
exports.removeStale = function ( id, modelName ) {
  return new Promise(function ( resolve, reject ) {
    if( !id ) {
      return reject( new Error('removeStale requires an id to be specified.') );
    }

    var now          = new Date(),
        SessionModel = ( modelName ) ? mongoose.model( modelName ) : Session;

    SessionModel.remove({ user: id, expiration: { $lt: now } }).exec(function ( err, result ) {
      if( err ) {
        return reject( err );
      }

      resolve( result );
    });
  });
};
