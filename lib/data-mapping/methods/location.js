/*
  Company Location Methods
*/

var Company         = require(process.cwd() + '/models/company'),
    CompanyLocation = require(process.cwd() + '/models/location'),
    munger          = require('./helpers/munger'),
    toDate          = require('./helpers/to-date'),
    winston         = require('winston'),
    chalk           = require('chalk'),
    moment          = require('moment'),
    indexOfId       = require(locdir + '/lib/utilities/find-by-objectid'),
    _               = require('lodash');

var definition = {
  EBMS_x0020_Number: 'ebmsNumber',
  CompanyNumber:     'legacyCompanyNumber',
  Embedded_x003F_:   'boolean-embeddedDeductible',
  Inactive_x003F_:   'boolean-legacyInactive',
  CompanyName:       'legacyCompanyName',          // Don't use this
  SolePropriator:    'boolean-soleProprietorship', // XML Key Typo

  In_x003F_:                   '-trash-',          // In Montana, computed virtual
  Employee_x0200_Life:         '-trash-',
  MinimumHours:                '-trash-',
  Retires:                     '-trash-',
  Add_x0200_On_x0200_Benefits: '-trash-',

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

  Effective_x0200_Date: _.merge( {}, toDate, { toKey: 'legacyEffectiveDate'}),
  Timestamp:            _.merge( {}, toDate, { toKey: 'time_stamp'})
};

exports.normalize = function ( hashes ) {
  return munger( definition, hashes );
};

exports.inject = function ( hashes, callback ) {
  var hashLen   = hashes.length,
      fulfilled = 0,
      locations = [];

  hashes.forEach(function ( hash ) {
    CompanyLocation.findOne({ ebmsNumber: hash.ebmsNumber }, function ( err, record ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      if( !record ) {
        record = new CompanyLocation( hash );
      } else {
        _.merge( record, hash );
      }

      record.save(function ( err, record ) {
        if( err ) {
          winston.log('error', chalk.bgRed(err));
          throw new Error(err);
        }

        Company.findOne({ legacyCompanyNumber: hash.legacyCompanyNumber }, function ( err, company ) {
          if( err ) {
            winston.log('error', chalk.bgRed(err));
            throw new Error(err);
          }

          if( !company ) {
            fulfilled++;
            return winston.log('warning', chalk.bgYellow('No company for location. EBMS #', hash.ebmsNumber));
          }

          if( indexOfId( company.locations, record._id ) < 0 ) {
            company.locations.push( record._id );
          }

          record.company = company._id;

          record.save(function ( err, record ) {
            if( err ) {
              winston.log('error', chalk.bgRed(err));
              throw new Error(err);
            }

            winston.log('info', chalk.dim( 'Saved CompanyLocation', record.ebmsNumber, '-', fulfilled, 'of', hashLen ));

            fulfilled++;
            locations.push( record );

            if( hashLen === fulfilled ) {
              callback( locations );
            }
          }); // record.save
        }); // Company.findOne
      }); // record.save
    }); // CompanyLocation.findOne
  }); // hashes.forEach
};
