/*
  Employee Methods
*/

var Employee = require(process.cwd() + '/models/employee'),
    munger   = require('./munger'),
    winston  = require('winston'),
    chalk    = require('chalk'),
    _        = require('lodash');

var definition = {

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
