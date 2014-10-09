var winston   = require('winston'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response');

var HistoryEvent = require('../models/history-event');

exports.fetchAll = function ( req, res, next ) {
  console.log(req.query);
  var query = req.query,
      limit = parseFloat(query.limit) || 1000,
      page  = parseFloat(query.page)  || 0,
      skip  = page * limit,
      sort  = query.sort || { time_stamp: 1 };

  delete query.limit;
  delete query.page;
  delete query.sort;

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

  HistoryEvent.find( query ).sort( sort ).skip( Math.abs(skip) ).limit( Math.abs(limit) ).exec(function ( err, records ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.json( normalize.historyEvent( records ) );
  });
};

exports.fetchByID = function ( req, res, next ) {
  var id = req.params.id;

  if( !id ) {
    return respond.error.res( res, 'Please specify an id in the url.' );
  }

  HistoryEvent.findById(id, function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.json( normalize.historyEvent( record ) );
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
