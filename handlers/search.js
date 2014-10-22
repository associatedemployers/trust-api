var winston   = require('winston'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    _         = require('lodash'),
    Promise   = require('bluebird'), // jshint ignore:line
    mongoose  = require('../config/mongoose');

exports.search = function ( req, res, next ) {
  var query = req.query;

  var limit  = parseFloat(query.limit) || null,
      page   = parseFloat(query.page)  || 0,
      skip   = page * limit,
      models = query.models;

  if( models || !_.isArray( models ) || models.length < 1 ) {
    return respond.error.res( res, 'Please specify "models" in the request' );
  }

  //Promise.reduce()

  Company
  .find( query )
  .sort( sort )
  .skip( Math.abs( skip ) )
  .limit( Math.abs( limit ) )
  .select( select )
  .exec(function ( err, records ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.json( normalize.company( records ) );
  });
};
