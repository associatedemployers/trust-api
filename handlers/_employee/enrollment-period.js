var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../../config/data-normalization'),
    respond   = require('../response'),
    _         = require('lodash');

var ResourceMixin = require('../../lib/mixins/resource-handler');

exports.fetchAll = ResourceMixin.getAll('EnrollmentPeriod');
exports.fetchByID = ResourceMixin.getById('EnrollmentPeriod');
