var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
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
    return respond.error.res( res, 'Please specify an id in the url.' );
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
    return respond.error.res( res, 'Provide a payload with your request, prefixed with the type' );
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
  respond.code.notimplemented(res);
};

exports.del = function ( req, res, next ) {
  respond.code.notimplemented(res);
};
