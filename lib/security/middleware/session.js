/*
  Session middleware
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    Promise = require('bluebird'), // jshint ignore:line
    _       = require('lodash');

var session = require('../session'),
    respond = require(process.cwd() + '/handlers/response'),
    jwt     = require('jwt-simple');

/**
 * Generates a session middleware function
 * 
 * @param  {String}   modelName Model to use
 * @param  {Boolean}  refreshes Should refresh the session?
 * @return {Function}
 */
var generator = module.exports = function ( modelName, refreshes ) {
  return function ( req, res, next ) {
    var token = req.header('X-API-Token'),
        modelName = modelName || 'Session',
        refreshes = ( refreshes === undefined ) ? true : refreshes;

    if( !token ) {
      return res.status(401).send('This resource requires the "X-API-Token" header with a fresh and relevant session\'s token');
    }

    var allErrors = function ( err ) {
      return respond.error.res( res, err, true );
    };

    session.get( token ).then(function ( userSession ) {
      if( !userSession ) {
        return res.status(401).send('The token you supplied could not be found - The session is either expired or non-existant');
      }

      if( userSession.isExpired ) {
        return res.status(401).send('Your session has expired');
      }

      var attachAndNext = function () {
        req.session = userSession;
        next();
      };

      if( refreshes ) {
        userSession.refresh().then( attachAndNext );
      } else {
        attachAndNext();
      }
    }).catch( allErrors );
  };
};
