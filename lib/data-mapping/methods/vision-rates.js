/*
  Company Vision Rate Methods
*/

var locdir = process.cwd();

var VisionRate  = require(locdir + '/models/vision-rate'),
    CompanyPlan = require(locdir + '/models/company-plan'),
    munger      = require('./helpers/munger'),
    winston     = require('winston').loggers.get('default'),
    chalk       = require('chalk'),
    moment      = require('moment'),
    indexOfId   = require(locdir + '/lib/utilities/find-by-objectid'),
    Promise     = require('bluebird'), // jshint ignore:line
    _           = require('lodash');

var definition = {
  VisionNumber: 'planNumber',
  Deductable:   'deductible', // XML data typo
  Description:  'name',

  // Actual Rates
  EmpRate: {
    normalize: toNum,
    serialize: toStr,
    toKey: 'employee'
  },
  SpRate: {
    normalize: toNum,
    serialize: toStr,
    toKey: 'employeeAndSpouse'
  },
  DepRate: {
    normalize: toNum,
    serialize: toStr,
    toKey: 'employeeAndChildren'
  },
  FamRate: {
    normalize: toNum,
    serialize: toStr,
    toKey: 'family'
  }
};

exports.normalize = function ( hashes ) {
  return munger( definition, hashes );
};

exports.inject = function ( hashes, callback ) {
  var hashLen   = hashes.length,
      fulfilled = 0,
      rates     = [];

  hashes.forEach(function ( hash ) {
    hash.voluntary = hash.name.toLowerCase().indexOf('voluntary') > -1;

    VisionRate.findOne({ planNumber: hash.planNumber }, function ( err, rate ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      CompanyPlan.find({ legacyPlanNumber: hash.planNumber }).populate('company').exec(function ( err, linkers ) {
        if( err ) {
          winston.log('error', chalk.bgRed(err));
          throw new Error(err);
        }

        if( !rate ) {
          rate = new VisionRate( hash );
        } else {
          _.merge( rate, hash );
        }

        linkers.forEach(function ( linker ) {

          // Init array if it doesn't exist yet
          if( !_.isArray( rate.companies ) ) {
            rate.companies = [];
          }
          // Check for company link and push it if we don't one
          if( indexOfId( rate.companies, linker.company._id ) < 0 ) {
            rate.companies.push( linker.company );
          }

        });

        rate.save(function ( err, rateRecord ) {
          if( err ) {
            winston.log('error', chalk.bgRed(err));
            throw new Error(err);
          }

          var saveQueue = [];

          // Make sure the linkers are unique by the linker.company._id
          linkers = _.uniq(linkers, function ( linker ) {
            return linker.company._id;
          });

          linkers.forEach(function ( linker ) {

            // Setup company w/ the vision rate
            if( !_.isArray( linker.company.visionRates ) ) {
              linker.company.visionRates = [];
            }

            if( indexOfId( linker.company.visionRates, rateRecord._id ) < 0 ) {
              linker.company.visionRates.push( rateRecord._id );
              // Push a save promise into a saveQueue
              saveQueue.push( _saveCompany( linker.company ) );
            }

          });

          var wrapItUp = function ( /* Company Record */ ) {
            fulfilled++;
            rates.push( rateRecord );

            if( hashLen === fulfilled ) {
              console.log( rateRecord );
              callback( rates );
            }
          };

          Promise.all( saveQueue ).then( wrapItUp ).catch(function ( err ) {
            // We don't need to abort the entire
            // operation if something goes wrong.
            winston.log('error', chalk.bgRed(err));
            // Run the callback
            wrapItUp();
          });

        }); // rate.save
      }); // CompanyPlan.findOne
    }); // VisionRate.findOne
  }); // hashes.forEach
};

function toNum ( str ) {
  return parseFloat(str);
}

function toStr ( num ) {
  return num.toString();
}

function _saveCompany ( company ) {
  return new Promise(function ( resolve, reject ) {
    if( !company ) {
      return reject('Need company to save');
    }

    company.save(function ( err, record ) {
      if( err ) {
        reject( err );
      } else {
        resolve( record );
      }
    });
  });
}
