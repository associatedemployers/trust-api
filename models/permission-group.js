/*
  Permission Group - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var permissionSchema = new Schema({
  name:  String, // Semantic
  type:  String  // HTTP Verb
}, { _id: false });

var permissionGroupSchema = new Schema({
  name:        String,     // if any resource
  endpoints:   [ String ], // ex. /employees
  type:        String,
  permissions: [ permissionSchema ],

  'time_stamp': { type: Date, default: Date.now, index: true }
});

module.exports = createModel('PermissionGroup', permissionGroupSchema);
