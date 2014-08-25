/*
  Employee Methods
*/

var locdir = process.cwd();

var Employee    = require(locdir + '/models/employee'),
    Company     = require(locdir + '/models/company'),
    MedicalRate = require(locdir + '/models/medical-rate'),
    munger      = require('./munger'),
    winston     = require('winston'),
    chalk       = require('chalk'),
    moment      = require('moment'),
    _           = require('lodash');

var dataSignature = require('../../../config/keys').dataSignature,
    encryptor     = require('simple-encryptor')(dataSignature);

var toDate = {
  normalize: function ( v ) {
    return ( v ) ? moment( v ).format("YYYY/MM/DD HH:mm:ss") : v;
  },
  serialize: function ( v ) {
    return ( v ) ? moment( v, "YYYY/MM/DD HH:mm:ss" ).format("YYYY/MM/DD") + "T00:00:00" : v;
  },
};

var definition = {
  // Legacy
  Record_x0023_:          'legacyRecordNumber',
  Unique_x0020_ID:        'legacyUniqueId',
  COBRA_x0020_TermChoice: 'legacyCobraTermChoice',
  PreExist_x0020_Length:  'legacyPreExistingCondition',
  CC_x003F_:              'legacyCreditableCoverage',
  Retiree:                'legacyRetireeFlag',
  Aflac:                  'legacyAflacFlag',
  CoChg:                  'legacyChangingCompany',
  ChgLocSameCo:           'legacyChangingLocationInCompany',
  Marriage:               'legacyMarriage',

  

  // Pretty Useless Legacy Flags/Fields (Virtuals)
  NonVolWaiveRepresentSpouse: 'legacyXNonVolWaivingSpouse',
  NonVolWaiveRepresentDep:    'legacyXNonVolWaivingDependents',
  NonVolWaiveRepresentSelf:   'legacyXNonVolWaiving',
  NonVolWaiveSpouseNm:        'legacyXNonVolWaivedSpouseName',
  NonVolWaiveDepNm:           'legacyXNonVolWaivedDependentName',
  VolDentalWaiveSpouseNm:     'legacyXVolDentalWaivedSpouseName',
  VolDentalWaiveDepNm:        'legacyXVolDentalWaivedDependentName',
  VolVisionWaiveSpouseNm:     'legacyXVolVisionWaivedSpouseName',
  VolVisionWaiveDepNm:        'legacyXVolVisionWaivedDependentName',

  // Key to Key
  EBMSNumber: 'ebmsNumber',
  EBMSTermCode: 'ebmsTerminationCode',
  Waiver: 'waived',

  // Hash Maps
  // --> Supp. Life
  SuppLifeSpouseFName: {
    inHash: 'legacySupplementalLife',
    toKey:  'firstName'
  },
  SuppLifeSpouseLName: {
    inHash: 'legacySupplementalLife',
    toKey:  'lastName'
  },
  SuppLifeSpouseGender: {
    inHash: 'legacySupplementalLife',
    toKey:  'gender'
  },
  SuppLifeSpouseDOB: {
    inHash: 'legacySupplementalLife',
    toKey:  'dateOfBirth'
  },
  // --> Name
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
  SuffixToName: {
    inHash: 'name',
    toKey:  'suffix'
  },
  // --> Address
  ClientAddress: {
    inHash: 'address',
    toKey:  'line1'
  },
  ClientCity: {
    inHash: 'address',
    toKey:  'city'
  },
  ClientState: {
    inHash: 'address',
    toKey:  'state'
  },
  ClientZip: {
    inHash: 'address',
    toKey:  'zipcode'
  },

  // Temporary holding for the injection method
  // --> Contact
  Home_x0020_Phone: {
    inHash: 'tempContact',
    toKey:  'home'
  },
  Work_x0020_Phone: {
    inHash: 'tempContact',
    toKey:  'work'
  },
  Work_x0020_Phone_x0020_Extension: {
    inHash: 'tempContact',
    toKey:  'ext'
  },
  // --> Beneficiary
  Beneficiary: {
    inHash: 'tempBeneficiary',
    toKey: 'beneficiary'
  },
  BeneficiaryRel: {
    inHash: 'tempBeneficiary',
    toKey: 'beneficiaryRelation'
  },
  Contingent_x0020_Beneficiary: {
    inHash: 'tempBeneficiary',
    toKey: 'contingent'
  },
  ContBeneficiaryRel: {
    inHash: 'tempBeneficiary',
    toKey: 'contingentRelation'
  },
  // --> Notes
  Notes: {
    inHash: 'tempNotes',
    toKey:  'internal'
  },
  EBMS_x0020_Upload_x0020_Notes: {
    inHash: 'tempNotes',
    toKey:  'ebms'
  },
  EBMS_x0020_Upload_x0020_Notes2: {
    inHash: 'tempNotes',
    toKey:  'ebms2'
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

  // Dates
  CreationDate:   _.merge( toDate, { toKey: 'time_stamp' } ),
  ClientEmpDate:  _.merge( toDate, { toKey: 'legacyClientEmployementDate' } ),
  ClientTermDate: _.merge( toDate, { toKey: 'legacyClientTerminationDate' } ),
  IntSent:        _.merge( toDate, { toKey: 'legacyInitialDateSent'} ),
  ChgSent:        _.merge( toDate, { toKey: 'legacyChangeSent' } ),
  TermSent:       _.merge( toDate, { toKey: 'legacyTerminationSent' } ),
  TrapTermDate:   _.merge( toDate, { toKey: 'legacyTrapTermination' } ),

  COBRA_x0020_StartDate: _.merge( toDate, { toKey: 'legacyCobraStartDate' } ),
  COBRA_x0020_TermDate:  _.merge( toDate, { toKey: 'legacyCobraTerminationDate' } ),

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
};

exports.inject = function ( hashes, callback ) {
  var hashLen   = hashes.length,
      fulfilled = 0,
      count = 0,
      employees = [],
      isNew;

  hashes.forEach(function ( hash ) {

    hash = injectionMunge( hash );

    // Injection
    Employee.findOne({ SSN: hash.ssn }, function ( err, record ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      if( !record ) {
        record = new Employee( hash );
      } else {
        _.merge( record, hash );
      }

      record.save(function ( err, employee ) {
        if( err ) {
          winston.log('error', chalk.bgRed(err));
          throw new Error(err);
        }
        count++;
        winston.info('Saved employee', employee.name.first, '-', count, '/', hashLen);

        MedicalRate.findOne({ ebmsNumber: employee.ebmsNumber }).populate('company').exec(function ( err, medicalRate ) {
          if( err ) {
            winston.log('error', chalk.bgRed(err));
            throw new Error(err);
          }

          if( medicalRate && medicalRate.company ) {
            var company = medicalRate.company;

            if( company.employees.indexOf( employee._id ) < 0 ) {
              winston.info('Pushing employee to company');
              company.employees.push( employee._id );
            }

            employee.company = company;

            employee.save(function ( err, updatedEmployee ) {
              if( err ) {
                winston.log('error', chalk.bgRed(err));
                throw new Error(err);
              }

              winston.info('Saved employee company ref');

              company.save();

              fulfilled++;
              employees.push( updatedEmployee );

              if( hashLen === fulfilled ) {
                callback( employees );
              }
            }); // employee.save
          } else {
            fulfilled++;
            employees.push( employee );

            if( hashLen === fulfilled ) {
              callback( employees );
            }
          } // if( medicalRate && medicalRate.company )
        }); // MedicalRate.findOne
      }); // record.save
    }); // Employee.findOne
  }); // hashes.forEach
};

function injectionMunge ( hash ) {
  // Setup arrays for linear->dynamic conversion
  hash.contactMethods = [];
  hash.beneficiaries  = [];
  hash.notes          = [];

  // Setup contactMethods
  var c = hash.tempContact;

  if( c ) {
    if( c.home ) {
      hash.contactMethods.push({
        type:  'home',
        value: c.home
      });
    }

    if( c.work ) {
      hash.contactMethods.push({
        type:  'work',
        value: c.work,
        ext:   ( c.ext ) ? c.ext : null
      });
    }
  }

  // Setup Beneficiaries
  var b = hash.tempBeneficiary;

  if( b ) {
    if( b.beneficiary ) {
      hash.beneficiaries.push({
        type:     'primary',
        name:     b.beneficiary,
        relation: b.beneficiaryRelation
      });
    }

    if( b.contingent ) {
      hash.beneficiaries.push({
        type:     'contingent',
        name:     b.contingent,
        relation: b.contingentRelation
      });
    }
  }

  // Setup Notes
  var n = hash.tempNotes;

  if( n ) {
    if( n.internal ) {
      hash.notes.push({
        ebms:   false,
        concat: true,
        text:   n.internal
      });
    }

    if( n.ebms ) {
      hash.notes.push({
        ebms: true,
        text: n.ebms
      });
    }

    if( n.ebms2 ) {
      hash.notes.push({
        ebms: true,
        text: n.ebms2
      });
    }
  }

  // Map maritalStatus from legacyMarriage
  hash.maritalStatus = ( hash.legacyMarriage === 'M' ) ? 'married' : 'single';

  // Remove linear fields
  delete hash.tempContact;
  delete hash.tempBeneficiary;
  delete hash.tempNotes;

  return hash;
}
