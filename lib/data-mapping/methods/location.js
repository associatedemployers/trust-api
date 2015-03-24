/*
  Company Location Methods
*/

var locdir = process.cwd();

var Company         = require(locdir + '/models/company'),
    CompanyLocation = require(locdir + '/models/location'),
    munger          = require('./helpers/munger'),
    toDate          = require('./helpers/to-date'),
    winston         = require('winston').loggers.get('default'),
    chalk           = require('chalk'),
    moment          = require('moment'),
    indexOfId       = require(locdir + '/lib/utilities/find-by-objectid'),
    Promise         = require('bluebird'), // jshint ignore:line
    _               = require('lodash');

var definition = {
  EBMS_x0020_Number: 'ebmsNumber',
  CompanyNumber:     'legacyCompanyNumber',
  Embedded_x003F_:   'boolean-embeddedDeductible',
  Inactive_x003F_:   'boolean-legacyInactive',
  CompanyName:       'legacyCompanyName',          // Don't use this
  SolePropriator:    'boolean-soleProprietorship', // XML Key Typo

  In_x003F_:                   '-trash-',          // In Montana, computed virtual
  Employee_x0020_Life:         '-trash-',
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

  Effective_x0020_Date: _.merge( {}, toDate, { toKey: 'legacyEffectiveDate'}),
  Timestamp:            _.merge( {}, toDate, { toKey: 'time_stamp'})
};

exports.normalize = function ( hashes ) {
  return munger( definition, hashes );
};

exports.inject = function ( hashes, callback ) {
  Promise.reduce(hashes, _reduce, []).then(callback).catch(function ( err ) {
    winston.log('error', chalk.bgRed(err.stack));
  });
};

function _reduce ( ret, hash ) {
  return _insert(hash).then(function ( record ) {
    if ( record ) {
      ret.push(record);
    }

    return ret;
  });
}

function _insert ( hash ) {
  return new Promise(function ( resolve ) {
    var q = ( hash.address ) ? {
      'address.line1': hash.address.line1,
      'address.city': hash.address.city,
      'address.state': hash.address.state,
      'address.zipcode': hash.address.zipcode
    } : {
      'address.line1': { $exists: false }
    };

    CompanyLocation.findOne(_.merge({
      legacyCompanyNumber: hash.legacyCompanyNumber.toString()
    }, q), function ( err, record ) {
      if ( err ) {
        throw new Error(err);
      }

      if ( !record ) {
        hash.ebmsNumbers = [ hash.ebmsNumber ];
        delete hash.ebmsNumber;
        record = new CompanyLocation( hash );
      } else if ( record.ebmsNumbers.indexOf(hash.ebmsNumber) < 0 ) {
        record.ebmsNumbers.push(hash.ebmsNumber);
      }

      record.save(function ( err, record ) {
        if ( err ) {
          throw new Error(err);
        }

        Company.findOne({ legacyCompanyNumber: hash.legacyCompanyNumber }, function ( err, company ) {
          if ( err ) {
            throw new Error(err);
          }

          if ( !company ) {
            winston.log('error', chalk.bgYellow('No company for location. EBMS #', hash.ebmsNumber));
            return resolve();
          }

          if ( indexOfId( company.locations, record._id ) < 0 ) {
            company.locations.push( record._id );
          }

          company.save(function ( err, comp ) {
            record.company = company._id;

            record.save(function ( err, record ) {
              if ( err ) {
                throw new Error(err);
              }

              winston.log('info', chalk.dim( 'Saved CompanyLocation for company', record.legacyCompanyNumber));

              resolve(record);
            }); // record.save
          });
        }); // Company.findOne
      }); // record.save
    }); // CompanyLocation.findOne
  });
}
