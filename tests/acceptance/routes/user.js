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

describe('Route :: Users', function () {

  describe('Scenarios', function () {
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

    it('should be secured', function ( done ) {
      chai.request(app)
        .post('/api/users/')
        .then(function ( res ) {
          // POST
          expect(res).to.have.status(401);
          return chai.request(app).get('/api/users/' + mongoose.Types.ObjectId());
        }).then(function ( res ) {
          // DELETE
          expect(res).to.have.status(401);
          return chai.request(app).delete('/api/users/' + mongoose.Types.ObjectId());
        }).then(function ( res ) {
          // GET by id
          expect(res).to.have.status(401);
          return chai.request(app).get('/api/users/');
        }).then(function ( res ) {
          // GET all
          expect(res).to.have.status(401);
          return chai.request(app).put('/api/users/' + mongoose.Types.ObjectId());
        }).then(function ( res ) {
          // PUT
          expect(res).to.have.status(401);
          done();
        });
    });

    describe('Invalid Requests', function () {
      describe('GET /:id/', function () {
        it('should reject invalid requests', function ( done ) {
          chai.request(app)
            .get('/api/users/123456789')
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(401);
              done();
            });
        });
      });

      describe('POST', function () {
        it('should reject invalid payloads', function ( done ) {
          chai.request(app)
            .post('/api/users/')
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(400);
              expect(res.error.text.toLowerCase())
                .to.contain('payload')
                .and.to.contain('prefix');

              return chai.request(app)
                .post('/api/users/')
                .set('X-API-Token', _token)
                .send({
                  user: {
                    name: {}
                  }
                });
            }).then(function ( res ) {
              expect(res).to.have.status(400);
              expect(res.error.text.toLowerCase())
                .to.contain('incomplete')
                .and.to.contain('payload');

              return chai.request(app)
                .post('/api/users/')
                .set('X-API-Token', _token)
                .send({
                  user: {
                    name: { first: 'test', last: 'tester' },
                    login: {}
                  }
                });
            }).then(function ( res ) {
              expect(res).to.have.status(400);
              expect(res.error.text.toLowerCase())
                .to.contain('incomplete')
                .and.to.contain('payload');

              done();
            });
        });

        it('should reject creation of super users by users that are not super', function ( done ) {
          chai.request(app)
            .post('/api/users/')
            .set('X-API-Token', _token)
            .send({
              user: {
                login: {
                  email: 'test@email.com'
                },
                name: {
                  first: 'test',
                  last: 'user'
                },
                super: true
              }
            })
            .then(function ( res ) {
              expect(res).to.have.status(401);
              expect(res.error.text.toLowerCase()).to.contain('cannot').and.to.contain('super');

              done();
            });
        });

        it('should reject duplicates', function ( done ) {
          chai.request(app)
            .post('/api/users/')
            .set('X-API-Token', _token)
            .send({
              user: {
                name: {
                  first: 'Test',
                  last: 'Tester'
                },
                login: {
                  email: 'mocha@test.js'
                }
              }
            })
            .then(function ( res ) {
              expect(res).to.have.status(400);
              expect(res.error.text.toLowerCase()).to.contain('exists');

              done();
            });
        });
      });

      describe('PUT /:id/', function () {
        it('should reject no id', function ( done ) {
          chai.request(app)
            .put('/api/users/')
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(404);
              done();
            });
        });

        it('should reject invalid payloads', function ( done ) {
          chai.request(app)
            .put('/api/users/' + mongoose.Types.ObjectId())
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(400);
              expect(res.error.text.toLowerCase())
                .to.contain('payload')
                .and.to.contain('prefix');

              done();
            });
        });

        it('should reject updating to super without super status', function ( done ) {
          var user = new User({
            login: {
              email: 'my@test.user2'
            },
            name: {
              first: 'test',
              last: 'user'
            }
          });

          user.save(function ( err, usr ) {
            if( err ) throw err;
            chai.request(app)
              .put('/api/users/' + usr._id.toString())
              .set('X-API-Token', _token)
              .send({
                user: {
                  super: true
                }
              })
              .then(function ( res ) {
                expect(res).to.have.status(401);
                expect(res.error.text.toLowerCase()).to.contain('cannot').and.to.contain('super');

                done();
              });
          });
        });

        it('should reject downgrading of super users', function ( done ) {
          var user = new User({
            login: {
              email: 'my@test.user3'
            },
            name: {
              first: 'test',
              last: 'user'
            },
            super: true
          });

          user.save(function ( err, usr ) {
            if( err ) throw err;
            chai.request(app)
              .put('/api/users/' + usr._id.toString())
              .set('X-API-Token', _token)
              .send({
                user: {
                  super: false
                }
              })
              .then(function ( res ) {
                expect(res).to.have.status(400);
                expect(res.error.text.toLowerCase()).to.contain('cannot').and.to.contain('super');

                done();
              });
          });
        });
      });

      describe('DELETE /:id/', function () {
        it('should reject no id', function ( done ) {
          chai.request(app)
            .delete('/api/users/')
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(404);
              done();
            });
        });

        it('should reject deletion of super users', function ( done ) {
          var user = new User({
            login: {
              email: 'my@test.user'
            },
            name: {
              first: 'test',
              last: 'user'
            },
            super: true
          });

          user.save(function ( err, usr ) {
            if( err ) throw err;

            chai.request(app)
              .delete('/api/users/' + usr._id.toString())
              .set('X-API-Token', _token)
              .then(function ( res ) {
                expect(res).to.have.status(401);
                expect(res.error.text.toLowerCase())
                  .to.contain('cannot')
                  .and.to.contain('super');

                User.findById(usr._id, function ( err, foundUser ) {
                  if( err ) throw err;
                  expect(foundUser).to.exist;
                  done();
                });
              });
          });
        });
      });
    });

    describe('Valid Requests', function () {
      describe('GETs', function () {
        it('should retrieve /:id/', function ( done ) {
          chai.request(app)
          .get('/api/users/' + _user._id.toString())
          .set('X-API-Token', _token)
          .then(function ( res ) {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object').and.to.have.property('user');
            expect(res.body.user.login.email).to.equal('mocha@test.js');

            done();
          });
        });

        it('should retrieve all', function ( done ) {
          chai.request(app)
            .get('/api/users/')
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an('object').and.to.have.property('user');
              expect(res.body.user).to.be.an('array');
              expect(res.body.user[0]).to.be.an('object').and.to.have.property('login');

              done();
            });
        });
      });

      it('should create users', function ( done ) {
        var now = new Date();

        chai.request(app)
          .post('/api/users/')
          .set('X-API-Token', _token)
          .send({
            user: {
              login: {
                email: 'my@test.post',
                password: 'test'
              },
              name: {
                first: 'tester',
                last: 'awesome'
              },
              time_stamp: now
            }
          })
          .then(function ( res ) {
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object').and.to.have.property('user');
            expect(res.body.user).to.have.property('_id');
            expect(res.body.user.login.email).to.equal('my@test.post');
            expect(res.body.user.name.first).to.equal('tester');
            expect(res.body.user.name.last).to.equal('awesome');

            User.findById(res.body.user._id, function ( err, foundUser ) {
              if( err ) throw err;

              expect(foundUser.login.email).to.equal('my@test.post');
              expect(foundUser.name.first).to.equal('tester');
              expect(foundUser.name.last).to.equal('awesome');
              expect(foundUser.time_stamp.toString()).to.equal(now.toString());
              expect(foundUser.login.password).not.to.equal('test'); // Encryption check

              done();
            });
          });
      });

      it('should update users', function ( done ) {
        var user = new User({
          login: {
            email: 'my@test.user'
          },
          name: {
            first: 'test',
            last: 'user'
          }
        });

        user.save(function ( err, usr ) {
          if( err ) throw err;

          var now = new Date();

          chai.request(app)
            .put('/api/users/' + usr._id.toString())
            .set('X-API-Token', _token)
            .send({
              user: {
                login: {
                  email: 'my@test.js'
                },
                name: {
                  first: 'tester',
                  last: 'awesome'
                },
                time_stamp: now
              }
            })
            .then(function ( res ) {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an('object').and.to.have.property('user');
              expect(res.body.user._id).to.equal(usr._id.toString());
              expect(res.body.user.login.email).to.equal('my@test.js');
              expect(res.body.user.name.first).to.equal('tester');
              expect(res.body.user.name.last).to.equal('awesome');

              User.findById(usr._id, function ( err, foundUser ) {
                if( err ) throw err;

                expect(foundUser.login.email).to.equal('my@test.js');
                expect(foundUser.name.first).to.equal('tester');
                expect(foundUser.name.last).to.equal('awesome');
                expect(foundUser.time_stamp.toString()).to.equal(now.toString());

                done();
              });
            });
        });
      });

      it('should delete users', function ( done ) {
        var user = new User({
          login: {
            email: 'my@test.user'
          },
          name: {
            first: 'test',
            last: 'user'
          }
        });

        user.save(function ( err, usr ) {
          if( err ) throw err;

          chai.request(app)
            .delete('/api/users/' + usr._id.toString())
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an('object').and.to.have.property('user');
              expect(res.body.user._id).to.equal(usr._id.toString());

              User.findById(usr._id, function ( err, foundUser ) {
                if( err ) throw err;
                expect(foundUser).to.not.exist;
                done();
              });
            });
        });
      });
    });
  });
});
