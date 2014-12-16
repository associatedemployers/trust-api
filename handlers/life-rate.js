var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response');

var LifeRate    = require('../models/life-rate'),
    ResourceMixin = require('../lib/mixins/resource-handler');

exports.fetchAll = ResourceMixin.getAll('LifeRate');
exports.fetchByID = ResourceMixin.getById('LifeRate');

exports.create = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.update = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.del = function ( req, res, next ) {
  respond.code.notimplemented(res);
};
