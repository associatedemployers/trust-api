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

var app = require(cwd + '/app').init( require('express')() );

describe('Route :: Login', function () {
  describe('Error checking', function () {

    it('should check for email', function ( done ) {
      chai.request(app)
        .post('/api/user/login')
        .send({
          password: 'test'
        })
        .then(function ( res ) {
          // Status Code 400 ( Bad Request )
          expect(res).to.have.status(400);
          // Relevant error message
          expect(res.error.text).to.contain('email');
          done();
        }).catch(res => {
          expect(res).to.have.status(400);
          // Relevant error message
          expect(res.error.text).to.contain('email');
          done();
        });
    });

    it('should check for password', function ( done ) {
      chai.request(app)
        .post('/api/user/login')
        .send({
          email: 'test@test.com'
        })
        .then(function ( res ) {
          // Status Code 400 ( Bad Request )
          expect(res).to.have.status(400);
          // Relevant error message
          expect(res.error.text).to.contain('password');
          done();
        });
    });
  });

  describe('Scenarios', function () {
    /* Test support */
    before(function ( done ) {
      var User = require(cwd + '/models/user'),
          user = new User({ login: { email: 'mocha@test.js', password: 'latte' } });

      user.save(done);
    });

    after(function ( done ) {
      var mongoose = require('mongoose');
      mongoose.connection.db.dropDatabase(done);
    });
    /* ./ Test support */

    it('should handle email not found', function ( done ) {
      chai.request(app)
        .post('/api/user/login')
        .send({
          email: 'nouser@that.email',
          password: 'test'
        })
        .then(function ( res ) {
          // Status Code 401
          expect(res).to.have.status(401);
          // Relevant error message
          expect(res.text.toLowerCase()).to.contain('no user').and.to.contain('email');
          done();
        });
    });

    it('should handle invalid password', function ( done ) {
      chai.request(app)
        .post('/api/user/login')
        .send({
          email: 'mocha@test.js',
          password: 'test'
        })
        .then(function ( res ) {
          // Status Code 401
          expect(res).to.have.status(401);
          // Relevant error message
          expect(res.text.toLowerCase()).to.contain('password').and.to.contain('not match');
          done();
        });
    });

    it('should handle correct login', function ( done ) {
      chai.request(app)
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
          expect(res.body.expiration).to.exist;
          expect(moment(res.body.expiration).isValid()).to.equal(true);

          done();
        });
    });

    it('should give back same session if not expired', function ( done ) {
      chai.request(app)
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
          expect(res.body.token, 'First Response Token').to.exist.and.to.be.a('string');
          expect(res.body.expiration, 'First Response Expiration').to.exist;
          expect(res.body.user, 'First Response User').to.exist;
          expect(moment(res.body.expiration).isValid()).to.equal(true);

          chai.request(app)
            .post('/api/user/login')
            .send({
              email: 'mocha@test.js',
              password: 'latte'
            })
            .then(function ( secondRes ) {
              expect(secondRes.body.token, 'Second Response Token').to.equal(res.body.token);
              expect(secondRes.body.expiration, 'Second Response Expiration').to.not.equal(res.body.expiration); // Expiration refresh
              expect(secondRes.body.user, 'Second Response User').to.equal(res.body.user);
              done();
            });
        });
    });
  });
});
