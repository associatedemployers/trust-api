var winston = require('winston'),
    chalk   = require('chalk'),
    respond = require('./response');

var Employee = require('../models/employee');

exports.fetchAll = function (req, res, next) {
  var query = req.query;

  Employee.find(query).exec(function ( err, records ) {
    if( err ) {
      //TODO
    }

    //TODO
  });
};

exports.fetchByID = function (req, res, next) {
  respond.code.notimplemented(res);
};

exports.create = function (req, res, next) {
  respond.code.notimplemented(res);
};

exports.update = function (req, res, next) {
  respond.code.notimplemented(res);
};

exports.del = function (req, res, next) {
  respond.code.notimplemented(res);
};