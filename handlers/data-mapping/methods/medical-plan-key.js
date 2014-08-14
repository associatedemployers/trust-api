/*
  Medical Plan Key Methods
*/

var Plan    = require('../models/plan'),
    winston = require('winston'),
    chalk   = require('chalk'),
    _       = require('lodash');

var definition = {
  Network: 'name',
  Key: 'legacyKey',
  Description: 'legacyDescription',
  EBMS_x0020_IBE_x0020_Code: 'ebmsIbeCode',
  EBMS_x0020_IBE_x0020_Code2: 'ebmsIbeCode2',
  EBMS_x0020_CLM_x0020_PLan_x0020_Code: 'ebmsClmCode',
  Grouping: 'legacyGrouping',
  Order: 'legacyOrder',
  Active_x003F_: 'legacyActive'
};

exports.normalize = function ( hash ) {
  for (var key in hash) {
    // Grab the definition
    var d = definition[ key ];

    if( d && d !== key ) {
      // Munge to the new key
      hash[ d ] = hash[ key ];
      delete hash[ key ];
    } else if( d === key ) {
      winston.log('warning', chalk.yellow('Key to Key map, skipping', key));
    } else {
      winston.log('error', chalk.bgRed('No definition found for key', key));
    }
  }

  return hash;
}

exports.inject = function ( hash ) {
  Plan.find({ name: hash.name }, function ( err, record ) {
    if( err ) {
      winston.log('error', chalk.bgRed(err));
      throw new Error(err);
    }

    if( !record ) {

      record = new Plan(hash);

    } else {

      for (var key in hash) {
        record[key] = hash[key];
      }

    }

    record.save(function ( err, plan ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      winston.info('Saved plan', plan.name);
    });

  })
}
