/*
  Dependent Methods
*/

var locdir = process.cwd();

var Employee  = require(locdir + '/models/employee'),
    Dependent = require(locdir + '/models/dependent'),
    munger    = require('./helpers/munger'),
    toDate    = require('./helpers/to-date'),
    winston   = require('winston'),
    chalk     = require('chalk'),
    moment    = require('moment'),
    _         = require('lodash'),
    Promise   = require('bluebird'); // jshint ignore:line

var dataSignature = require('../../../config/keys').dataSignature,
    encryptor     = require('simple-encryptor')(dataSignature);

var definition = {
  SSN:        '-trash-',

  // Key to key
  DepCounter:               'legacyId',              // Only way we can update via legacy imports
  DepRelation:              'relationship',
  DepEBMSTermCode:          'ebmsTerminationCode',
  Unique_x0020_ID:          'memberId',              // 943 # - not persisted
  DepOtherHealthInsCompany: 'otherInsuranceCompany', // Dependent's Other Health Insurance Company


  // Legacy Fields
  Dep_x0020_Pre_x0020_Ex_x0020_Length: 'number-legacyPreExistingLength',              // Pre-existing condition
  DepCC_x003F_:                        'boolean-legacyPreExistingCertificate',

  DepMedTerm:            'boolean-legacyPreviousMedical',
  MainEnroll_x003F_:     'boolean-legacyMedicalEnrollment',
  VolEnroll_x003F_:      'boolean-legacyVoluntaryEnrollment',
  SuppLifeEnroll_x003F_: 'boolean-legacySupplementalLifeEnrollment',
  DepOtherHealthIns:     'boolean-legacyOtherHealthInsurance',
  MiscPaperwork:         'boolean-legacyHasPaperwork',

  // Hashes
  DepFirstName: {
    inHash: 'name',
    toKey:  'first'
  },
  DepMiddleInt: {
    inHash: 'name',
    toKey:  'middleInitial'
  },
  DepLastName: {
    inHash: 'name',
    toKey:  'last'
  },
  DepSuffixToName: {
    inHash: 'name',
    toKey:  'suffix'
  },

  // Dates
  DepCreationDate:  _.merge( {}, toDate, { toKey: 'time_stamp' } ),
  DepEffectiveDate: _.merge( {}, toDate, { toKey: 'legacyEffectiveDate' } ),
  DepTermDate:      _.merge( {}, toDate, { toKey: 'legacyTerminationDate' } ),
  DepIntSent:       _.merge( {}, toDate, { toKey: 'legacyInitialDateSent'} ),
  DepChgSent:       _.merge( {}, toDate, { toKey: 'legacyChangeSent' } ),
  DepTermSent:      _.merge( {}, toDate, { toKey: 'legacyTerminationSent' } ),

  DepDOB:           _.merge( {}, toDate, { toKey: 'dateOfBirth' } ),

  // Methodical Maps
  DepSSN: {
    normalize: function ( v ) {
      return ( v ) ? encryptor.encrypt( v ) : v;
    },
    serialize: function ( v ) {
      return ( v ) ? encryptor.decrypt( v ) : v;
    },
    toKey: 'ssn'
  },
  DepSex: {
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
  var hashLen        = hashes.length,
      hashMap        = {},
      dependentArray = [];

  hashes.forEach(function ( hash ) {
    if( !_.isArray( hashMap[ hash.memberId ] ) ) {
      hashMap[ hash.memberId ] = [];
    }

    hashMap[ hash.memberId ].push( hash );
  });

  for ( var memberId in hashMap ) {
    dependentArray.push({
      memberId:   memberId,
      dependents: hashMap[ memberId ]
    });
  }

  return Promise.reduce(dependentArray, function ( dependents, dependentGroup ) {
    winston.log('info', chalk.dim(dependents.length, '/', dependentArray.length - 1, '-', 'Getting employee...'));
    return getEmployee( dependentGroup.memberId ).then(function ( employee ) {
      if( !employee ) {
        return winston.log('info', chalk.yellow('No employee record for member', dependentGroup.memberId));
      }
      winston.log('info', chalk.dim(dependents.length, '/', dependentArray.length - 1, '-', 'Writing dependents...'));
      return updateOrInsertDependents( dependentGroup.dependents, employee ).then(function () {
        winston.log('info', chalk.dim(dependents.length, '/', dependentArray.length - 1, '-', 'Done writing dependents...'));
      });
    }).then(function ( e ) {
      dependents.push( e );
      return dependents;
    });
  }, []).then( callback ).catch(function ( err ) {
    winston.log( 'error', err );
    throw err;
  });
};

function getEmployee ( memberId ) {
  
  return new Promise(function ( resolve, reject ) {
    Employee.findOne({ memberId: memberId }).populate('dependents').exec(function ( err, employee ) {
      if( err ) {
        return reject( err );
      }

      resolve( employee );
    });
  });

}

function updateOrInsertDependents ( dependents, employee ) {

  return new Promise(function ( resolve, reject ) {
      var employeePlain = employee.toObject({ depopulate: true }),
          dcache        = [].concat(employeePlain.dependents);


      if( !_.isArray( employeePlain.dependents ) ) {
        employeePlain.dependents = [];
      }

      var promises = dependents.map(function ( dependent ) {
        var record;

        if( employee.dependents && _.isArray( employee.dependents ) ) {
          record = _.where( employee.dependents, { legacyId: dependent.legacyId } )[0];
        }

        if( record ) {
          _.merge( record, dependent );
        } else {
          record = new Dependent( dependent );
        }

        return new Promise(function ( resolve, reject ) {
          record.save(function ( err, doc ) {

            if( err ) {
              return reject( err );
            }

            if( employeePlain.dependents.indexOf( doc._id ) < 0 ) {
              employeePlain.dependents.push( doc._id );
            }

            resolve();
          });
        });
      });

      return Promise.all( promises ).then(function () {
        if( !_.isEqual( employeePlain.dependents, dcache ) ) {
          employee.dependents = employeePlain.dependents;
          return saveEmployee( employee );
        }

        return employee;
      }).then( resolve ).catch( reject );
  });

}

function saveEmployee ( employee ) {

  return new Promise(function ( resolve, reject ) {
    employee.save(function ( err, employee ) {
      if( err ) {
        return reject( err );
      }

      resolve( employee );
    });
  });

}
