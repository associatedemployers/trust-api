var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    bcp       = require('bcrypt'),
    Promise   = require('bluebird'), // jshint ignore:line
    _         = require('lodash');

var User    = require('../models/user'),
    session = require('../lib/security/session'),
    token   = require('../lib/security/token');

exports.login = function ( req, res, next ) {
  var payload = req.body;

  if( !payload.email ) {
    return respond.error.res( res, 'Please provide an email in your request' );
  }

  if( !payload.password ) {
    return respond.error.res( res, 'Please provide a password in your request' );
  }

  payload.email = payload.email.toLowerCase();

  User.findOne({ 'login.email': payload.email }).exec(function ( err, user ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    if( !user ) {
      return res.status(401).send('No user exists with that email.');
    }

    bcp.compare(payload.password, user.login.password, function ( err, isSame ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      if( !isSame ) {
        return res.status(401).send('Password does not match what we have on file.');
      }

      var sessionData = {
        userId: user._id.toString(),
        email:  user.email
      };

      session.retrieve( user._id, sessionData, 'Session' ).then(function ( userSession ) {
        res.json({
          token: userSession.publicKey,
          expiration: userSession.expiration
        });
      }).catch(function ( err ) {
        return respond.error.res( res, err, true );
      });
    });
  });
};
