/*
  User Permission - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var permissionSchema = new Schema({
  user:   { type: Schema.ObjectId, ref: 'User' },
  group:  { type: Schema.ObjectId, ref: 'PermissionGroup' },
  name:   String,
  type:   String,

  time_stamp: { type: Date, default: Date.now }
});

module.exports = createModel('UserPermission', permissionSchema);
