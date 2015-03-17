var cwd = process.cwd();

var winston   = require('winston'),
    chalk     = require('chalk'),
    respond   = require(cwd +'/handlers/response'),
    Promise   = require('bluebird'), // jshint ignore:line
    bcp       = require('bcrypt'),
    jwt       = require('jwt-simple'),
    _         = require('lodash');

var Company      = require(cwd + '/models/company'),
    Verification = require(cwd + '/models/verification'),
    session      = require(cwd + '/lib/security/session'),
    token        = require(cwd + '/lib/security/token');

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

  var query = ( companyId ) ? { 'login.companyId': companyId } : { 'login.email': email };

  Company.findOne(query).exec().then(function ( company ) {
    if ( !company ) {
      return res.status(404).send('Company not found with that email or companyId');
    }

    bcp.compare(password, company.login.password, function ( err, matches ) {
      if ( err ) {
        handleError(err);
      }

      if ( !matches ) {
        return res.status(401).send('Password does not match what we have on file');
      }

      _generateAuthorization(company)
      .then(function ( auth ) {
        return ( req.ip ) ? company.recordLogin(req.ip.replace('::ffff:', '')).then(function () {
          return auth;
        }) : auth;
      })
      .then(_respondWithAuthorization.bind(res));
    });
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
    userId: company._id.toString(),
  };

  return session.create(company._id, sessionData, 'Session', 'company', 'Company');
}

/**
 * Responds with authorization (session)
 * @param  {Object} userSession Session document
 * @param  {Object} res         Express response object
 * @return {Undefined}
 */
function _respondWithAuthorization ( userSession ) {
  this.json({
    verificationRequired: false,
    token:                userSession.publicKey,
    expiration:           userSession.expiration,
    user:                 userSession.user.toString()
  });
}
