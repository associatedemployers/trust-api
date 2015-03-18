var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../../config/data-normalization'),
    respond   = require('../response'),
    _         = require('lodash');

var Company       = require('../../models/company'),
    ResourceMixin = require('../../lib/mixins/resource-handler');

exports.fetchByID = ResourceMixin.getById('Company', 'medicalRates dentalRates visionRates', null, 'logins', 'login.password');

exports.update = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.del = function ( req, res, next ) {
  respond.code.notimplemented(res);
};
