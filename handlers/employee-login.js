var winston   = require('winston'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    Promise   = require('bluebird'), // jshint ignore:line
    bcp       = require('bcrypt'),
    _         = require('lodash');

var Employee     = require('../models/employee'),
    Verification = require('../models/verification'),
    session      = require('../lib/security/session'),
    token        = require('../lib/security/token');

var dataSignature = ( process.env.environment === 'test' ) ? '12345678123456789' : require(process.cwd() + '/config/keys').dataSignature,
    encryptor     = require('simple-encryptor')(dataSignature);

exports.login = function ( req, res, next ) {
  var payload = req.body,
      ssn     = payload.ssn;

  if ( !ssn || isNaN( ssn ) ) {
    return respond.error.res(res, 'Provide a payload in your request with login details');
  }

  var handleError = function ( err ) {
    respond.error.res(res, err, true);
  };

  var foundEmployee = function ( employee ) {
    _generateAuthorization( employee )
    .then( _respondWithAuthorization.bind( res ) )
    .catch( handleError );
  };

  Employee.findOne({ ssnDc: ssn, enrolled: { $ne: true } }).exec().then(function ( employee ) {
    if ( employee ) {
      foundEmployee( employee );
    } else {
      Employee.find({
        logins: {
          $elemMatch: {
            ip: req.ip
          }
        }
      }).exec().then(function ( employeesByIp ) {
        var ssnMatch = _.find(employeesByIp, function ( record ) {
          return ( record.ssn ) ? encryptor.decrypt( record.ssn ) === ssn : false;
        });

        return ( ssnMatch ) ? foundEmployee( ssnMatch ) : _generateVerificationToken(ssn).then(function ( verification ) {
          return res.status(200).send({
            verificationRequired: true,
            token:                verification.publicKey,
            expiration:           verification.expiration
          });
        });
      }).onReject( handleError );
    }
  }).onReject( handleError );
};

exports.verify = function ( req, res, next ) {

};

/**
 * Generates an employee session from employee record
 *
 * @private
 * 
 * @param  {Object} employee Employee document
 * @return {Promise}
 */
function _generateAuthorization ( employee ) {
  var sessionData = {
    userId:   employee._id.toString(),
    memberId: employee.memberId
  };

  return session.create(employee._id, sessionData, 'Session', 'employee', 'Employee');
}

function _generateVerificationToken ( ssn ) {
  return new Promise(function ( resolve, reject ) {
    var verification = new Verification(token.createKeypair({
      ssn: ssn
    }));

    verification.save(function ( err, verificationDocument ) {
      if ( err ) {
        return reject( err );
      }

      resolve( verificationDocument );
    });
  });
}

/**
 * Responds with authorization (session)
 * @param  {Object} userSession Session document
 * @param  {Object} res         Express response object
 * @return {Undefined}
 */
function _respondWithAuthorization ( userSession, res ) {
  res = res || this;
  res.json({
    verificationRequired: false,
    token:                userSession.publicKey,
    expiration:           userSession.expiration,
    user:                 userSession.user.toString()
  });
}
