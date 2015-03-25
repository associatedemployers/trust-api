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
    mongoose     = require('mongoose'),
    Company      = require(cwd + '/models/company'),
    session      = require(cwd + '/lib/security/session');

function _indexByExt ( array, ext ) {
  return _.findIndex(array, function ( path ) {
    return path.split('.').pop() === ext;
  });
}

describe('Employee Route :: Employee Column Data Import', function () {
  var _company, _auth;

  var globSync       = require('glob').sync,
      fs             = require('fs-extra'),
      _testFilePaths = globSync(cwd + '/tests/support/column-data-test-files/*.*'),
      _testFiles     = _testFilePaths.map(function ( path ) {
        return fs.readFileSync( path, { encoding: 'utf8' } );
      });

  /* Test support */
  before(function ( done ) {
    var company = new Company({
      name: {
        company: 'Dummy Company'
      }
    });

    company.save(function ( err, companyDocument ) {
      if ( err ) throw err;

      _company = companyDocument;

      var sessionData = {
        userId: _company._id.toString(),
      };

      session.create(_company._id, sessionData, 'Session', 'company', 'Company').then(function ( a ) {
        _auth = a;
        done();
      });
    });
  });

  after(function ( done ) {
    fs.remove(cwd + require(cwd + '/config/app-config').test.temporaryFileDirectory + '/', done);
  });
  /* ./ Test support */

  describe('Invalid Requests', function () {
    it('should reject empty requests', function ( done ) {
      chai.request(app)
        .post('/client-api/company-utilities/column-data')
        .set('X-API-Token', _auth.publicKey)
        .then(function ( res ) {
          console.log(res.error.text);
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  describe('Processing', function () {
    it('should process csv files', function ( done ) {
      var fileIndex = _indexByExt(_testFilePaths, 'csv');

      chai.request(app)
        .post('/client-api/company-utilities/column-data')
        .set('X-API-Token', _auth.publicKey)
        .attach(_testFiles[fileIndex], _testFilePaths[fileIndex])
        .then(function ( res ) {
          expect(res).to.have.status(200);
        });
    });

    it('should process xls files', function ( done ) {
      var fileIndex = _indexByExt(_testFilePaths, 'xls');
      console.log(_testFilePaths[fileIndex]);
      chai.request(app)
        .post('/client-api/company-utilities/column-data')
        .set('X-API-Token', _auth.publicKey)
        .attach(_testFiles[fileIndex], _testFilePaths[fileIndex])
        .then(function ( res ) {
          expect(res).to.have.status(200);
        });
    });

    it('should process xlsx files', function ( done ) {
      var fileIndex = _indexByExt(_testFilePaths, 'xlsx');

      chai.request(app)
        .post('/client-api/company-utilities/column-data')
        .set('X-API-Token', _auth.publicKey)
        .attach(_testFiles[fileIndex], _testFilePaths[fileIndex])
        .then(function ( res ) {
          expect(res).to.have.status(200);
        });
    });

    it.skip('should parse custom column headers reasonably well', function ( done ) {
      chai.request(app)
        .post('/client-api/files/')
        .set('X-API-Token', _auth.publicKey)
        .attach(_testFiles[0], _testFilePaths[0])
        .attach(_testFiles[1], _testFilePaths[1])
        .then(function ( res ) {
          expect(res).to.have.status(201);

        });
    });
  });
});
