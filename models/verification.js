/*
  Verification - Server Data Model
  ---
  Simple data model for storing keys 
  for verifying data on return. See
  /handlers/employee-login.js for
  implementation.
*/

var mongoose    = require('mongoose'),
    Schema      = mongoose.Schema,
    createModel = require('./helpers/create-model'),
    tokenModule = require(process.cwd() + '/lib/security/token');

expirationGen = tokenModule.expirationGenerator(2, 'hours');

var verificationSchema = new Schema({
  publicKey:  String,
  privateKey: String,
  shortId:    String,

  expiration: { type: Date, default: expirationGen, index: true },
  created:    { type: Date, default: Date.now }
});

module.exports = createModel('Verification', verificationSchema);
