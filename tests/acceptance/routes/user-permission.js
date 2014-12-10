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
    session        = require(cwd + '/lib/security/session'),
    mongoose       = require('mongoose'),
    UserPermission = require(cwd + '/models/user-permission');

describe('Route :: User-Permissions', function () {

  describe('Scenarios', function () {
    var _token, _perms, _user;

    /* Test support */
    before(function ( done ) {
      var User            = require(cwd + '/models/user'),
          PermissionGroup = require(cwd + '/models/permission-group');

      var permissionArray = [{
        name: 'User Permissions',
        endpoints: [ '/user-permission/', '/user-permissions/', '/user-permissions/:id/' ],
        type: 'resource',
        permissions: [
          {
            name: 'Create',
            type: 'post'
          },
          {
            name: 'Update',
            type: 'put'
          }
        ]
      }];

      PermissionGroup.create(permissionArray, function ( err, firstPerm ) {
        if( err ) {
          throw err;
        }

        var userPerm = [ firstPerm.permissions.toObject()[0], firstPerm.permissions.toObject()[1] ],
            userId   = mongoose.Types.ObjectId();

        userPerm = userPerm.map(function ( p ) {
          p.group = firstPerm._id;
          p.user = userId;
          return p;
        });

        UserPermission.create(userPerm, function ( err, firstUserPerm, secondUserPerm ) {
          if( err ) {
            throw err;
          }

          _perms = [ firstPerm ];

          var user = new User({
            type: 'admin',
            login: {
              email: 'mocha@test.js',
              password: 'latte'
            },
            permissions: [ firstUserPerm._id.toString(), secondUserPerm._id.toString() ]
          });

          user.save(function ( err, user ) {
            if( err ) {
              throw err;
            }

            _user = user;

            session.create( user._id, {}, 'Session' ).then(function ( userSession ) {
              _token = userSession.publicKey;
              done();
            }).catch(function ( err ) {
              return respond.error.res( res, err, true );
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

    it('should be secured', function ( done ) {
      chai.request(app)
        .post('/api/user-permissions/')
        .then(function ( res ) {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('should reject invalid POST requests', function ( done ) {
      chai.request(app)
        .post('/api/user-permissions/')
        .set('X-API-Token', _token)
        .then(function ( res ) {
          expect(res).to.have.status(400);
          expect(res.error.text.toLowerCase()).to.contain('provide').and.to.contain('payload');

          chai.request(app)
            .post('/api/user-permissions/')
            .set('X-API-Token', _token)
            .send({
              userPermission: {
                user: _user._id,
                type: 'post',
                name: 'test'
              }
            })
            .then(function ( res ) {
              expect(res).to.have.status(400);
              expect(res.error.text.toLowerCase()).to.contain('invalid').and.to.contain('payload');

              chai.request(app)
                .post('/api/user-permissions/')
                .set('X-API-Token', _token)
                .send({
                  userPermission: {
                    user: _user._id,
                    group: _perms[0]._id,
                    type: 'post'
                  }
                })
                .then(function ( res ) {
                  expect(res).to.have.status(400);
                  expect(res.error.text.toLowerCase()).to.contain('invalid').and.to.contain('payload');

                  chai.request(app)
                    .post('/api/user-permissions/')
                    .set('X-API-Token', _token)
                    .send({
                      userPermission: {
                        user: _user._id,
                        group: _perms[0]._id,
                        type: 'get',
                        name: 'Read'
                      }
                    })
                    .then(function ( res ) {
                      expect(res).to.have.status(401);
                      expect(res.error.text.toLowerCase()).to.contain('permissions').and.to.contain('do not have');

                      done();
                    });
                });
            });
        });
    });

    it('should create user permissions', function ( done ) {
      chai.request(app)
        .post('/api/user-permissions/')
        .set('X-API-Token', _token)
        .send({
          userPermission: {
            group: _perms[0]._id,
            user:  _user._id,
            type: 'post',
            name: 'Create'
          }
        })
        .then(function ( res ) {
          expect(res).to.have.status(201).and.to.be.json;

          expect(res.body.userPermission)
            .to.exist
            .and.to.be.an('object');
          expect(res.body.userPermission)
            .to.have.property('_id');
          expect(res.body.userPermission)
            .to.have.property('user', _user._id.toString());
          expect(res.body.userPermission)
            .to.have.property('group');
          expect(res.body.userPermission)
            .to.have.property('type');
          expect(res.body.userPermission)
            .to.have.property('name');

          UserPermission.findById(res.body.userPermission._id, function ( err, perm ) {
            if( err ) throw err;

            expect(perm).to.exist;
            done();
          });
        });
    });

    it('should reject invalid PUT requests', function ( done ) {
      chai.request(app)
        .put('/api/user-permissions/54874d21f2741292c813aa18/')
        .set('X-API-Token', _token)
        .then(function ( res ) {
          expect(res).to.have.status(400);
          expect(res.error.text.toLowerCase()).to.contain('provide').and.to.contain('payload');

          chai.request(app)
            .put('/api/user-permissions/54874d21f2741292c813aa18/')
            .set('X-API-Token', _token)
            .send({
              userPermission: {
                group: _perms[0]._id,
                user:  _user._id,
                type:  'post',
                name:  'test',
              }
            })
            .then(function ( res ) {
              expect(res).to.have.status(404);

              chai.request(app)
                .put('/api/user-permissions/54874d21f2741292c813aa18/')
                .set('X-API-Token', _token)
                .send({
                  userPermission: {
                    user: _user._id,
                    type: 'post',
                    name: 'test'
                  }
                })
                .then(function ( res ) {
                  expect(res).to.have.status(400);
                  expect(res.error.text.toLowerCase()).to.contain('invalid').and.to.contain('payload');

                  chai.request(app)
                    .put('/api/user-permissions/54874d21f2741292c813aa18/')
                    .set('X-API-Token', _token)
                    .send({
                      userPermission: {
                        user:  _user._id,
                        group: _perms[0]._id
                      }
                    })
                    .then(function ( res ) {
                      expect(res).to.have.status(400);
                      expect(res.error.text.toLowerCase()).to.contain('invalid').and.to.contain('payload');

                      done();
                    });
                });
            });
        });
    });

    it('should update user permissions', function ( done ) {
      var permRecord = new UserPermission({
        group: _perms[ 0 ]._id,
        user:  _user._id,
        type: 'post',
        name: 'Create'
      });

      permRecord.save(function ( err, newPerm ) {
        if( err ) throw err;

        chai.request(app)
          .put('/api/user-permissions/' + newPerm._id)
          .set('X-API-Token', _token)
          .send({
            userPermission: {
              group: _perms[0]._id,
              user:  _user._id,
              type:  'get',
              name:  'Read'
            }
          })
          .then(function ( res ) {
            expect(res).to.have.status(401);
            expect(res.error.text.toLowerCase()).to.contain('permissions').and.to.contain('do not have');

            chai.request(app)
              .put('/api/user-permissions/' + newPerm._id)
              .set('X-API-Token', _token)
              .send({
                userPermission: {
                  group: _perms[0]._id,
                  user:  _user._id,
                  type:  'put',
                  name:  'Update'
                }
              })
              .then(function ( res ) {
                expect(res)
                  .to.have.status(200)
                  .and.to.be.json;

                expect(res.body.userPermission)
                  .to.have.property('_id');
                expect(res.body.userPermission)
                  .to.have.property('user', _user._id.toString());
                expect(res.body.userPermission)
                  .to.have.property('group');
                expect(res.body.userPermission)
                  .to.have.property('type');
                expect(res.body.userPermission)
                  .to.have.property('name');

                UserPermission.findById(newPerm._id, function ( err, perm ) {
                  if( err ) throw err;

                  expect(perm.name).to.equal('Update');
                  expect(perm.type).to.equal('put');

                  done();
                });
              });
          });
      });
    });
  });
});
