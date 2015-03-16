var cwd = process.cwd();

var winston   = require('winston'),
    chalk     = require('chalk'),
    respond   = require(cwd +'/handlers/response'),
    Promise   = require('bluebird'), // jshint ignore:line
    bcp       = require('bcrypt'),
    jwt       = require('jwt-simple'),
    _         = require('lodash');

var company      = require(cwd + '/models/company'),
    Verification = require(cwd + '/models/verification'),
    session      = require(cwd + '/lib/security/session'),
    token        = require(cwd + '/lib/security/token');

var dataSignature = ( process.env.environment === 'test' ) ? '12345678123456789' : require(process.cwd() + '/config/keys').dataSignature,
    encryptor     = require('simple-encryptor')(dataSignature);

exports.login = function ( req, res, next ) {
  var payload   = req.body,
      companyId = payload.companyId,
      email     = payload.email,
      password  = payload.password;

  if ( ( !companyId && !email ) || !password ) {
    return respond.error.res(res, 'Provide a complete payload in your request with login details');
  }

  var handleError = function ( err ) {
    respond.error.res(res, err, true);
  };

  var foundcompany = function ( company ) {
    _generateAuthorization( company )
      .then(function ( auth ) {
          if ( req.ip ) {
            return company.recordLogin(req.ip.replace('::ffff:', '')).then(function ( /* logins */ ) {
              return auth;
            });
          } else {
            return auth;
          }
        })
      .then( _respondWithAuthorization.bind( res ) )
      .catch( handleError );
  };

  company.findOne({ ssnDc: ssn, enrolled: { $ne: true } }).exec().then(function ( company ) {
    if ( company ) {
      foundcompany( company );
    } else {
      company.find({}).exec().then(function ( companysByIp ) {
        var ssnMatch = _.find(companysByIp, function ( record ) {
          return ( record.ssn ) ? encryptor.decrypt( record.ssn ) === parseFloat( ssn ) : false;
        });

        return ( ssnMatch ) ? foundcompany( ssnMatch ) : _generateVerificationToken(ssn).then(function ( verification ) {
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

/**
 * Generates an company session from company record
 *
 * @private
 * 
 * @param  {Object} company company document
 * @return {Promise}
 */
function _generateAuthorization ( company ) {
  var sessionData = {
    userId:   company._id.toString(),
  };

  return session.create(company._id, sessionData, 'Session', 'company', 'Company');
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
