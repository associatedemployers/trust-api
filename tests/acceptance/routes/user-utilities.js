/* jshint expr:true */
var cwd = process.cwd();

var chai    = require('chai'),
    expect  = chai.expect,
    moment  = require('moment'),
    _       = require('lodash'),
    chalk   = require('chalk'),
    winston = require('winston'),
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

describe('Route :: User Utilities', function () {

  describe('Endpoints', function () {
    var _token, _perms, _user;

    /* Test support */
    before(function ( done ) {
      var PermissionGroup = require(cwd + '/models/permission-group');

      var permissionArray = [{
        name: 'Users',
        endpoints: [ '/users/', '/users/:id/' ],
        type: 'resource',
        permissions: [
          {
            name: 'Read',
            type: 'get'
          },
          {
            name: 'Create',
            type: 'post'
          },
          {
            name: 'Update',
            type: 'put'
          },
          {
            name: 'Delete',
            type: 'delete'
          }
        ]
      }];

      PermissionGroup.create(permissionArray, function ( err, firstPerm ) {
        if( err ) {
          throw err;
        }

        var userId = mongoose.Types.ObjectId();

        var userPerm = firstPerm.permissions.map(function ( p ) {
          p       = p.toObject();
          p.group = firstPerm._id;
          p.user  = userId;
          return p;
        });

        UserPermission.create(userPerm, function ( err ) {
          if( err ) {
            throw err;
          }

          var args = Array.prototype.slice.call(arguments, 0);
          args.shift();

          _perms = args;

          var user = new User({
            type: 'admin',
            login: {
              email: 'mocha@test.js',
              password: 'latte'
            },
            permissions: args.map(function ( p ) {
              return p._id.toString();
            })
          });

          user.save(function ( err, user ) {
            if( err ) {
              throw err;
            }

            _user = user;

            session.create( user._id, {}, 'Session' ).then(function ( userSession ) {
              _token = userSession.publicKey;
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

    describe('user/verify', function () {
      describe('GET', function () {
        it('should return 400 for invalid id', function ( done ) {
          chai.request(app)
            .get('/api/user/verify/123')
            .then(function ( res ) {
              expect(res).to.have.status(400);
              expect(res.error.text.toLowerCase()).to.contain('valid').and.to.contain('id');
              done();
            });
        });

        it('should return 404 for not found id', function ( done ) {
          chai.request(app)
            .get('/api/user/verify/' + mongoose.Types.ObjectId())
            .then(function ( res ) {
              expect(res).to.have.status(404);
              done();
            });
        });

        it('should return 200 with valid id', function ( done ) {
          chai.request(app)
            .get('/api/user/verify/' + _user._id.toString())
            .then(function ( res ) {
              expect(res).to.have.status(200);
              done();
            });
        });
      });

      describe('POST', function () {
        
      });
    });
  });
});
