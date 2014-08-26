var winston   = require('winston'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    Promise   = require('promise'), // jshint ignore:line
    _         = require('lodash');

var modelCounter = require('../lib/utilities/model-counter');

exports.fetchStats = function ( req, res, next ) {
  var models = req.query.models;

  if( !models ) {
    respond.error.res(res, 'Cannot retrieve stats for empty models query. Please specify models.', false);
  }

  modelCounter.count( models ).then(function ( counts ) {
    var o = {};

    counts.forEach(function ( count ) {
      _.merge(o, count);
    });

    res.json( o );
  }).catch(function ( err ) {
    respond.error.res( res, err, true );
  });
};
