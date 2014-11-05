var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response');

var MedicalRate = require('../models/medical-rate');

exports.fetchAll = function ( req, res, next ) {
  var query  = req.query,
      limit  = parseFloat(query.limit) || null,
      page   = parseFloat(query.page)  || 0,
      select = query.select || '',
      skip   = page * limit,
      sort   = query.sort || { time_stamp: 1 };

  if( req.query.ids ) {
    query._id = {
      $in: req.query.ids
    };

    delete query.ids;
  }

  delete query.limit;
  delete query.page;
  delete query.sort;
  delete query.select;

  for ( var key in query ) {
    var v = query[ key ];
    if( v === 'exists' ) {
      query[ key ] = {
        $exists: true
      };
    } else if ( v === 'nexists' ) {
      query[ key ] = {
        $exists: false
      };
    }
  }

  console.log(query, limit, page, skip);

  MedicalRate
  .find( query )
  .sort( sort )
  .skip( Math.abs( skip ) )
  .limit( Math.abs( limit ) )
  .select( select )
  .exec(function ( err, records ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    MedicalRate.count( query, function ( err, count ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      res.json( normalize.medicalRate( records, { totalRecords: count } ) );
    });
  });
};

exports.fetchByID = function ( req, res, next ) {
  var id = req.params.id;

  if( !id ) {
    return respond.error.res( res, 'Please specify an id in the url.' );
  }

  MedicalRate.findById(id, function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.json( normalize.medicalRate( record ) );
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
