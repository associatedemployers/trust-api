/*
  Company Plan Methods
  ---
  NOTE: This object is temporarily stored for use by the rates
*/

var CompanyPlan     = require(process.cwd() + '/models/company-plan'),
    CompanyLocation = require(process.cwd() + '/models/location'),
    munger          = require('./helpers/munger'),
    toDate          = require('./helpers/to-date'),
    winston         = require('winston'),
    chalk           = require('chalk'),
    moment          = require('moment'),
    _               = require('lodash');

var definition = {
  EBMS_x0020_Number:  'legacyEbmsNumber',
  Plan_x0020__x0023_: 'legacyPlanNumber',
  Plan_x0020_Type:    'legacyPlanType',
  Description:        'legacyDescription',
  Network:            'legacyNetwork'
};

exports.normalize = function ( hashes ) {
  return munger( definition, hashes );
};

exports.inject = function ( hashes, callback ) {
  var hashLen   = hashes.length,
      fulfilled = 0,
      plans     = [];

  hashes.forEach(function ( hash ) {
    CompanyPlan.findOne({ legacyEbmsNumber: hash.legacyEbmsNumber }, function ( err, record ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      if( !record ) {
        record = new CompanyPlan( hash );
      } else {
        _.merge( record, hash );
      }

      // Fetch this for the record.company value
      CompanyLocation.findOne({ ebmsNumber: hash.legacyEbmsNumber }, function ( err, location ) {
        if( err ) {
          winston.log('error', chalk.bgRed(err));
          throw new Error(err);
        }

        record.company = location.company;

        record.save(function ( err, plan ) {
          if( err ) {
            winston.log('error', chalk.bgRed(err));
            throw new Error(err);
          }

          winston.info('Saved company plan for plan # ', plan.legacyPlanNumber);

          fulfilled++;
          plans.push( plan );

          if( hashLen === fulfilled ) {
            callback( plans );
          }
        }); // record.save
      }); // CompanyLocation.findOne
    }); // CompanyPlan.findOne
  }); // hashes.forEach
};
