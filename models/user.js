/*
  User (admin) - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var ticker     = require(process.cwd() + '/lib/ticker/ticker'),
    cryptify   = require('mongoose-cryptify'),
    searchable = require('./plugins/searchable');

var userSchema = new Schema({
  name: {
    first: String,
    last:  String
  },

  login: {
    email:    { type: String, unique: true },
    password: String
  },

  type:          String,
  super:         Boolean,
  receiveEmails: Boolean,
  apiAccess:     Boolean,

  permissions: [{ type: Schema.ObjectId, ref: 'PermissionGroup' }],

  time_stamp: { type: Date, default: Date.now, index: true }
});

// Attach some mongoose hooks
userSchema = ticker.attach( userSchema )
            .plugin(cryptify, {
              paths: [ 'login.password' ],
              factor: 11
            });

module.exports = createModel('User', userSchema);
