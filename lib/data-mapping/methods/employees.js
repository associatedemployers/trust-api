/*
  Employee Methods
*/

var Employee = require(process.cwd() + '/models/employee'),
    munger   = require('./munger'),
    winston  = require('winston'),
    chalk    = require('chalk'),
    _        = require('lodash');

var dataSignature = require('../../../config/keys').dataSignature,
    encryptor     = require('simple-encryptor')(dataSignature);

var definition = {
  // Legacy
  Record_x0023_: 'legacyRecordNumber',
  Unique_x0020_ID: 'legacyUniqueId',
  COBRA_x0020_TermChoice: 'legacyCobraTermChoice',
  PreExist_x0020_Length: 'legacyPreExistingCondition',


  // Key to Key
  EBMSNumber: 'ebmsNumber',
  Waiver: 'waived',

  // Hash Maps
  FirstName: {
    inHash: 'name',
    toKey:  'first'
  },
  MiddleInt: {
    inHash: 'name',
    toKey:  'middleInitial'
  },
  LastName: {
    inHash: 'name',
    toKey:  'last'
  },

  // Methodical Maps
  SSN: {
    normalize: function ( v ) {
      return ( v ) ? encryptor.encrypt( v ) : v;
    },
    serialize: function ( v ) {
      return ( v ) ? encryptor.decrypt( v ) : v;
    },
    toKey: 'ssn'
  },

  CreationDate: {
    //date
  },
  ClientTermDate: {
    //date
  },
  ClientTermDate: {
    //date
  },

  DOB: {
    normalize: function ( v ) {
      var splArr = v.replace(/T\S+/g, '').split('-');

      return {
        year:  splArr[0],
        month: splArr[1],
        day:   splArr[2],
      };
    },
    serialize: function ( v ) {
      if( !v.year && !v.month && !v.day ) {
        return v;
      }

      var a = [];

      for ( var k in v ) {
        a.push( v[ k ] );
      }

      return a.join('-') + 'T00:00:00';
    },
    toKey: 'dateOfBirth'
  },

  Sex: {
    normalize: function ( v ) {
      return ( v === 'M' ) ? 'male' : ( v === 'F' ) ? 'female' : '';
    },
    serialize: function ( v ) {
      return ( v === 'male' ) ? 'M' : 'F';
    },
    toKey: 'gender'
  }

};

exports.normalize = function ( hashes ) {
  return munger( definition, hashes );
}

/*
exports.inject = function ( hashes, callback ) {
  var hashLen   = hashes.length,
      fulfilled = 0,
      plans     = [];

  hashes.forEach(function ( hash ) {
    MedicalPlan.findOne({ 'name.company': hash.name.company }, function ( err, record ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      if( !record ) {
        var record = new MedicalPlan( hash );
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
}
*/


/*
ContactZip: {
  inHash: 'address',
  toKey:  'zipcode'
},

RateTier: 'legacyRateTier',

CompEffectDate: {
  normalize: function ( v ) {
    return ( v ) ? moment( v ).format("YYYY/MM/DD HH:mm:ss") : v;
  },
  serialize: function ( v ) {
    return ( v ) ? moment( v, "YYYY/MM/DD HH:mm:ss" ).format("YYYY/MM/DD") + "T00:00:00" : v;
  },
  toKey: 'legacyCompEffectDate'
},
*/