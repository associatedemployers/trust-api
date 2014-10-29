/*
  Company Medical Rate Methods
*/

var locdir = process.cwd();

var MedicalRate = require(locdir + '/models/medical-rate'),
    Company     = require(locdir + '/models/company'),
    MedicalPlan = require(locdir + '/models/medical-plan'),
    CompanyPlan = require(locdir + '/models/company-plan'),
    munger      = require('./helpers/munger'),
    winston     = require('winston').loggers.get('default'),
    chalk       = require('chalk'),
    moment      = require('moment'),
    indexOfId   = require(locdir + '/lib/utilities/find-by-objectid'),
    _           = require('lodash');

var definition = {
  Plan_x0020__x0023_: 'planNumber',
  PlanNumber:         'planNumber',
  Network:            'legacyNetwork',
  COINS:              'coInsurance',
  Deductable:         'deductible', // XML data typo
  Description:        'name',

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
  },

  OldEmpRate:        'legacyOldEmployeeRate',
  OldSpRate:         'legacyOldEmployeeAndSpouseRate',
  OldDepRate:        'legacyOldEmployeeAndChildrenRate',
  OldFamRate:        'legacyOldFamilyRate',
  RateChangeEmpRate: 'legacyRateChangeEmployeeRate',
  RateChangeSpRate:  'legacyRateChangeEmployeeAndSpouseRate',
  RateChangeDepRate: 'legacyRateChangeEmployeeAndChildrenRate',
  RateChangeFamRate: 'legacyRateChangeFamilyRate'
};

exports.normalize = function ( hashes ) {
  return munger( definition, hashes );
};

exports.inject = function ( hashes, callback ) {
  var hashLen   = hashes.length,
      fulfilled = 0,
      rates     = [];

  hashes.forEach(function ( hash ) {
    MedicalPlan.findOne({ name: hash.legacyNetwork }, function ( err, plan ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      if( !plan ) {
        winston.log('warning', chalk.bgRed('No Medical Plan found for', hash.legacyNetwork));
      } else {
        hash.plan = plan._id;
      }

      MedicalRate.findOne({ planNumber: hash.planNumber }, function ( err, rate ) {
        if( err ) {
          winston.log('error', chalk.bgRed(err));
          throw new Error(err);
        }

        CompanyPlan.findOne({ legacyPlanNumber: hash.planNumber }, function ( err, linker ) {
          if( err ) {
            winston.log('error', chalk.bgRed(err));
            throw new Error(err);
          }

          if( !linker ) {
            fulfilled++;
            return winston.log('warning', chalk.bgYellow('No CompanyPlan (linker) for MedicalRate', hash.planNumber));
          }

          if( !rate ) {
            rate = new MedicalRate( hash );
          } else {
            _.merge( rate, hash );
          }

          rate.ebmsNumber = linker.legacyEbmsNumber;

          rate.save(function ( err, rateRecord ) {
            if( err ) {
              winston.log('error', chalk.bgRed(err));
              throw new Error(err);
            }

            winston.info(chalk.dim(fulfilled, '/', hashLen, '-', 'Saved medical rate', rateRecord.planNumber, '-- Applying to company...'));

            Company.findById(linker.company, function ( err, company ) {
              if( err ) {
                winston.log('error', chalk.bgRed(err));
                throw new Error(err);
              }

              if( !company ) {

                winston.log('error', chalk.bgRed('No Company found for', rate.legacyCompanyNumber, 'Skipping...'));

                fulfilled++;
                rates.push( rateRecord );

                if( hashLen === fulfilled ) {
                  return callback( rates );
                }

              } else {

                if( _.isArray( company.medicalRates ) ) {
                  if( indexOfId( company.medicalRates, rateRecord._id ) < 0 ) {
                    // Create Rate in Company record
                    company.medicalRates.push( rateRecord._id );
                  }
                } else {
                  winston.log('info', chalk.bgYellow('Found company w/o medicalRate array'));
                  company.medicalRates = [];
                  company.medicalRates.push( rateRecord._id );
                } // if( _.isArray...

                company.save(function ( err, companyRecord ) {
                  if( err ) {
                    winston.log('error', chalk.bgRed(err));
                    throw new Error(err);
                  }

                  winston.info(chalk.dim(fulfilled, '/', hashLen, '-', 'Saved company', companyRecord.name.company));

                  rateRecord.company = companyRecord._id;

                  rateRecord.save(function ( err, finalRecord ) {
                    if( err ) {
                      winston.log('error', chalk.bgRed(err));
                      throw new Error(err);
                    }

                    fulfilled++;
                    rates.push( finalRecord );

                    if( hashLen === fulfilled ) {
                      console.log( finalRecord );
                      callback( rates );
                    }
                  }); // rateRecord.save
                }); // company.save
              } // if( !company )      
            }); // Company.findOne
          }); // rate.save
        }); // CompanyPlan.findOne
      }); // MedicalRate.findOne
    }); // MedicalPlan.findOne
  }); // hashes.forEach
};

function toNum ( str ) {
  return parseFloat(str);
}

function toStr ( num ) {
  return num.toString();
}
