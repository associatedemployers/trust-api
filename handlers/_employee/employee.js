var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../../config/data-normalization'),
    respond   = require('../response'),
    _         = require('lodash');

var Employee      = require('../../models/employee'),
    Company       = require('../../models/company'),
    MedicalRate   = require('../../models/medical-rate'),
    ResourceMixin = require('../../lib/mixins/resource-handler');

exports.fetchByID = ResourceMixin.getById('Employee', 'plans.medical plans.dental plans.vision plans.life', null, 'logins');

exports.create = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.update = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.del = function ( req, res, next ) {
  respond.code.notimplemented(res);
};
