/*
  Employee - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var ticker   = require(process.cwd() + '/lib/ticker/ticker'),
    cryptify = require('./plugins/cryptify');

var permissionSchema = new Schema({
  resource: String, // if any resource
  endpoint: String, // if not using resource, use endpoint
  type: [ String ]  // ex. [ 'put', 'get', 'delete', 'post' ]
});

var userSchema = new Schema({
  name: {
    first: String,
    last:  String
  },

  login: {
    email:    String,
    password: String
  },

  email: String,
  type:  String,

  permissions: [ permissionSchema ],

  time_stamp: { type: Date, default: Date.now, index: true }
});

// Attach some mongoose hooks
userSchema = ticker.attach( userSchema ).plugin(cryptify, {
  paths: [ 'login.password' ],
  factor: 11
});

module.exports = createModel('User', userSchema);
