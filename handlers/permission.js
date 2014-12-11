var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    _         = require('lodash'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response');

var UserPermission  = require('../models/user-permission'),
    PermissionGroup = require('../models/permission-group');

exports.fetchAll = function ( req, res, next ) {
  var user = req.session.user;

  UserPermission.populate(user.permissions, { path: 'group' }, function ( err, permissions ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    var permissionGroups = _.pluck(_.uniq(permissions, function ( permission ) {
      return permission.group._id;
    }), 'group');

    permissionGroups = permissionGroups.map(function ( group ) {
      var relevantPermissions = permissions.filter(function ( p ) {
        return p.group._id.toString() === group._id.toString();
      });

      group.permissions = group.permissions.filter(function ( permissionInGroup ) {
        var found = _.find( relevantPermissions, { type: permissionInGroup.type });
        return !!found;
      });

      return group;
    });

    res.json( normalize.permission( permissionGroups ) );
  });
};

exports.create = function ( req, res, next ) {
  var payload = req.body.permissionGroup;

    if( !req.session.user.super ) {
    return res.status(401).send('Users without "super" status are not allowed to create permissions');
  }

  if( !payload ) {
    return respond.error.res(res, 'Provide a payload with your request, prefixed with the type');
  }

  delete payload._id;

  var record = new PermissionGroup( payload );

  record.save(function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.status(201).send( normalize.permission( record ) );
  });
};

exports.update = function ( req, res, next ) {
  var payload = req.body.permissionGroup,
      id      = req.params.id;

  if( !req.session.user.super ) {
    return res.status(401).send('Users without "super" status are not allowed to edit permissions');
  }

  if( !payload ) {
    return respond.error.res(res, 'Provide a payload with your request, prefixed with the type');
  }

  if( !id ) {
    return respond.error.res(res, 'Missing information to complete request');
  }

  PermissionGroup.findById( id ).exec(function ( err, record ) {
    if( err ) {
      return respond.error.res(res, err, true);
    }

    if( !record ) {
      return res.status(404).send('That permission group was not found.');
    }

    record.permissions = payload.permissions;
    record.endpoints   = payload.endpoints;
    record.name        = payload.name;

    delete payload.permissions;
    delete payload._id;

    _.merge( record, payload );

    record.save(function ( err, record ) {
      if( err ) {
        return respond.error.res(res, err, true);
      }

      res.status(200).send( normalize.permission( record ) );
    });
  });
};

exports.del = function ( req, res, next ) {
  var payload = req.body.permissionGroup;

  if( !req.session.user.super ) {
    return res.status(401).send('Users without "super" status are not allowed to delete permissions');
  }

  if( !payload ) {
    return respond.error.res(res, 'Provide a payload with your request, prefixed with the type');
  }

  if( !payload._id ) {
    return respond.error.res(res, 'Missing information to complete request');
  }

  PermissionGroup.findById( payload._id ).exec(function ( err, record ) {
    if( err ) {
      return respond.error.res(res, err, true);
    }

    if( !record ) {
      return res.status(404).send('That permission group was not found.');
    }

    record.remove(function ( err/*, record*/ ) {
      if( err ) {
        return respond.error.res(res, err, true);
      }

      res.status(200).end();
    });
  });
};
