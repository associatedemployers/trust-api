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
    Employee     = require(cwd + '/models/employee'),
    Company      = require(cwd + '/models/company'),
    Verification = require(cwd + '/models/verification'),
    tokenModule  = require(cwd + '/lib/security/token');

var dataSignature = ( process.env.environment === 'test' ) ? '12345678123456789' : require(cwd + '/config/keys').dataSignature,
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
          memberId: 943000000,
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
    var _verification;

    beforeEach(function ( done ) {
      var verification = new Verification(tokenModule.createKeypair({
        ssn: 222111224
      }));

      verification.save(function ( err, v ) {
        if ( err ) throw err;

        _verification = v;
        done();
      });
    });

    it('should reject empty requests', function ( done ) {
      chai.request(app)
        .post('/api/employee/login/verify')
        .then(function ( res ) {
          expect(res).to.have.status(400);
          expect(res.error.text.toLowerCase()).to.contain('provide');

          done();
        });
    });

    it('should 404 verifications not found', function ( done ) {
      chai.request(app)
        .post('/api/employee/login/verify')
        .send({
          token:    "ABCDEFG123456789",
          memberId: 943123123
        })
        .then(function ( res ) {
          expect(res).to.have.status(404);
          expect(res.error.text.toLowerCase()).to.contain('not found');

          done();
        });
    });

    it('should 404 expired verifications', function ( done ) {
      _verification.expiration = Date.now();

      _verification.save(function ( err, __verification ) {
        if ( err ) throw err;

        chai.request(app)
          .post('/api/employee/login/verify')
          .send({
            token:    __verification.publicKey,
            memberId: 943123123
          })
          .then(function ( res ) {
            expect(res).to.have.status(404);
            expect(res.error.text.toLowerCase()).to.contain('expired');

            done();
          });
      });
    });

    it('should reject verification requests with no memberId found', function ( done ) {
      chai.request(app)
        .post('/api/employee/login/verify')
        .send({
          token:    _verification.publicKey,
          memberId: 943111111
        })
        .then(function ( res ) {
          expect(res).to.have.status(404);
          expect(res.error.text.toLowerCase()).to.contain('memberid');

          done();
        });
    });

    it('should reject verification requests with wrong ssn', function ( done ) {
      chai.request(app)
        .post('/api/employee/login/verify')
        .send({
          token:    _verification.publicKey,
          memberId: 943000000
        })
        .then(function ( res ) {
          expect(res).to.have.status(401);
          expect(res.error.text.toLowerCase()).to.contain('incorrect ssn');

          done();
        });
    });

    it('should return an authorization and record a log in when memberId & ssn matches', function ( done ) {
      var verification = new Verification(tokenModule.createKeypair({
        ssn: 222111223
      }));

      verification.save(function ( err, v ) {
        if ( err ) throw err;

        chai.request(app)
          .post('/api/employee/login/verify')
          .send({
            token:    v.publicKey,
            memberId: 943000000
          })
          .then(function ( res ) {
            var body = res.body;

            expect(res).to.have.status(200);
            expect(body.token).to.exist;
            expect(body.user).to.equal(_testEmployees[1]._id.toString());
            expect(moment(body.expiration).isValid()).to.be.ok;

            Employee.findById(_testEmployees[1]._id, function ( err, employee ) {
              if ( err ) throw err;

              expect(employee.logins.length).to.equal(1);
              expect(employee.logins[0].ip).to.contain('127.0.0.1');
              expect(employee.logins[0].time_stamp).to.exist;

              done();
            });
          });
      });
    });

  });
});
