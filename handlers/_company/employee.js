var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../../config/data-normalization'),
    respond   = require('../response'),
    _         = require('lodash');

var Company       = require('../../models/company'),
    ResourceMixin = require('../../lib/mixins/resource-handler');

exports.fetchAll = function ( req, res, next ) {
  ResourceMixin.getAll('Employee', 'plans.medical plans.dental plans.vision plans.life', {
    company: req.session.user._id
  }).apply(this, arguments);
};
