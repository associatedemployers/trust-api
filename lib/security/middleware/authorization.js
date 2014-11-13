/*
  Authorization middleware
*/

var winston = require('winston').loggers.get('default'),
    chalk   = require('chalk'),
    Promise = require('bluebird'), // jshint ignore:line
    _       = require('lodash');

var session = require('../session'),
    respond = require(process.cwd() + '/handlers/response');

var generator = module.exports = function ( options ) {
  // Defaults
  options = options || {};

  if( !options.allow ) {
    winston.log('debug', chalk.dim('options.allow is not specified; will use defaults'));
  }

  options.allow = ( options.allow ) ? ( typeof options.allow === 'string' ) ? [ options.allow ] : options.allow : [ 'admin' ];

  return function ( req, res, next ) {
    var _session = req.session,
        _user    = _session.user,
        path     = req.path.replace('/api', ''),
        method   = req.method.toLowerCase(),
        setIndex;

    if( !_user.permissions || !_.isArray( _user.permissions ) ) {
      return res.status(401).send('You do not have permissions');
    }

    if( !_.contains( options.allow, _user.type ) ) {
      return res.status(401).send(_user.type + 's are not allowed to access ' + path);
    }

    var permission = _.find(_user.permissions, function ( permissionGroup ) {
      if( !_.contains( permissionGroup.endpoints, path ) ) {
        return false;
      }

      var index = _.findIndex(permissionGroup.permissions, { type: method });
      
      if( index > -1 ) {
        setIndex = index;
      }

      return true;
    });

    if( !permission ) {
      return res.status(401).send('You do not have the proper permission group to access "' + path + '"');
    } else if( setIndex === undefined || setIndex < 0 ) {
      return res.status(401).send('You do not have the proper method permission to ' + method.toUpperCase() + ' "' + path + '"' );
    }

    req.permission = {
      group: permission,
      set:   permission.permissions[ setIndex ]
    };

    next();
  };
};
