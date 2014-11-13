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

var authorizationMiddleware = require(cwd + '/lib/security/middleware/authorization'),
    sessionMiddleware       = require(cwd + '/lib/security/middleware/session'),
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
      var User = require(cwd + '/models/user'),
          user = new User({
            type: 'admin',
            login: {
              email: 'mocha@test.js',
              password: 'latte'
            },
            permissions: [
              {
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
              }
            ]
          });

      user.save(done);
    });

    after(function ( done ) {
      var mongoose = require('mongoose');
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
        expect(req.permission).to.be.an('object').and.to.include.keys('group', 'set');
        expect(req.permission.group, 'Permission Group').to.be.an('object');
        expect(req.permission.set, 'Permission Set').to.be.an('object');
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
  });
});