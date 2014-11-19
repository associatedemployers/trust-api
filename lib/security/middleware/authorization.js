/*
  Authorization middleware
*/

var winston = require('winston').loggers.get('default'),
    chalk   = require('chalk'),
    Promise = require('bluebird'), // jshint ignore:line
    _       = require('lodash');

var session        = require('../session'),
    UserPermission = require(process.cwd() + '/models/user-permission'),
    respond        = require(process.cwd() + '/handlers/response');

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
        path     = '/' + req.path.replace('/api', '').split('/')[1],
        method   = req.method.toLowerCase();

    if( !_user.permissions || !_.isArray( _user.permissions ) ) {
      return res.status(401).send('You do not have permissions');
    }

    if( !_.contains( options.allow, _user.type ) ) {
      return res.status(401).send(_user.type + 's are not allowed to access ' + path);
    }

    UserPermission.populate(_user.permissions, { path: 'group' }, function ( err, permissions ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      var permission = _.find(permissions, function ( userPermission ) {
        return !( userPermission.type !== method || !_.contains( userPermission.group.endpoints, path ) );
      });

      if( !permission ) {
        return res.status(401).send('You do not have the proper method permission to ' + method.toUpperCase() + ' "' + path + '"' );
      }

      req.permission = permission;

      next();
    });
  };
};
