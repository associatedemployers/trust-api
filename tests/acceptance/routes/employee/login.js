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

var app      = require(cwd + '/app').init( require('express')() ),
    session  = require(cwd + '/lib/security/session'),
    mongoose = require('mongoose'),
    Employee = require(cwd + '/models/employee'),
    Company  = require(cwd + '/models/company');

var dataSignature = require(process.cwd() + '/config/keys').dataSignature,
    encryptor     = require('simple-encryptor')(dataSignature);

describe('Employee Route :: Login', function () {

  var _testEmployees, _company;

  /* Test support */
  before(function ( done ) {
    var company = new Company({
      name: {
        company: 'Dummy Company'
      },
      employees: [ null, null, null ]
    });

    company.employees = company.employees.map(mongoose.Types.ObjectId);

    company.save(function ( err, companyDocument ) {
      if ( err ) throw err;

      _company = companyDocument;

      var employees = [
        {
          _id:      company.employees[ 0 ],
          company:  company._id,
          ssn:      encryptor.encrypt(222111222),
          enrolled: true,
          name: {
            first: 'Test',
            last:  'Person'
          },
          logins: [
            {
              ip: '127.0.0.1',
              time_stamp: Date.now()
            }
          ]
        },
        {
          _id:      company.employees[ 1 ],
          company:  company._id,
          ssn:      encryptor.encrypt(222111223),
          enrolled: true,
          name: {
            first: 'Foo',
            last:  'Bar'
          }
        },
        {
          _id:      company.employees[ 2 ],
          company:  company._id,
          ssnDc:    222111224,
          enrolled: false,
          name: {
            first: 'Foo',
            last:  'Bar'
          }
        }
      ];

      Employee.create(employees, function ( err ) {
        if ( err ) throw err;

        _testEmployees = Array.prototype.slice.call( arguments, 1 );

        done();
      });
    });
  });

  after(function ( done ) {
    var mongoose = require('mongoose');
    mongoose.connection.db.dropDatabase(done);
  });
  /* ./ Test support */

  describe('Log in (Stage 1)', function () {

    it('should reject empty requests', function ( done ) {
      chai.request(app)
        .post('/api/employee/login')
        .then(function ( res ) {
          expect(res).to.have.status(400);
          expect(res.error.text.toLowerCase()).to.contain('provide');

          done();
        });
    });

    it('should send back verification token for ssn not found', function ( done ) {
      chai.request(app)
        .post('/api/employee/login')
        .send({
          ssn: 123456789
        })
        .then(function ( res ) {
          var body = res.body;

          expect(res).to.have.status(200);
          expect(body.verificationRequired).to.equal(true);
          expect(body.token).to.exist;
          expect(body.user).to.not.exist;
          expect(moment(body.expiration).isValid()).to.be.ok;

          done();
        });
    });

    it('should send back an authorization for ssn found', function ( done ) {
      chai.request(app)
        .post('/api/employee/login')
        .send({
          ssn: 222111224
        })
        .then(function ( res ) {
          var body = res.body;

          expect(res).to.have.status(200);
          expect(body.verificationRequired).to.equal(false);
          expect(body.token).to.exist;
          expect(body.user).to.equal(_testEmployees[ 2 ]._id.toString());
          expect(moment(body.expiration).isValid()).to.be.ok;

          done();
        });
    });

    it('should send back an authorization for previous log in', function ( done ) {
      chai.request(app)
        .post('/api/employee/login')
        .send({
          ssn: 222111222
        })
        .then(function ( res ) {
          var body = res.body;

          expect(res).to.have.status(200);
          expect(body.verificationRequired).to.equal(false);
          expect(body.token).to.exist;
          expect(body.user).to.equal(_testEmployees[0]._id.toString());
          expect(moment(body.expiration).isValid()).to.be.ok;

          done();
        });
    });

  });

  describe('Verification (Stage 2)', function () {
    // TODO: Verification Tests
  });
});
