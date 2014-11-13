/* Utilities */

var winston = require('winston').loggers.get('default'),
    chalk   = require('chalk'),
    respond = require('./response');

var dataSignature = ( process.env.environment === 'test' ) ? '12345678123456789' : require(process.cwd() + '/config/keys').dataSignature,
    encryptor     = require('simple-encryptor')( dataSignature );

exports.decryptSSN = function ( req, res, next ) {
  var ssn = req.query.ssn;

  if( !ssn ) {
    return respond.code.notfound(res, 'Please send an encrypted ssn in your request');
  }

  return res.status(200).json({
    encrypted: ssn,
    decrypted: encryptor.decrypt( ssn )
  });
};
