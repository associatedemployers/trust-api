var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    bcp       = require('bcrypt'),
    Promise   = require('bluebird'), // jshint ignore:line
    _         = require('lodash');

var User    = require('../models/user'),
    Session = require('../models/session'),
    token   = require('../lib/security/token');

exports.login = function ( req, res, next ) {
  var payload = req.body;

  if( !payload.email ) {
    return respond.error.res( res, 'Please provide an email in your request' );
  }

  if( !payload.password ) {
    return respond.error.res( res, 'Please provide a password in your request' );
  }

  User.find({ email: payload.email }).exec(function ( err, user ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    if( !user ) {
      return respond.code.notfound( res );
    }

    bcp.compare(payload.password, user.password, function ( err, isSame ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      if( !isSame ) {
        return respond.status(401).send('Password does not match what we have on file.');
      }

      getSession( user ).then(function ( session ) {

        // TODO: this

      }).catch(function ( err ) {
        return respond.error.res( res, err, true );
      });

    });
  });

};


// TODO: finish and move below to session module

/**
 * Deals with session retrieval/creation
 * @param  {[type]} user [description]
 * @return {[type]}      [description]
 */
function getSession ( user ) {
  return new Promise(function ( resolve, reject ) {
    var now = new Date();

    Session.findOne({ user: user._id, expiration: { $gt: now } }).exec(function ( err, existingSession ) {
      if( err ) {
        return reject( err );
      }

      if( existingSession ) {
        existingSession.expiration = undefined; // Forces a regeneration of the expiration field ( refresh time )
      }

      var session = existingSession || new Session({

      });

      session.save(function ( err, newSession ) {
        if( err ) {
          return reject( err );
        }


      });

    });

  });
}
