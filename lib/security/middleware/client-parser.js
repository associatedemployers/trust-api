/*
  Client parser middleware
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    Promise = require('bluebird'), // jshint ignore:line
    _       = require('lodash');

var session = require('../session'),
    respond = require(process.cwd() + '/handlers/response'),
    getPath = require(process.cwd() + '/lib/utilities/get-path');

/**
 * Generates a client parser middleware function
 * 
 * @param  {String}   paramPath  Path to parameter to restrict
 * @param  {String}   clientPath Path to field to restrict by
 * @return {Function}
 */
var generator = module.exports = function ( paramPath, clientPath ) {
  return function ( req, res, next ) {
    var requester = req.session.user,
        param     = getPath.call( req.params, paramPath ),
        client    = getPath.call( requester, clientPath );

    if ( !param || !client || param.toString() !== client.toString() ) {
      return respond.code.notauthorized(res, 'You are not authorized to access resource with ' + paramPath + ' of ' + client.toString() );
    }

    next();
  };
};
