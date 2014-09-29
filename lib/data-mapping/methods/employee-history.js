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
    dbConnection    = require(locdir + '/config/mongoose').init(),
    munger          = require('./helpers/munger'),
    toDate          = require('./helpers/to-date'),
    winston         = require('winston'),
    chalk           = require('chalk'),
    moment          = require('moment'),
    _               = require('lodash'),
    Promise         = require('bluebird'); // jshint ignore:line

var dataSignature = require('../../../config/keys').dataSignature,
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

exports.inject = function ( hashes, callback ) {
  var count   = 0,
      hashMap = {};

  winston.log('info', chalk.dim('Grouping records'));
  // Group employee history records by SSN in a hash map that looks like:
  // {
  //   hashedSSN: [
  //     { Hist }, { Hist }
  //   ]
  // }
  hashes.forEach(function ( hash ) {
    var ssn = hash.ssn;

    if( !ssn ) {
      return winston.log('error', chalk.bgRed('History Individual record is missing ssn field.'));
    }

    var group = hashMap[ ssn ];

    if( !group || !_.isArray( group ) ) {
      hashMap[ ssn ] = [];
    }

    hashMap[ ssn ].push( hash );
  });

  var hashMapLen = _.size( hashMap ); // Object.keys().length if not using lodash

  // hashMap Sorter
  var byChangeDateAsc = function ( a, b ) {
    var aDate = a.legacyChangeDate,
        bDate = b.legacyChangeDate;

    return ( aDate > bDate ) ? -1 : ( aDate === bDate ) ? 0 : 1;
  };

  // jshint ignore:start
  var promises = [],
      initCount = 0;

  for ( var ssn in hashMap ) {
    winston.log('info', 'Sorting groups');
    hashMap[ ssn ] = hashMap[ ssn ].sort( byChangeDateAsc );
    winston.log('info', 'Creating promise');

    var p = new Promise(function ( resolve, reject ) {
      Employee.findOne({ ssn: ssn }, function ( err, employee ) {
        if( err ) {
          return reject( err );
        }

        console.log(employee);

        initCount++;

        winston.log('info', chalk.dim('On employee history', initCount, '/', hashMapLen));

        if( !employee ) {
          return resolve( employee );
        }

        winston.info(chalk.dim('Working with employee history of', employee.name.first));

        var employeePromises = hashMap[ ssn ].map(function ( ev ) {

          return new Promise(function ( resolve, reject ) {

            var rateType = legacyPlanMap[ ev.legacyWhichPlan ];

            if( !rateType ) {
              return winston.log('warning', chalk.yellow('Employee History w/o rateType'));
            }

            var Model = dbConnection.model( rateType );

            Model.find({ planNumber: ev.planNumber }, function ( err, rate ) {
              if( err ) {
                return reject( err );
              }

              var planObject = {
                plan:     rate._id,
                covering: legacyCoverageLevelMap[ ev.coverageLevel ]
              };

              employee.eventDate = ev.legacyChangeDate;
              employee.plans[ rateType.split('Rate').join('').toLowerCase() ] = planObject; // rateType.split is a bit of a quick hack

              employee.save(function ( err, employee ) {
                if( err ) {
                  return reject( err );
                }

                resolve( employee );
              });
            });
          });
        });

        Promise.all( employeePromises ).then(function ( e ) {
          count++;
          console.log( chalk.dim('Resolved event triggers for record', count + '/' + hashMapLen) );
          resolve( e );
        }).catch( reject );

      });
    });

    promises.push( p );
  }
  // jshint ignore:end

  Promise.all( promises ).then( callback ).catch(function ( err ) {
    winston.log( 'error', chalk.bgRed( err ) );
    throw new Error( err );
  });
};
