var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    _         = require('lodash'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response');

var UserPermission  = require('../models/user-permission'),
    User            = require('../models/user'),
    ResourceMixin  = require('../lib/mixins/resource-handler'),
    PermissionGroup = require('../models/permission-group');

exports.fetchAll = ResourceMixin.getAll('UserPermission');
exports.fetchById = ResourceMixin.getById('UserPermission');

exports.create = function ( req, res, next ) {
  var payload = req.body.userPermission,
      availablePermissions = req.session.user.permissions;

  if( !payload ) {
    return respond.error.res(res, 'Provide a payload with your request, prefixed with the type');
  }

  delete payload._id;

  if( !payload.group || !payload.user || !payload.type || !payload.name ) {
    return respond.error.res(res, 'Invalid payload');
  }

  payload.type = payload.type.toLowerCase();

  if( !_hasMatchingPermission(availablePermissions, payload) ) {
    return res.status(401).send('You cannot create userPermissions you do not have yourself.');
  }

  User.findById(payload.user, function ( err, user ) {
    if( err ) {
      return respond.error.res(res, err, true);
    }

    if( !user ) {
      return respond.error.res(res, 'Could not find user' + payload.user);
    }

    var record = new UserPermission( payload );

    record.save(function ( err, record ) {
      if( err ) {
        return respond.error.res(res, err, true);
      }

      user.permissions.push( record._id );

      user.save(function ( err, userRecord ) {
        if( err ) {
          return respond.error.res(res, err, true);
        }

        res.status(201).send({
          userPermission: record
        });        
      });
    });
  });
};

exports.update = function ( req, res, next ) {
  var id = req.params.id,
      payload = req.body.userPermission,
      availablePermissions = req.session.user.permissions;

  if( !payload ) {
    return respond.error.res(res, 'Provide a payload with your request, prefixed with the type');
  }

  if( !id ) {
    return respond.error.res(res, 'Provide a valid id in your request');
  }

  if( !payload.group || !payload.user || !payload.type || !payload.name ) {
    return respond.error.res(res, 'Invalid payload');
  }

  payload.type = payload.type.toLowerCase();

  if( !_hasMatchingPermission(availablePermissions, payload) ) {
    return res.status(401).send('You cannot create userPermissions you do not have yourself.');
  }

  UserPermission.findById(id, function ( err, permission ) {
    if( err ) {
      return respond.error.res(res, err, true);
    }

    if( !permission ) {
      return respond.code.notfound(res);
    }

    delete payload._id;
    _.merge(permission, payload);

    permission.save(function ( err, record ) {
      if( err ) {
        return respond.error.res(res, err, true);
      }

      res.status(200).send({
        userPermission: record
      });
    });
  });
};

function _hasMatchingPermission ( available, requested ) {
  return !!_.find(available, function ( permission ) {
    return ( permission.group._id.toString() === requested.group.toString() && permission.type === requested.type );
  });
}
