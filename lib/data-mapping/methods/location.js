/*
  Company Location Methods
*/

var Company = require(process.cwd() + '/models/company'),
    munger  = require('./helpers/munger'),
    toDate  = require('./helpers/to-date'),
    winston = require('winston'),
    chalk   = require('chalk'),
    moment  = require('moment'),
    _       = require('lodash');

var definition = {
  /* jshint ignore:start */
  EBMS_x0020_Number: 'ebmsNumber',
  CompanyNumber:     'legacyCompanyNumber',
  In_x003F_:         '-trash-', // In Montana, computed virtual
  Embedded_x003F_:   'boolean-embeddedDeductible',
  Inactive_x003F_:   'boolean-legacyInactive',
  CompanyName:       'legacyCompanyName', // Don't use this

  OfficeAddress: {
    inHash: 'address',
    toKey:  'line1'
  },
  OfficeAddress2: {
    inHash: 'address',
    toKey:  'line2'
  },
  OfficeCity: {
    inHash: 'address',
    toKey:  'city'
  },
  OfficeState: {
    inHash: 'address',
    toKey:  'state'
  },
  OfficeZip: {
    inHash: 'address',
    toKey:  'zipcode'
  },
  OfficePhone: {
    inHash: 'contact',
    toKey:  'phone'
  },
  OfficeFax: {
    inHash: 'contact',
    toKey:  'fax'
  },
  Effective_x0200_Date: the effective date from contact effective date
  Employee Life SITS ON DIFFERENT TABLE NOW…no longer need
  MinimumHours  SITS ON DIFFERENT TABLE NOW…no longer need
  SolePropriator  Y - is SP; N - is not SP
  Retires SITS ON DIFFERENT TABLE NOW…no longer need
  Add On Benefits NOT USED ANYMORE…no longer need
  Timestamp date/time entry is made
  /* jshint ignore:end */
};

exports.normalize = function ( hashes ) {
  return munger( definition, hashes );
};

exports.inject = function ( hashes, callback ) {
  var hashLen   = hashes.length,
      fulfilled = 0,
      locations = [];

  hashes.forEach(function ( hash ) {
    MedicalPlan.findOne({ 'name.company': hash.name.company }, function ( err, record ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      if( !record ) {
        record = new MedicalPlan( hash );
      } else {
        _.merge( record, hash );
      }

      record.save(function ( err, plan ) {
        if( err ) {
          winston.log('error', chalk.bgRed(err));
          throw new Error(err);
        }

        winston.info('Saved plan', plan.name);

        fulfilled++;
        plans.push( plan );

        if( hashLen === fulfilled ) {
          callback( plans );
        }
      });
    });
  });
};
