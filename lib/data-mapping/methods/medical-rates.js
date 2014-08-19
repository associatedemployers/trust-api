/*
  Company Medical Rate Methods
*/

var Company = require(process.cwd() + '/models/company'),
    munger  = require('./munger'),
    winston = require('winston'),
    chalk   = require('chalk'),
    moment  = require('moment'),
    _       = require('lodash');

var definition = {
  CompanyNumber: 'legacyCompanyNumber',
  EBMS_x0020_Number: 'ebmsNumber',
  Plan_x0020__x0023_: 'planNumber',
  Plan_x0020_Type: '-trash-',
  Network: 'network',
  COINS: 'coInsurance',
  Deductable: 'deductible', // XML data typo
  Description: 'legacyDescription',

  // Actual Rates
  EmpRate: {
    normalize: toNum,
    serialize: toStr,
    toKey: 'employer'
  },
  SpRate: {
    normalize: toNum,
    serialize: toStr,
    toKey: 'dunno'
  },
  DepRate: {
    normalize: toNum,
    serialize: toStr,
    toKey: 'dependent'
  },
  FamRate: {
    normalize: toNum,
    serialize: toStr,
    toKey: 'Family'
  }
};

exports.normalize = function ( hashes ) {
  return munger( definition, hashes );
}

exports.inject = function ( hashes, callback ) {
  var hashLen   = hashes.length,
      fulfilled = 0,
      companies = [];

  hashes.forEach(function ( hash ) {
    Company.findOne({ name: hash.name }, function ( err, record ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      if( !record ) {
        var record = new Company( hash );
      } else {
        _.merge( record, hash );
      }

      record.save(function ( err, company ) {
        if( err ) {
          winston.log('error', chalk.bgRed(err));
          throw new Error(err);
        }

        winston.info('Saved company', company.name.company);

        fulfilled++;
        companies.push( company );

        if( hashLen === fulfilled ) {
          console.log( company );
          callback( companies );
        }

      });
    });
  });
}

function toNum ( str ) {
  return parseFloat(str);
}

function toStr ( num ) {
  return num.toString();
}
