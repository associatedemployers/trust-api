var winston   = require('winston'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response');

var Company     = require('../models/company');

exports.fetchAll = function ( req, res, next ) {
  var query = req.query,
      limit = parseFloat(query.limit) || 1000,
      page  = parseFloat(query.page)  || 0,
      skip  = page * limit;

  if( req.query.ids ) {
    query._id = {
      $in: req.query.ids
    };

    delete query.ids;
  }

  delete query.limit;
  delete query.page;

  console.log(query, limit, page, skip);

  Company.find( query ).skip( Math.abs(skip) ).limit( Math.abs(limit) ).exec(function ( err, records ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.json( normalize.company( records ) );
  });
};

exports.fetchByID = function ( req, res, next ) {
  var id = req.params.id;

  if( !id ) {
    return respond.error.res( res, 'Please specify an id in the url.' );
  }

  Company.findById(id, function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.json( normalize.company( record ) );
  });
};

exports.create = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.update = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.del = function ( req, res, next ) {
  respond.code.notimplemented(res);
};
