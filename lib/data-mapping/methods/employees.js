/*
  Employee Methods
*/

var locdir = process.cwd();

var Employee        = require(locdir + '/models/employee'),
    Company         = require(locdir + '/models/company'),
    CompanyLocation = require(locdir + '/models/location'),
    MedicalRate     = require(locdir + '/models/medical-rate'),
    munger          = require('./helpers/munger'),
    toDate          = require('./helpers/to-date'),
    winston         = require('winston').loggers.get('default'),
    chalk           = require('chalk'),
    moment          = require('moment'),
    Promise         = require('bluebird'), // jshint ignore:line
    slog            = require('single-line-log').stdout,
    _               = require('lodash');

var dataSignature = ( process.env.environment === 'test' ) ? '12345678123456789' : require('../../../config/keys').dataSignature,
    encryptor     = require('simple-encryptor')(dataSignature);

var definition = {
  // Legacy
  Record_x0023_:          'legacyRecordNumber',
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
  EBMSNumber:      'ebmsNumber',
  EBMSTermCode:    'ebmsTerminationCode',
  Unique_x0020_ID: 'memberId',       // 943 #
  Waiver:          'boolean-waived', // Type map

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
  CreationDate:   _.merge( {}, toDate, { toKey: 'time_stamp' } ),
  ClientEmpDate:  _.merge( {}, toDate, { toKey: 'legacyClientEmploymentDate' } ),
  ClientTermDate: _.merge( {}, toDate, { toKey: 'legacyClientTerminationDate' } ),
  IntSent:        _.merge( {}, toDate, { toKey: 'legacyInitialDateSent'} ),
  ChgSent:        _.merge( {}, toDate, { toKey: 'legacyChangeSent' } ),
  TermSent:       _.merge( {}, toDate, { toKey: 'legacyTerminationSent' } ),
  TrapTermDate:   _.merge( {}, toDate, { toKey: 'legacyTrapTermination' } ),

  COBRA_x0020_StartDate: _.merge( {}, toDate, { toKey: 'legacyCobraStartDate' } ),
  COBRA_x0020_TermDate:  _.merge( {}, toDate, { toKey: 'legacyCobraTerminationDate' } ),

  DOB: _.merge( {}, toDate, { toKey: 'dateOfBirth' } ),

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
  Promise.reduce(hashes, initRecord, []).then(callback).catch(function ( err ) {
    winston.log('error', chalk.bgRed(err));
    throw err;
  });
};

function initRecord ( hashes, hash, index, length ) {
  var self = this;

  slog(chalk.dim(index, 'of', length, '-', hash.name.first, hash.name.last));

  hash = injectionMunge( hash );

  // Injection
  return new Promise(function ( resolve ) {
    Employee.findOne({ memberId: hash.memberId }, function ( err, record ) {
      if ( err ) {
        throw err;
      }

      if ( !hash.ebmsNumber ) {
        winston.log('warn', chalk.bgYellow('No EBMS Number for ', hash.name.first, hash.name.last));
        return resolve();
      }

      CompanyLocation.findOne({ ebmsNumbers: { $in: [ hash.ebmsNumber ] } }, function ( err, location ) {
        if ( err ) {
          throw err;
        }

        if ( location ) {
          hash.location = location._id;
        }

        if( !record ) {
          record = new Employee( hash );
        } else {
          _.merge( record, hash );
        }

        record.save(function ( err, employee ) {
          if ( err ) {
            throw err;
          }

          return savedRecord(employee).then(function ( medicalRate ) {
            gotMedicalRate(employee, medicalRate);
          }).then(resolve);
        });
      });
    }); // Employee.findOne
  });
}

function savedRecord ( employee ) {
  return new Promise(function ( resolve ) {
    MedicalRate.findOne({ ebmsNumber: employee.ebmsNumber }).populate('company').exec(function ( err, medicalRate ) {
      if ( err ) {
        throw err;
      }

      resolve(medicalRate);
    });
  });
}

function gotMedicalRate ( employee, medicalRate ) {
  return new Promise(function ( resolve ) {
    return CompanyLocation.findOneAndUpdate({ ebmsNumbers: { $in: [ employee.ebmsNumber ] } }, { $addToSet: { employees: employee._id } }, function ( err ) {
      if ( err ) {
        throw err;
      }

      if ( !medicalRate || !medicalRate.company ) {
        return resolve(employee);
      }

      return Company.findByIdAndUpdate(medicalRate.company._id, { $addToSet: { employees: employee._id } }, function ( err ) {
        if ( err ) {
          throw err;
        }
        return Employee.findByIdAndUpdate(employee._id, { $set: { company: medicalRate.company._id } }, function ( err ) {
          if ( err ) {
            throw err;
          }

          resolve(employee);
        });
      });
    });
  });
}

function injectionMunge ( hash ) {
  // Setup arrays for linear->dynamic conversion
  hash.contactMethods = [];
  hash.beneficiaries  = [];
  hash.notes          = [];

  hash.enrolled = true; // We can assume all users on the legacy system are enrolled

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
