var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    _         = require('lodash'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response');

var PermissionGroup = require('../models/permission-group');

exports.fetchAll = function ( req, res, next ) {
  var query  = {};

  if( req.query.ids ) {
    query._id = {
      $in: req.query.ids
    };
  }

  PermissionGroup
  .find( query )
  .exec(function ( err, records ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    PermissionGroup.count( query, function ( err, count ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      res.json( normalize.permission( records, { totalRecords: count } ) );
    });
  });
};

exports.fetchByID = function ( req, res, next ) {
  var id = req.params.id;

  if( !id ) {
    return respond.error.res(res, 'Please specify an id in the url.');
  }

  PermissionGroup.findById(id, function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.json( normalize.permission( record ) );
  });
};

exports.create = function ( req, res, next ) {
  var payload = req.body.permissionGroup;

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
  var payload = req.body.permissionGroup;

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

    record.permissions = payload.permissions;

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
