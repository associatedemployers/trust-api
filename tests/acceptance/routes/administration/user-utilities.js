/* jshint expr:true */
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
    mongoose       = require('mongoose'),
    bcp            = require('bcrypt'),
    User           = require(cwd + '/models/user'),
    session        = require(cwd + '/lib/security/session'),
    UserPermission = require(cwd + '/models/user-permission');

describe('Route :: User Utilities', function () {

  describe('Endpoints', function () {
    var _user, _testId;

    /* Test support */
    before(function ( done ) {
      var PermissionGroup = require(cwd + '/models/permission-group');

      var permissionArray = [{
        name: 'Users',
        endpoints: [ '/users/', '/users/:id/' ],
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

      PermissionGroup.create(permissionArray).then(perms => {
        var userId = mongoose.Types.ObjectId();
        _testId = userId;

        var userPerm = perms[0].permissions.map(p => {
          var _p = p.toObject();
          _p.group = perms[0]._id;
          _p.user  = userId;
          return _p;
        });

        return UserPermission.create(userPerm).then(userPerms => {
          var user = new User({
            _id: userId,
            type: 'admin',
            login: {
              email: 'mocha@test.js'
            },
            permissions: userPerms.map(p => {
              return p._id.toString();
            })
          });

          return user.save();
        })
        .then(user => {
          _user = user;
          return session.create(user._id, {}, 'Session');
        })
        .then(() => done());
      })
      .catch(done);
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

        it('should return 404 for not found, and already verified ids', function ( done ) {
          User.update({ _id: _testId }, { $set: { verified: true } }).exec(function ( err ) {
            if ( err ) {
              return done(err);
            }

            chai.request(app)
              .get('/api/user/verify/' + mongoose.Types.ObjectId())
              .then(function ( res ) {
                expect(res).to.have.status(404);

                return chai.request(app).get('/api/user/verify/' + _testId);
              })
              .then(function ( res ) {
                expect(res).to.have.status(404);

                User.findByIdAndUpdate(_testId, { $set: { verified: false } }, function ( err ) {
                  if ( err ) {
                    return done(err);
                  }

                  done();
                });
              });
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

        it('should return 404 for not found, and already verified ids', function ( done ) {
          User.update({ _id: _testId }, { $set: { verified: true } }).exec(function ( err ) {
            if ( err ) {
              return done(err);
            }

            chai.request(app)
              .post('/api/user/verify/' + mongoose.Types.ObjectId())
              .then(function ( res ) {
                expect(res).to.have.status(404);

                return chai.request(app).post('/api/user/verify/' + _testId);
              })
              .then(function ( res ) {
                expect(res).to.have.status(404);

                User.update({ _id: _testId }, { $set: { verified: false } }).exec(function ( err ) {
                  if ( err ) {
                    return done(err);
                  }

                  done();
                });
              });
          });
        });

        it('should reject valid requests without password', function ( done ) {
          chai.request(app)
            .post('/api/user/verify/' + _testId)
            .then(function ( res ) {
              expect(res).to.have.status(400);
              expect(res.error.text.toLowerCase()).to.contain('provide').and.to.contain('password');

              done();
            });
        });

        it('should set password for user w/ encryption', function ( done ) {
          var pass = 'test123';

          chai.request(app)
            .post('/api/user/verify/' + _testId)
            .send({
              password: pass
            })
            .then(function ( res ) {
              expect(res).to.have.status(200);

              User.findById(_testId, function ( err, doc ) {
                if ( err ) {
                  return done(err);
                }

                expect(doc.login.password).to.exist;
                expect(bcp.compareSync(pass, doc.login.password)).to.equal(true); // See if it's encrypted.
                done();
              });
            });
        });

      });

    });
  });
});
