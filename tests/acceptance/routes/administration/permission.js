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

var app      = require(cwd + '/app').init( require('express')() ),
    session  = require(cwd + '/lib/security/session'),
    mongoose = require('mongoose');

describe('Route :: Permissions', function () {

  describe('Scenarios', function () {
    var _token, _perms;

    /* Test support */
    before(function ( done ) {
      var User            = require(cwd + '/models/user'),
          PermissionGroup = require(cwd + '/models/permission-group'),
          UserPermission  = require(cwd + '/models/user-permission');

      var permissionArray = [{
        name: 'Protected resource',
        endpoints: [ '/protected-resource' ],
        type: 'resource',
        permissions: [{
          name: 'View',
          type: 'get'
        }, {
          name: 'Update',
          type: 'put'
        }]
      }];

      permissionArray.push(permissionArray[0]);
      permissionArray[1].endpoints = [ '/other-protected-resource' ];

      PermissionGroup.create(permissionArray, function ( err, perms ) {
        if ( err ) {
          return done(err);
        }

        var userPerm = perms[0].permissions.toObject()[0],
            userId   = mongoose.Types.ObjectId();

        userPerm.group = perms[0]._id;
        userPerm.user  = userId;

        UserPermission.create(userPerm, function ( err, userPerms ) {
          if ( err ) {
            return done(err);
          }

          _perms = perms;

          var user = new User({
            type: 'admin',
            login: {
              email: 'mocha@test.js',
              password: 'latte'
            },
            permissions: userPerms
          });

          user.save(function ( err, user ) {
            if( err ) {
              throw err;
            }

            session.create( user._id, {}, 'Session' ).then(function ( userSession ) {
              _token = userSession.publicKey;
              done();
            }).catch(done);
          });
        });
      });
    });

    after(function ( done ) {
      var mongoose = require('mongoose');
      mongoose.connection.db.dropDatabase(done);
    });
    /* ./ Test support */

    it('should return only permissions that user has', function ( done ) {
      chai.request(app)
        .get('/api/permissions/')
        .set('X-API-Token', _token)
        .then(function ( res ) {
          expect(res).to.have.status(200).and.to.be.json;
          expect(res.body.permissionGroup).to.exist.and.to.be.an('array').and.to.have.length(1);
          expect(res.body.permissionGroup[0]._id).to.equal(_perms[0]._id.toString());
          done();
        });
    });
  });
});
