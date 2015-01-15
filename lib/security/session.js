/*
  Session Module
*/

var winston = require('winston').loggers.get('default'),
    chalk   = require('chalk'),
    Promise = require('bluebird'), // jshint ignore:line
    _       = require('lodash');

var mongoose = require('mongoose'),
    token    = require('./token'),
    jwt      = require('jwt-simple'),
    moment   = require('moment'),
    Session  = require(process.cwd() + '/models/session'),
    User     = require(process.cwd() + '/models/user');

/**
 * Session Creation
 *
 * Refreshes latest, fresh session - or creates one if that's not available - and returns it
 * 
 * @param  {String|ObjectId} id User's id
 * @param  {Object} data        Data to be encoded in the User's token
 * @param  {String} modelName   Model to use - Optional
 * @param  {String} userType    User's type in reference to authorization middleware
 * @param  {String} userModel   User's model name (ex. User, Employee)
 * @return {Object}             Promise
 */
exports.create = function ( id, data, modelName, userType, userModel ) {
  return new Promise(function ( resolve, reject ) {
    if( !id ) {
      return reject( new Error('You must pass an id') );
    }

    data           = data || {};
    data.userType  = userType || 'admin';
    data.userModel = userModel || 'User';

    var now          = new Date(),
        SessionModel = ( modelName ) ? mongoose.model( modelName ) : Session;

    SessionModel.findOne({ user: id, expiration: { $gt: now } }).exec(function ( err, existingSession ) {
      if( err ) {
        return reject( err );
      }

      if( existingSession ) {
        return existingSession.refresh().then( resolve ).catch( reject );
      } else {
        var keypair = token.createKeypair( data );

        var session = new Session(_.merge({}, {
          user: id
        }, keypair));

        session.save(function ( err, newSession ) {
          if( err ) {
            return reject( err );
          }

          newSession.removeStale().then(function ( result ) {
            resolve( newSession );
          });
        });
      }
    });
  });
};

/**
 * Get Session
 * 
 * @param  {String} token     Public Key
 * @param  {String} modelName Model to use - Optional
 * @return {Object}           Promise
 */
exports.get = function ( token, modelName ) {
  return new Promise(function ( resolve, reject ) {
    if( !token ) {
      return reject( new Error('You must pass a token') );
    }

    var SessionModel = ( modelName ) ? mongoose.model( modelName ) : Session;

    SessionModel.findOne({ publicKey: token }).exec(function ( err, session ) {
      if( err ) {
        return reject( err );
      }

      if( !session ) {
        return resolve( session );
      }

      var sessionData = jwt.decode(session.publicKey, session.privateKey);

      SessionModel.populate(session, { path: 'user', model: sessionData.userModel }, function ( err, populatedSession ) {
        mongoose.model(sessionData.userModel).populate(populatedSession.user, { path: 'permissions' }, function ( err, populatedUser ) {
          if( err ) {
            return reject( err );
          }

          session.user = populatedUser;

          resolve( session );
        });
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
