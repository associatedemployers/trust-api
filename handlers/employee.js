var winston   = require('winston'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response');

var Employee = require('../models/employee');
var Company  = require('../models/company');
var MedicalRate = require('../models/medical-rate');

exports.fetchAll = function ( req, res, next ) {
  var query = req.query,
      limit = parseFloat(query.limit) || 1000,
      page  = parseFloat(query.page)  || 0,
      skip  = page * limit;

  delete query.limit;
  delete query.page;
  console.log(query, limit, page, skip);

  Employee.find( query ).skip( skip ).limit( limit ).exec(function ( err, records ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.json( normalize.employee( records ) );
  });
};

exports.fetchByID = function ( req, res, next ) {
  respond.code.notimplemented(res);
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
