var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response');

var Company       = require('../models/company'),
    ResourceMixin = require('../lib/mixins/resource-handler');

exports.fetchAll = ResourceMixin.getAll('Company');

exports.fetchByID = ResourceMixin.getById('Company');

exports.create = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.update = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.del = function ( req, res, next ) {
  respond.code.notimplemented(res);
};
