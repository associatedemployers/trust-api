/* jshint expr:true */
process.env.environment = 'test';

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

if( !process.env.verboseLogging ) {
  // Suppress debug logging
  winston.loggers.add('default', {
    transports: [
      new ( winston.transports.Console )({ level: 'info' })
    ]
  });
}

var app     = require(cwd + '/app').init( require('express')() ),
    session = require(cwd + '/lib/security/session');

describe('Route :: Permissions', function () {

  describe('Scenarios', function () {
    var _token, _perms;

    /* Test support */
    before(function ( done ) {
      var User            = require(cwd + '/models/user'),
          PermissionGroup = require(cwd + '/models/permission-group');

      var permissionArray = [{
        name: 'Protected resource',
        endpoints: [ '/protected-resource' ],
        type: 'resource',
        permissions: [
          {
            name: 'View',
            type: 'get'
          },
          {
            name: 'Update',
            type: 'put'
          }
        ]
      }];

      permissionArray.push(permissionArray[0]);
      permissionArray[1].endpoints = [ '/other-protected-resource' ];

      PermissionGroup.create(permissionArray, function ( err, firstPerm, secondPerm ) {
        if( err ) {
          throw err;
        }

        _perms = [ firstPerm, secondPerm ];

        var user = new User({
          type: 'admin',
          login: {
            email: 'mocha@test.js',
            password: 'latte'
          },
          permissions: [ firstPerm._id ]
        });

        user.save(function ( err, user ) {
          if( err ) {
            throw err;
          }

          session.create( user._id, {}, 'Session' ).then(function ( userSession ) {
            _token = userSession.publicKey;
            done();
          }).catch(function ( err ) {
            return respond.error.res( res, err, true );
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
