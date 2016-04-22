/* jshint expr:true */
var allTypes = [ 'getone', 'get', 'post', 'put', 'delete' ];
var routes = [{
  name: 'Employees'
}, {
  name: 'Users'
}, {
  name: 'Companies'
}, {
  name: 'Dependents'
}, {
  name: 'Files'
}, {
  name: 'History-Events'
}, {
  name: 'company/locations'
}, {
  name: 'Medical-Plans'
}, {
  name: 'Medical-Rates'
}, {
  name: 'Dental-Rates'
}, {
  name: 'Vision-Rates'
}, {
  name: 'Life-Rates'
}, {
  name: 'Permissions'
}];

var cwd = process.cwd();

var chai    = require('chai'),
    expect  = chai.expect,
    Promise = require('bluebird'); // jshint ignore:line

var plugins = [
  require('chai-as-promised'),
  require('chai-http')
];

plugins.map(function ( plugin ) {
  chai.use( plugin );
});

chai.request.addPromises(Promise);

var app            = require(cwd + '/app').init( require('express')() ),
    User           = require(cwd + '/models/user'),
    session        = require(cwd + '/lib/security/session'),
    mongoose       = require('mongoose'),
    UserPermission = require(cwd + '/models/user-permission');

function createRequestForType ( type, name ) {
  var endpoint = type === 'put' || type === 'delete' || type === 'getone' ? '/api/' + name + '/' + mongoose.Types.ObjectId() : '/api/' + name;
  var _type = type === 'getone' ? 'get' : type;

  return chai.request(app)[_type](endpoint).then(res => {
    expect(res, _type.toUpperCase() + ' to ' + name).to.have.status(401);
  });
}


describe('Routes :: Existence & Security Check', function () {
  /* Test support */
  before(function ( done ) {
    var PermissionGroup = require(cwd + '/models/permission-group');

    var permissionArray = [{
      name: 'Users',
      endpoints: routes.reduce(function ( arr, item ) {
        var s = '/' + item.name.toLowerCase() + '/';
        return arr.concat(s, s + ':id/');
      }, []),
      type: 'resource',
      permissions: [{
        name: 'Read',
        type: 'get'
      }, {
        name: 'Create',
        type: 'post'
      }, {
        name: 'Update',
        type: 'put'
      }, {
        name: 'Delete',
        type: 'delete'
      }]
    }];

    PermissionGroup.create(permissionArray, function ( err, perms ) {
      if( err ) {
        return done(err);
      }

      var userId = mongoose.Types.ObjectId();

      var userPerm = perms[0].permissions.map(p => {
        var _p = p.toObject();
        _p.group = perms[0]._id;
        _p.user = userId;
        return _p;
      });

      UserPermission.create(userPerm, function ( err, userPerms ) {
        if( err ) {
          return done(err);
        }

        var user = new User({
          type: 'admin',
          login: {
            email: 'mocha@test.js',
            password: 'latte'
          },
          permissions: userPerms.map(p => p._id.toString())
        });

        user.save(function ( err, user ) {
          if( err ) {
            return done(err);
          }

          session.create( user._id, {}, 'Session' ).then(() => {
            done();
          });
        });
      });
    });
  });

  after(function ( done ) {
    var mongoose = require('mongoose');
    mongoose.connection.db.dropDatabase(done);
  });
  /* ./ Test support */

  it('should exist and be secured', function ( done ) {
    Promise.all(routes.map(function ( route ) {
      route.types = route.types || allTypes;

      return Promise.all(route.types.map(function ( routeType ) {
        return createRequestForType( routeType.toLowerCase(), route.name.toLowerCase() );
      }));
    })).then(function () {
      done();
    });
  });
});
