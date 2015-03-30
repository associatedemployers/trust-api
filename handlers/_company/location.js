var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../../config/data-normalization'),
    respond   = require('../response'),
    _         = require('lodash');

var Company       = require('../../models/company'),
    ResourceMixin = require('../../lib/mixins/resource-handler');

exports.fetchAll = function ( req, res, next ) {
  ResourceMixin.getAll('Location', null, {
    company: req.session.user._id
  }).apply(this, arguments);
};
