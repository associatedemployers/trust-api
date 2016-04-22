/* jshint expr:true */
var cwd = process.cwd();

var chai    = require('chai'),
    expect  = chai.expect,
    _       = require('lodash'),
    Promise = require('bluebird'); // jshint ignore:line

var plugins = [
  require('chai-as-promised'),
  require('chai-http')
];

plugins.map(function ( plugin ) {
  chai.use( plugin );
});

chai.request.addPromises(Promise);

var authorizationMiddleware = require(cwd + '/lib/security/middleware/authorization'),
    sessionMiddleware       = require(cwd + '/lib/security/middleware/session'),
    mongoose                = require('mongoose'),
    express                 = require('express'),
    app                     = require(cwd + '/app');

describe('Route Middleware :: Authorization', function () {
  it('should generate a function', function () {
    expect(authorizationMiddleware).to.be.a('function');
    expect(authorizationMiddleware()).to.be.a('function');
  });

  describe('Operations', function () {
    var _router, _app, _token;

    /* Test support */
    before(function ( done ) {
      var User            = require(cwd + '/models/user'),
          PermissionGroup = require(cwd + '/models/permission-group'),
          UserPermission  = require(cwd + '/models/user-permission'),
          permission = new PermissionGroup({
            name: 'Protected resource',
            endpoints: [ '/protected-resource', '/protected-resource/:id', '/protected-resource/:id/test' ],
            type: 'resource',
            permissions: [{
              name: 'View',
              type: 'get'
            }, {
              name: 'Update',
              type: 'put'
            }]
          });

      permission.save().then(perm => {
        var userPerms = perm.toObject().permissions,
            userId    = mongoose.Types.ObjectId();

        userPerms[0].group = userPerms[1].group = perm._id;
        userPerms[0].user  = userPerms[1].user  = userId;

        return UserPermission.create(userPerms).then(perms => {
          var user = new User({
            _id: userId,
            type: 'admin',
            login: {
              email: 'mocha@test.js',
              password: 'latte'
            },
            permissions: _.map(perms, '_id')
          });

          return user.save();
        });
      })
      .then(() => done())
      .catch(done);
    });

    after(function ( done ) {
      mongoose.connection.db.dropDatabase(done);
    });

    beforeEach(function () {
      _router = express.Router();
      _app    = app.init( express() );
    });
    /* ./ Test support */

    it('should reject requests w/o permission group to the route', function ( done ) {
      _router.use( sessionMiddleware() );
      _router.use( authorizationMiddleware() );
      _router.get('/protected-resource-no-access', function () {});

      _app.use('/api', _router);

      chai.request(_app)
        .post('/api/user/login')
        .send({
          email: 'mocha@test.js',
          password: 'latte'
        })
        .then(function ( res ) {
          // Status Code 200
          expect(res).to.have.status(200);
          // Token object
          expect(res).to.be.json;
          // Proper res body
          expect(res.body.token).to.exist.and.to.be.a('string');

          _token = res.body.token;

          chai.request(_app)
            .get('/api/protected-resource-no-access')
            .set('X-API-Token', _token)
            .then(function (res) {
              // Status Code 401
              expect(res).to.have.status(401);
              // Relevant Error Message
              expect(res.text).to.contain('permission').and.to.contain('access');
              done();
            });
        });
    });

    it('should reject requests w/ permission group, but w/o method permission to the route', function ( done ) {
      _router.use( sessionMiddleware() );
      _router.use( authorizationMiddleware() );
      _router.get('/protected-resource', function () {});

      _app.use('/api', _router);

      chai.request(_app)
        .post('/api/user/login')
        .send({
          email: 'mocha@test.js',
          password: 'latte'
        })
        .then(function ( res ) {
          // Status Code 200
          expect(res).to.have.status(200);
          // Token object
          expect(res).to.be.json;
          // Proper res body
          expect(res.body.token).to.exist.and.to.be.a('string');

          _token = res.body.token;

          chai.request(_app)
            .post('/api/protected-resource')
            .set('X-API-Token', _token)
            .then(function (res) {
              // Status Code 401
              expect(res).to.have.status(401);
              // Relevant Error Message
              expect(res.text).to.contain('permission').and.to.contain('POST');
              done();
            });
        });
    });

    it('should reject requests where the user has a disallowed type', function ( done ) {
      _router.use( sessionMiddleware() );
      _router.use( authorizationMiddleware({ allow: [ 'user', 'otherpeep' ] }) );
      _router.get('/protected-resource', function () {});

      _app.use('/api', _router);

      chai.request(_app)
        .post('/api/user/login')
        .send({
          email: 'mocha@test.js',
          password: 'latte'
        })
        .then(function ( res ) {
          // Status Code 200
          expect(res).to.have.status(200);
          // Token object
          expect(res).to.be.json;
          // Proper res body
          expect(res.body.token).to.exist.and.to.be.a('string');

          _token = res.body.token;

          chai.request(_app)
            .get('/api/protected-resource')
            .set('X-API-Token', _token)
            .then(function ( res ) {
              // Status Code 401
              expect(res).to.have.status(401);
              // Relevant Error Message
              expect(res.text).to.contain('not allowed').and.to.contain('admins');
              done();
            });
        });
    });

    it('should allow requests with proper group & method permissions', function ( done ) {
      _router.use( sessionMiddleware() );
      _router.use( authorizationMiddleware() );
      _router.get('/protected-resource', function ( req ) {
        expect(req.permission, 'Permission').to.be.an('object');
        done();
      });

      _app.use('/api', _router);

      chai.request(_app)
        .post('/api/user/login')
        .send({
          email: 'mocha@test.js',
          password: 'latte'
        })
        .then(function ( res ) {
          // Status Code 200
          expect(res).to.have.status(200);
          // Token object
          expect(res).to.be.json;
          // Proper res body
          expect(res.body.token).to.exist.and.to.be.a('string');

          _token = res.body.token;

          chai.request(_app)
            .get('/api/protected-resource')
            .set('X-API-Token', _token)
            .then(function () {});
        });
    });

    it('should work with mounted routers', function ( done ) {
      _router.use( sessionMiddleware() );
      _router.use( authorizationMiddleware() );
      _router.get('/', function ( req ) {
        expect(req.permission, 'Permission').to.be.an('object');
        done();
      });

      _app.use('/api/protected-resource', _router);

      chai.request(_app)
        .post('/api/user/login')
        .send({
          email: 'mocha@test.js',
          password: 'latte'
        })
        .then(function ( res ) {
          // Status Code 200
          expect(res).to.have.status(200);
          // Token object
          expect(res).to.be.json;
          // Proper res body
          expect(res.body.token).to.exist.and.to.be.a('string');

          _token = res.body.token;

          chai.request(_app)
            .get('/api/protected-resource')
            .set('X-API-Token', _token)
            .then(function () {});
        });
    });

    it('should allow requests with proper permissions to a url with a dynamic segment', function ( done ) {
      _router.use( sessionMiddleware() );
      _router.use( authorizationMiddleware() );
      _router.get('/protected-resource/:id/test', function ( req, res ) {
        expect(req.permission, 'Permission').to.be.an('object');
        res.status(200).end();
      });
      _router.get('/protected-resource/:id/test/test2', function () {});
      _router.get('/protected-resource/:id', function ( req, res ) {
        expect(req.permission, 'Permission').to.be.an('object');
        res.status(200).end();
      });

      _app.use('/api', _router);

      chai.request(_app)
        .post('/api/user/login')
        .send({
          email: 'mocha@test.js',
          password: 'latte'
        })
        .then(function ( res ) {
          // Status Code 200
          expect(res).to.have.status(200);
          // Token object
          expect(res).to.be.json;
          // Proper res body
          expect(res.body.token).to.exist.and.to.be.a('string');

          _token = res.body.token;

          chai.request(_app)
            .get('/api/protected-resource/545a5a2822437826c0e58a59')
            .set('X-API-Token', _token)
            .then(function ( res ) {
              expect(res).to.have.status(200);

              chai.request(_app)
                .get('/api/protected-resource/545a5a2822437826c0e58a59/test')
                .set('X-API-Token', _token)
                .then(function ( res ) {
                  expect(res).to.have.status(200);

                  chai.request(_app)
                    .get('/api/protected-resource/545a5a2822437826c0e58a59/test/test2')
                    .set('X-API-Token', _token)
                    .then(function ( res ) {
                      // Status Code 401
                      expect(res).to.have.status(401);
                      // Relevant Error Message
                      expect(res.text).to.contain('permission').and.to.contain('test2');
                      done();
                    });
                });
            });
        });
    });
  });
});
