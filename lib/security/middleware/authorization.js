/*
  Authorization middleware
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    _       = require('lodash');

var UserPermission = require(process.cwd() + '/models/user-permission'),
    respond        = require(process.cwd() + '/handlers/response');

module.exports = function ( options ) {
  var _options = options || {};

  if( !_options.allow ) {
    winston.log('debug', chalk.dim('options.allow is not specified; will use defaults'));
  }

  _options.allow = _options.allow ? typeof _options.allow === 'string' ? [ _options.allow ] : _options.allow : [ 'admin' ];

  return function ( req, res, next ) {
    var _session = req.session,
        _user    = _session.user,
        base     = req.baseUrl.replace('/api', ''),
        path     = base + req.path,
        method   = req.method.toLowerCase();

    if ( _user.super === true ) {
      return next();
    }

    if( !_.includes(_options.allow, _user.type) ) {
      return res.status(401).send(_user.type + 's are not allowed to access ' + path);
    }

    if ( _options.authorizeMethods && !_.includes(_options.authorizeMethods, method) ) {
      return next();
    }

    var pathPattern = path.replace(/[a-f\d]{24}/i, ':id');

    pathPattern = new RegExp(pathPattern.split('/').filter(v => {
      return v.length > 0;
    }).map((v, index) => {
      var prefix = index === 0 ? '(\\/' : '(';
      return prefix + v + '*.\\/)';
    }).join(''), 'gi');

    if( !_user.permissions || !_.isArray(_user.permissions) ) {
      return res.status(401).send('You do not have permissions');
    }

    UserPermission.populate(_user.permissions, { path: 'group' }, function ( err, permissions ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      var permission = _.find(permissions, userPermission => {
        var endpointExists = userPermission.group.endpoints.reduce((exists, endpoint) => {
          var _ep = endpoint;

          if ( _ep.charAt(_ep.length - 1) !== '/' ) {
            _ep += '/';
          }

          return exists === true ? true : pathPattern.test(_ep);
        }, false);

        return userPermission.type === method && endpointExists;
      });

      if( !permission ) {
        return res.status(401).send('You do not have the proper method permission to ' + method.toUpperCase() + ' "' + path + '"' );
      }

      req.permission = permission;

      next();
    });
  };
};
