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

var sessionMiddleware = require(cwd + '/lib/security/middleware/session'),
    express           = require('express'),
    app               = require(cwd + '/app');

describe('Route Middleware :: Session', function () {
  it('should generate a function', function () {
    expect(sessionMiddleware).to.be.a('function');
    expect(sessionMiddleware()).to.be.a('function');
  });

  describe('Operations', function () {
    var _router, _app, _token;

    /* Test support */
    before(function ( done ) {
      var User = require(cwd + '/models/user'),
          user = new User({ login: { email: 'mocha@test.js', password: 'latte' } });

      user.save(done);
    });

    after(function ( done ) {
      var mongoose = require('mongoose');
      mongoose.connection.db.dropDatabase(function () {
        done();
      });
    });

    beforeEach(function () {
      _router = express.Router();
      _app    = app.init( express() );
    });
    /* ./ Test support */

    it('should reject with no token in the header', function ( done ) {
      _router.use( sessionMiddleware() );
      _router.get('/protected-resource', function () {});

      _app.use('/api', _router);

      chai.request(_app)
        .get('/api/protected-resource')
        .then(function ( res ) {
          // Status Code 401
          expect(res).to.have.status(401);
          // Relevant Error Message
          expect(res.text).to.contain('token').and.to.contain('header');
          done();
        });
    });

    it('should reject with invalid/non-existant token', function ( done ) {
      _router.use( sessionMiddleware() );
      _router.get('/protected-resource', function () {});

      _app.use('/api', _router);

      chai.request(_app)
        .get('/api/protected-resource')
        .set('X-API-Token', 'testinginvalid')
        .then(function ( res ) {
          // Status Code 401
          expect(res).to.have.status(401);
          // Relevant Error Message
          expect(res.text).to.contain('token').and.to.contain('expired');
          done();
        });
    });

    it('should call next with session attached given proper session token', function ( done ) {
      _router.use( sessionMiddleware() );
      _router.get('/protected-resource', function ( req ) {
        expect(req.session).to.be.an('object');
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

    it('should handle expired tokens', function ( done ) {
      var Session = require(cwd + '/lib/security/session');

      Session.get( _token ).then(function ( _session ) {
        expect(_session).to.be.an('object');
        expect(_session.user).to.be.an('object');

        _session.expiration = new Date();

        _session.save(function ( err, updated ) {
          expect(err).to.not.exist;
          expect(updated).to.exist;

          _router.use( sessionMiddleware() );
          _router.get('/protected-resource', function () {});

          _app.use('/api', _router);

          chai.request(_app)
            .get('/api/protected-resource')
            .set('X-API-Token', _token)
            .then(function ( res ) {
              // Status Code 401
              expect(res).to.have.status(401);
              // Relevant Error Message
              expect(res.text).to.contain('expired').and.to.contain('session');
              done();
            });
        });

      });
    });
  });
});
