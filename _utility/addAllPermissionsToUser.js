module.exports = function ( userId ) {
  var cwd = process.cwd() + '/';
  var PermissionGroup = require(cwd + 'models/permission-group'),
      UserPermission  = require(cwd + 'models/user-permission'),
      User            = require(cwd + 'models/user'),
      _               = require('lodash');

  PermissionGroup.find({}, function ( err, permissionGroups ) {
    if( err ) throw err;

    var tbcPermissions = [];

    permissionGroups.forEach(function ( permissionGroup ) {
      permissionGroup.permissions.forEach(function ( perm ) {
        tbcPermissions.push({
          user:  userId,
          group: permissionGroup._id,
          name:  perm.name,
          type:  perm.type
        });
      });
    });

    User.findById(userId, function ( err, user ) {
      if( err ) throw err;

      UserPermission.create(tbcPermissions, function ( err ) {
        if( err ) throw err;

        user.permissions = [];

        for ( var i = 1; i < Object.keys(arguments).length; i++ ) {
          user.permissions.push(arguments[i]._id);
        }

        user.save(function ( err, record ) {
          if( err ) throw err;

          console.log('saved user', record._id, 'w/', record.permissions.length, 'user permissions.');
        });
      });
    });
  });
};
