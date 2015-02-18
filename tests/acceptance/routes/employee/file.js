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
    File         = require(cwd + '/models/file'),
    Company      = require(cwd + '/models/company'),
    session      = require(cwd + '/lib/security/session');

var dataSignature = '12345678123456789',
    encryptor     = require('simple-encryptor')(dataSignature);

describe('Employee Route :: Files', function () {

  var _testEmployee, _company, _auth;

  /* Test support */
  before(function ( done ) {
    var company = new Company({
      name: {
        company: 'Dummy Company'
      },
      employees: [ mongoose.Types.ObjectId() ]
    });

    company.save(function ( err, companyDocument ) {
      if ( err ) throw err;

      _company = companyDocument;

      var employees = [
        {
          _id:      company.employees[ 0 ],
          company:  company._id,
          ssn:      encryptor.encrypt(222111222),
          memberId: 943121234,
          enrolled: true,
          name: {
            first: 'Mr.',
            last:  'T'
          }
        }
      ];

      Employee.create(employees, function ( err, e ) {
        if ( err ) throw err;

        var sessionData = {
          userId:   e._id.toString(),
          memberId: e.memberId
        };

        _testEmployee = e;

        session.create(e._id, sessionData, 'Session', 'employee', 'Employee').then(function ( a ) {
          _auth = a;
          done();
        });
      });
    });
  });

  after(function ( done ) {
    var mongoose = require('mongoose');
    mongoose.connection.db.dropDatabase(done);
  });
  /* ./ Test support */

  var globSync       = require('glob').sync,
      fs             = require('fs-extra'),
      _fileLocation  = cwd + '/files/employee/',
      _testFilePaths = globSync(cwd + '/tests/support/test-files/*.*'),
      _testFiles     = _testFilePaths.map(function ( path ) {
        return fs.readFileSync( path );
      });

  describe('GET', function () {

    it('should reject requests unauthorized file id', function ( done ) {
      chai.request(app)
        .get('/client-api/files/' + mongoose.Types.ObjectId())
        .set('X-API-Token', _auth.publicKey)
        .then(function ( res ) {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe('POST', function () {

    it('should reject empty requests', function ( done ) {
      chai.request(app)
        .post('/client-api/files/')
        .set('X-API-Token', _auth.publicKey)
        .then(function ( res ) {
          expect(res).to.have.status(400);
          done();
        });
    });

    describe('db functionality', function () {

      it('should create file document in db', function ( done ) {
        chai.request(app)
          .post('/client-api/files/')
          .set('X-API-Token', _auth.publicKey)
          .attach(_testFiles[ 0 ], _testFilePaths[0])
          .then(function ( res ) {
            console.log(res.error.text);
            expect(res).to.have.status(201);
            expect(res.body.file).to.be.an('object');

            File.findById(res.body.file._id, function ( err, file ) {
              if ( err ) throw err;

              expect(file).to.exist;
              done();
            });
          });
      });

      it('should assign file to employee', function ( done ) {
        chai.request(app)
          .post('/client-api/files/')
          .set('X-API-Token', _auth.publicKey)
          .attach(_testFiles[ 0 ], _testFilePaths[0])
          .then(function ( res ) {
            console.log(res.error.text);
            expect(res).to.have.status(201);

            File.findById(res.body.file._id, function ( err, file ) {
              if ( err ) throw err;

              expect(file).to.exist;
              expect(file.employee).to.equal(_testEmployee._id);

              Employee.findById(_testEmployee._id, function ( err, employee ) {
                if ( err ) throw err;

                expect(employee.files).to.contain(file._id);

                done();
              });
            });
          });
      });

      it('should create file documents in db', function ( done ) {
        chai.request(app)
          .post('/client-api/files/')
          .set('X-API-Token', _auth.publicKey)
          .attach(_testFiles[ 0 ], _testFilePaths[0])
          .attach(_testFiles[ 1 ], _testFilePaths[1])
          .then(function ( res ) {
            console.log(res.error.text);
            expect(res).to.have.status(201);
            expect(res.body.file).to.be.an('array');

            File.find({ _id: { $in: [ res.body.file[0]._id, res.body.file[1]._id ] } }, function ( err, files ) {
              if ( err ) throw err;

              expect(files).to.have.length(2);
              done();
            });
          });
      });

      it('should assign files to employee', function ( done ) {
        chai.request(app)
          .post('/client-api/files/')
          .set('X-API-Token', _auth.publicKey)
          .attach(_testFiles[ 0 ], _testFilePaths[0])
          .attach(_testFiles[ 1 ], _testFilePaths[1])
          .then(function ( res ) {
            console.log(res.error.text);
            expect(res).to.have.status(201);

            File.find({ _id: { $in: [ res.body.file[0]._id, res.body.file[1]._id ] } }, function ( err, files ) {
              if ( err ) throw err;

              expect(files).to.have.length(2);
              expect(files[0].employee).to.equal(_testEmployee._id);
              expect(files[1].employee).to.equal(_testEmployee._id);

              Employee.findById(_testEmployee._id, function ( err, employee ) {
                if ( err ) throw err;

                expect(employee.files).to.contain(files[0]._id).and.to.contain(files[1]._id);
                done();
              });
            });
          });
      });
    });

    describe('fs functionality', function () {

      it('should create a single file', function ( done ) {
        chai.request(app)
          .post('/client-api/files/')
          .set('X-API-Token', _auth.publicKey)
          .attach(_testFiles[ 0 ], _testFilePaths[0])
          .then(function ( res ) {
            console.log(res.error.text);
            expect(res).to.have.status(201);

            File.findById(res.body.file._id, function ( err, file ) {
              if ( err ) throw err;

              var __location = _fileLocation + _testEmployee._id.toString + '-' + file._id.toString + '.' + file.extension;

              expect(file).to.exist;
              expect(fs.readFileSync(__location)).to.equal(_testFiles[0]);

              done();
            });
          });
      });

      it.skip('should create multiple files', function ( done ) {

      });

      it.skip('should work with all sorts of MIME Types', function ( done ) {

      });
    });
  });
});
