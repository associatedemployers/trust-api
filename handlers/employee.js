var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    _         = require('lodash');

var Employee      = require('../models/employee'),
    Company       = require('../models/company'),
    MedicalRate   = require('../models/medical-rate'),
    ResourceMixin = require('../lib/mixins/resource-handler');

exports.fetchAll = ResourceMixin.getAll('Employee', 'plans.medical plans.dental plans.vision plans.life');
exports.fetchByID = ResourceMixin.getById('Employee', 'plans.medical plans.dental plans.vision plans.life');

exports.create = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.update = function ( req, res, next ) {
  var payload = req.body.employee;

  if( !payload ) {
    return respond.error.res( res, 'Provide a payload with your request, prefixed with the type' );
  }

  if( !payload._id ) {
    return respond.error.res( res, 'Please provide an id with your UPDATE/PUT request' );
  }

  Employee
  .findById( payload._id )
  .exec(function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    // Read-only
    delete payload._id;

    // Merge the payload
    record = _.merge( record, payload );

    record.save(function ( err, updated ) {
      if( err ) {
        return respond.error.res( res, err );
      }

      Employee
      .findById( updated._id )
      .populate('plans.medical plans.dental plans.vision plans.life')
      .exec(function ( err, updated ) {
        if( err ) {
          return respond.error.res( res, err );
        }

        res.send( normalize.employee( updated ) );
      });
    });
  });
};

exports.del = function ( req, res, next ) {
  var payload = req.body.employee;

  if( !payload ) {
    return respond.error.res( res, 'Provide a payload with your request, prefixed with the type' );
  }

  if( !payload._id ) {
    return respond.error.res( res, 'Please provide an id with your DELETE request' );
  }

  Employee
  .findByIdAndRemove( payload._id )
  .exec(function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    respond.code.ok( res );
  });
};
