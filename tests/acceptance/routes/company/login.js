/* jshint expr:true */
var cwd = process.cwd();

var chai    = require('chai'),
    expect  = chai.expect,
    moment  = require('moment'),
    _       = require('lodash'),
    chalk   = require('chalk'),
    winston = require('winston'),
    moment  = require('moment'),
    Promise = require('bluebird'); // jshint ignore:line

var plugins = [
  require('chai-as-promised'),
  require('chai-http')
];

plugins.map(function ( plugin ) {
  chai.use( plugin );
});

chai.request.addPromises(Promise);

var app          = require(cwd + '/app').init( require('express')() ),
    session      = require(cwd + '/lib/security/session'),
    mongoose     = require('mongoose'),
    Company      = require(cwd + '/models/company'),
    tokenModule  = require(cwd + '/lib/security/token');

describe('Company Route :: Login', function () {
  var _company;
  var _testData = {
    companyId: 'MOCHA',
    email:     'test@mocha.js',
    password:  'mytest'
  };

  /* Test support */
  before(function ( done ) {
    var company = new Company({
      name: {
        company: 'Dummy Company'
      },
      login: _testData
    });

    company.save(function ( err, companyDocument ) {
      if ( err ) throw err;

      _company = companyDocument;

      done();
    });
  });

  after(function ( done ) {
    var mongoose = require('mongoose');
    mongoose.connection.db.dropDatabase(done);
  });
  /* ./ Test support */

  it('should reject empty/invalid requests', function ( done ) {
    var _expect400 = function (res) {
      expect(res).to.have.status(400);
      expect(res.error.text.toLowerCase()).to.contain('provide');
    };

    chai.request(app)
      .post('/client-api/company/login')
      .then(_expect400)
      .then(function () {
        return chai.request(app).post('/client-api/company/login').send({ companyId: 'test' });
      })
      .then(_expect400)
      .then(function () {
        return chai.request(app).post('/client-api/company/login').send({ email: 'test@test.com' });
      })
      .then(_expect400)
      .then(done);
  });

  it('should reject requests with no companyId or email found', function ( done ) {
    var _expect404 = function ( res ) {
      expect(res).to.have.status(404);
      expect(res.error.text.toLowerCase()).to.contain('not found');
    };

    chai.request(app)
      .post('/client-api/company/login')
      .send({
        companyId: 'shipit',
        password:  'notarealcompany'
      })
      .then(_expect404)
      .then(function ( res ) {
        return chai.request(app).post('/client-api/company/login').send({
          email: 'ship@it.com',
          password:  'notarealcompany'
        });
      })
      .then(_expect404)
      .then(done);
  });

  it('should reject requests with invalid password', function ( done ) {
    var _expect401 = function ( res ) {
      expect(res).to.have.status(401);
      expect(res.error.text.toLowerCase()).to.contain('password');
    };

    chai.request(app)
      .post('/client-api/company/login')
      .send({
        companyId: _testData.companyId,
        password:  _testData.password + 'wrong'
      })
      .then(_expect401)
      .then(done);
  });

  it('should return an authorization and record login', function ( done ) {
    var _expectNormal = function ( res ) {
      var body = res.body;

      expect(res).to.have.status(200);
      expect(body.token).to.exist;
      expect(body.user).to.equal(_company._id.toString());
      expect(body.type).to.equal('company');
      expect(moment(body.expiration).isValid()).to.be.ok;
    };

    chai.request(app)
      .post('/client-api/company/login')
      .send({
        companyId: _testData.companyId,
        password:  _testData.password
      })
      .then(_expectNormal)
      .then(function () {
        return chai.request(app).post('/client-api/company/login').send({
          email:    _testData.email,
          password: _testData.password
        });
      })
      .then(_expectNormal)
      .then(function ( res ) {
        Company.findById(_company._id, function ( err, company ) {
          if ( err ) throw err;

          expect(company.logins.length).to.equal(2);
          expect(company.logins[0].ip).to.contain('127.0.0.1');
          expect(company.logins[0].time_stamp).to.exist;

          done();
        });
      });
  });
});
