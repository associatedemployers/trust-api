/*
  User (admin) - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var ticker     = require(process.cwd() + '/lib/ticker/ticker'),
    cryptify   = require('./plugins/cryptify'),
    searchable = require('./plugins/searchable');

var permissionSchema = new Schema({
  name:  String, // Semantic
  type:  String, // HTTP Verb
  value: Boolean
});

var permissionGroupSchema = new Schema({
  name:        String,     // if any resource
  endpoints:   [ String ], // ex. /employees
  type:        String,
  permissions: [ permissionSchema ]
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

  email:         String,
  type:          String,
  super:         Boolean,
  receiveEmails: Boolean,
  apiAccess:     Boolean,

  permissions: [ permissionGroupSchema ],

  time_stamp: { type: Date, default: Date.now, index: true }
});

// Attach some mongoose hooks
userSchema = ticker.attach( userSchema )
            .plugin(cryptify, {
              paths: [ 'login.password' ],
              factor: 11
            });

module.exports = createModel('User', userSchema);
