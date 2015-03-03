var winston = require('winston'),
    chalk   = require('chalk');

var _            = require('lodash'),
    jwt          = require('jwt-simple'),
    moment       = require('moment'),
    token        = require(process.cwd() + '/lib/security/token'),
    Verification = require(process.cwd() + '/models/verification');

module.exports = {
  options: {
    name: 'signature-transmission'
  },

  run: function ( data ) {
    var self = this,
        user = data.user;

    Verification.findOne({ publicKey: data.verificationKey }, function ( err, verification ) {
      if ( err ) {
        winston.error(err.stack);
        throw err;
      }

      if ( !verification ) {
        return self.socket.emit('client-error', { error: 'No verification found for key.' });
      }

      var decoded = jwt.decode(verification.publicKey, verification.privateKey),
          client  = _.find(self.socketConnections, { id: decoded.socketId });

      client.socket.emit('signature-push', { svgData: data.svgData });
    });
  }
};
