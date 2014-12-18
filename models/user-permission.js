/*
  User Permission - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel     = require('./helpers/create-model'),
    PermissionGroup = require('./permission-group');

var permissionSchema = new Schema({
  user:      { type: Schema.ObjectId, ref: 'User' },
  group:     { type: Schema.ObjectId, ref: 'PermissionGroup' },
  groupName: String,
  name:      String,
  type:      String,

  time_stamp: { type: Date, default: Date.now }
});

permissionSchema.pre('save', function ( next ) {
  var self = this;

  PermissionGroup.findById(self.group, function ( err, group ) {
    if( err ) return next( err );

    self.groupName = group.name;
    next.call( self );
  });
});

module.exports = createModel('UserPermission', permissionSchema);
