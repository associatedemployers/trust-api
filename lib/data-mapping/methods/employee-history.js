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
    MedicalRate     = require(locdir + '/models/medical-rate'),
    munger          = require('./helpers/munger'),
    toDate          = require('./helpers/to-date'),
    winston         = require('winston'),
    chalk           = require('chalk'),
    moment          = require('moment'),
    _               = require('lodash');

var dataSignature = require('../../../config/keys').dataSignature,
    encryptor     = require('simple-encryptor')(dataSignature);

var definition = {
  Counter:            '-trash-',
  Plan_x0020_Type:    '-trash-',
  CoIns:              '-trash-',
  Deductible:         '-trash-',

  Which_x0020_Plan:   'legacyWhichPlan',
  PrintLabel:         'printLabel',
  Adjustment:         'adjustmentCode',
  Adj_x0020_Amount:   'adjustment',
  Plan_x0020__x0023_: 'legacyPlanNumber',
  Amount:             'amount',
  OldAmount:          'previousAmount',

  Effective_x0020_Date:                  _.merge( {}, toDate, { toKey: 'legacyEffectiveDate' } ),
  Change_x0020_Date:                     _.merge( {}, toDate, { toKey: 'legacyChangeDate' } ),
  Termination_x0020_Date:                _.merge( {}, toDate, { toKey: 'legacyTerminationDate' } ),
  IBEIntSent:                            _.merge( {}, toDate, { toKey: 'legacyIbeIntSent' } ),
  IBEChgSent:                            _.merge( {}, toDate, { toKey: 'legacyIbeChgSent' } ),
  IBETermSent:                           _.merge( {}, toDate, { toKey: 'legacyIbeTermSent' } ),
  HisIndCreationDate:                    _.merge( {}, toDate, { toKey: 'time_stamp' } ),
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
  var hashLen   = hashes.length,
      fulfilled = 0,
      count     = 0,
      employees = [],
      hashMap   = {};

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

  // hashMap Sorter
  var byChangeDateAsc = function ( a, b ) {
    var aDate = a.legacyChangeDate,
        bDate = b.legacyChangeDate;

    return ( aDate > bDate ) ? -1 : ( aDate === bDate ) ? 0 : 1;
  };

  // Use the grouping we made to group find/save operations per employee
  // 
  // jshint ignore:start
  for ( var ssn in hashMap ) {
    hashMap[ ssn ] = hashMap[ ssn ].sort( byChangeDateAsc );

    Employee.findOne( { ssn: ssn }, function ( err, employee ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      hashMap[ ssn ].forEach(function ( ev ) {
        employee
      });


    });
  }
  // jshint ignore:end

  /**
   * Process a history individual row into a record event
   * @param  {Object} ev Event
   * @return {Object}    Change Event
   */
  var processHistoryEvent = function ( ev ) {
    
  };
};
