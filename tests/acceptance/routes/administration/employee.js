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
    User           = require(cwd + '/models/user'),
    session        = require(cwd + '/lib/security/session'),
    mongoose       = require('mongoose'),
    UserPermission = require(cwd + '/models/user-permission'),
    Employee       = require(cwd + '/models/employee');

describe('Route :: Employees', function () {

  describe('Endpoints', function () {
    var _token, _testEmployee;

    /* Test support */
    before(function ( done ) {
      var PermissionGroup = require(cwd + '/models/permission-group');

      var permissionArray = [{
        name: 'Users',
        endpoints: [ '/employees/', '/employees/:id/' ],
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
        if ( err ) {
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
          if ( err ) {
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
            if ( err ) {
              return done(err);
            }

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

    describe('GET', function () {
      before(function ( done ) {
        var testEmployee = new Employee({
          name: {
            first: 'test',
            last:  'me'
          },
          ssn: '123'
        });

        testEmployee.save(function ( err, emp ) {
          if ( err ) {
            return done(err);
          }

          _testEmployee = emp;
          done();
        });
      });

      describe('all', function () {
        it('should return documents', function ( done ) {
          chai.request(app)
            .get('/api/employees/')
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(200);
              expect(res.body.employee).to.be.an('array');
              done();
            });
        });
      });

      describe('/:id', function () {
        it('should 404 not found documents', function ( done ) {
          chai.request(app)
            .get('/api/employees/' + mongoose.Types.ObjectId())
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(404);
              done();
            });
        });

        it('should return a document when found', function ( done ) {
          chai.request(app)
            .get('/api/employees/' + _testEmployee._id.toString())
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(200);
              expect(res.body.employee).to.have.property('_id').and.to.equal(_testEmployee._id.toString());
              done();
            });
        });

        describe('w/ snapshot parameter', function () {
          it('should 404 snapshot not found', function ( done ) {
            chai.request(app)
              .get('/api/employees/' + _testEmployee._id.toString() + '?snapshot=' + mongoose.Types.ObjectId())
              .set('X-API-Token', _token)
              .then(function ( res ) {
                expect(res).to.have.status(404);
                done();
              });
          });

          it('should return a valid [updated | previous] snapshot of document', function ( done ) {
            Employee.findById(_testEmployee._id, function ( err, _dbRecord ) {
              if ( err ) {
                return done(err);
              }

              _dbRecord.waived = true;

              _dbRecord.save(function ( err, _newRecord ) {
                if ( err ) {
                  return done(err);
                }

                chai.request(app)
                  .get('/api/employees/' + _newRecord._id.toString() + '?snapshot=' + _newRecord.historyEvents[0].toString())
                  .set('X-API-Token', _token)
                  .then(function ( res ) {
                    expect(res).to.have.status(200);
                    expect(res.body.employee).to.have.property('_id').and.to.equal(_newRecord._id.toString());
                    expect(res.body.employee.waived).to.equal(true);

                    return chai.request(app)
                      .get('/api/employees/' + _newRecord._id.toString() + '?snapshot=' + _newRecord.historyEvents[0].toString() + '&snapshotDirection=previous')
                      .set('X-API-Token', _token);
                  })
                  .then(function ( res ) {
                    expect(res).to.have.status(200);
                    expect(res.body.employee).to.have.property('_id').and.to.equal(_newRecord._id.toString());
                    expect(res.body.employee.waived).to.be.undefined;
                    done();
                  });
              });
            });
          });
        });
      });
    });

  });
});
