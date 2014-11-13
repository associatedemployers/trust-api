/*
  Employee History Methods
  ---
  This map has no model, and is simply injected
  onto the employee model. Isn't that a breath
  of fresh air?
*/

var locdir = process.cwd();

var Employee        = require(locdir + '/models/employee'),
    Company         = require(locdir + '/models/company'),
    CompanyLocation = require(locdir + '/models/location'),
    DentalRate      = require(locdir + '/models/dental-rate'),
    VisionRate      = require(locdir + '/models/vision-rate'),
    LifeRate        = require(locdir + '/models/life-rate'),
    MedicalRate     = require(locdir + '/models/medical-rate'),
    dbConnection    = require(locdir + '/config/mongoose').init(),
    munger          = require('./helpers/munger'),
    toDate          = require('./helpers/to-date'),
    winston         = require('winston').loggers.get('default'),
    chalk           = require('chalk'),
    moment          = require('moment'),
    indexOfId       = require(locdir + '/lib/utilities/find-by-objectid'),
    _               = require('lodash'),
    Promise         = require('bluebird'); // jshint ignore:line

var dataSignature = ( process.env.environment === 'test' ) ? '12345678123456789' : require('../../../config/keys').dataSignature,
    encryptor     = require('simple-encryptor')(dataSignature);

var legacyPlanMap = {
  M:  'MedicalRate',
  D:  'DentalRate',
  V:  'VisionRate',
  L:  'LifeRate',
  DL: 'LifeRate'
};

var legacyCoverageLevelMap = [ 'employee', 'employeeAndSpouse', 'employeeAndChildren', 'employeeAndFamily' ]; // Index sensitive

var definition = {
  Counter:            '-trash-',
  CoIns:              '-trash-',
  Deductible:         '-trash-',

  Unique_x0020_ID:    'memberId', // 943 #
  Plan_x0020_Type:    'coverageLevel',
  Which_x0020_Plan:   'legacyWhichPlan',
  PrintLabel:         'printLabel',
  Adjustment:         'adjustmentCode',
  Adj_x0020_Amount:   'adjustment',
  Plan_x0020__x0023_: 'planNumber',
  Amount:             'amount',
  OldAmount:          'previousAmount',

  Effective_x0020_Date:                  _.merge( {}, toDate, { toKey: 'legacyEffectiveDate' } ),
  Change_x0020_Date:                     _.merge( {}, toDate, { toKey: 'legacyChangeDate' } ),
  Termination_x0020_Date:                _.merge( {}, toDate, { toKey: 'legacyTerminationDate' } ),
  IBEIntSent:                            _.merge( {}, toDate, { toKey: 'legacyIbeIntSent' } ),
  IBEChgSent:                            _.merge( {}, toDate, { toKey: 'legacyIbeChgSent' } ),
  IBETermSent:                           _.merge( {}, toDate, { toKey: 'legacyIbeTermSent' } ),
  HisIndCreationDate:                    '-trash-', // Correct me if I'm wrong
  Effective_x0020_Adjustment_x0020_Date: _.merge( {}, toDate, { toKey: 'legacyAdjustmentDate' } ),

  SSN: {
    normalize: function ( v ) {
      return ( v ) ? encryptor.encrypt( v ) : v;
    },
    serialize: function ( v ) {
      return ( v ) ? encryptor.decrypt( v ) : v;
    },
    toKey: 'ssn'
  }
};

exports.normalize = function ( hashes ) {
  return munger( definition, hashes );
};

var hashMapLen;

exports.inject = function ( hashes, callback ) {
  var hashMap = {},
      employeeArray = [];

  // Group employee history records by memberId in a hash map that looks like:
  // {
  //   memberId: [
  //     { Hist }, { Hist }
  //   ]
  // }
  hashes.forEach(function ( hash ) {
    var memberId = hash.memberId;

    if( !memberId ) {
      return winston.log('error', chalk.bgRed('History Individual record is missing memberId field.'));
    }

    var group = hashMap[ memberId ];

    if( !group || !_.isArray( group ) ) {
      hashMap[ memberId ] = [];
    }

    hashMap[ memberId ].push( hash );
  });

  // hashMap Sorter
  var byChangeDateAsc = function ( a, b ) {
    var aDate = a.legacyChangeDate,
        bDate = b.legacyChangeDate;

    return ( aDate < bDate ) ? -1 : ( aDate === bDate ) ? 0 : 1;
  };

  for ( var memberId in hashMap ) {
    hashMap[ memberId ] = hashMap[ memberId ].sort( byChangeDateAsc );

    employeeArray.push({
      memberId: memberId,
      events:   hashMap[ memberId ]
    });
  }

  hashMapLen = employeeArray.length;

  Promise.reduce( employeeArray, function ( n, employeeHash ) {
    return getEmployee( employeeHash.memberId ).then(function ( employee ) {
      winston.log('info', chalk.dim(n, '/', hashMapLen, '-', 'Writing events'));

      if( !employee ) {
        return;
      }

      return Promise.reduce(employeeHash.events, writeEvent, employee);
    }).then(function () {
      winston.log('info', chalk.dim(n, '/', hashMapLen, '-', 'Done with employee'));
      return n + 1;
    });
  }, 0).then( callback ).catch(function ( err ) {
    winston.log( 'error', chalk.bgRed( err ) );
    throw err;
  });
};

function getEmployee ( memberId ) {
  return new Promise(function ( resolve, reject ) {
    Employee.findOne({ memberId: memberId }, function ( err, employee ) {
      if( err ) {
        return reject( err );
      }

      return resolve( employee );
    });
  });
}

function writeEvent ( employee, ev ) {
  winston.log('info', chalk.dim('Writing event'));

  return new Promise(function ( resolve, reject ) {

    var rateType = legacyPlanMap[ ev.legacyWhichPlan ];

    if( !rateType || !ev.planNumber ) {
      winston.log('error', chalk.yellow('Employee History missing fields'));
      return resolve( employee );
    }

    var Model = dbConnection.model( rateType );

    winston.log('info', chalk.dim('Finding rate...'));

    Model.findOne({ planNumber: ev.planNumber }, function ( err, rate ) {
      if( err ) {
        return reject( err );
      }

      if( !rate ) {
        return resolve( employee );
      }

      var planOptions = {
        covers: legacyCoverageLevelMap[ ev.coverageLevel ]
      };

      var rateKey = rateType.split('Rate').join('').toLowerCase();

      employee.eventDate = ev.legacyChangeDate;
      employee.planOptions[ rateKey ] = planOptions;

      if( indexOfId( employee.plans[ rateKey ], rate._id ) < 0 ) {
        employee.plans[ rateKey ].push( rate._id );
      }

      winston.log('info', chalk.dim('Saving employee'));

      employee.save(function ( err, savedRecord ) {
        if( err ) {
          return reject( err );
        }

        if( !savedRecord ) {
          resolve( employee );
        } else {
          resolve( savedRecord );
        }
      });
    });
  });
}
