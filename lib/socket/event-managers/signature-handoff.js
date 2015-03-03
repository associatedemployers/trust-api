var winston = require('winston'),
    chalk   = require('chalk');

var _            = require('lodash'),
    jwt          = require('jwt-simple'),
    moment       = require('moment'),
    token        = require(process.cwd() + '/lib/security/token'),
    Verification = require(process.cwd() + '/models/verification');

module.exports = {
  options: {
    name: 'signature-handoff'
  },

  run: function ( data ) {
    var self = this,
        user = data.user;

    var keypair = token.createKeypair({
      user: user,
      socketId: self.clientId
    });

    var verification = new Verification(_.merge({
      expiration: moment().add(1, 'hour')
    }, keypair));

    verification.save(function ( err, signatureVerification ) {
      if ( err ) {
        winston.error(err.stack);
        throw err;
      }

      self.socket.emit('signature-verification', signatureVerification.publicKey);
    });
  }
};
