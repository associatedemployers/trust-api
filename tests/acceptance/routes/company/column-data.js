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

function _indexByExt ( array, ext, filename ) {
  return _.findIndex(array, function ( path ) {
    return path.split('.').pop() === ext && (!filename || path.split('/').pop() === filename);
  });
}

describe('Employee Route :: Employee Column Data Import', function () {
  var _company, _auth;

  var globSync       = require('glob').sync,
      fs             = require('fs-extra'),
      _testFilePaths = globSync(cwd + '/tests/support/column-data-test-files/*.*'),
      _testFiles     = _testFilePaths.map(function ( path ) {
        return fs.readFileSync( path );
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
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  describe('Processing', function () {
    it('should process csv files', function ( done ) {
      var fileIndex = _indexByExt(_testFilePaths, 'csv', 'test.csv');

      chai.request(app)
        .post('/client-api/company-utilities/column-data')
        .set('X-API-Token', _auth.publicKey)
        .attach(_testFiles[fileIndex], _testFilePaths[fileIndex])
        .then(function ( res ) {
          expect(res).to.have.status(200);
          var csvCompare = [
            [ 'Mocha', 'T', 'Test', 'Jr', '123456789', 'mocha@test.js', '' ],
            [ 'Mochas', 'A', 'Btest', 'Sr', '123456781', 'mocha@test2.js', '' ],
            [ 'Mocha', '', 'Ctest', '', '123456782', 'mocha@test3.js', '' ]
          ];
          expect(res.body).to.be.an('array').and.have.length(4);
          expect(res.body.slice(1, 4)).to.deep.equal(csvCompare);
          done();
        });
    });

    it.skip('should process xls files', function ( done ) {
      var fileIndex = _indexByExt(_testFilePaths, 'xls');

      chai.request(app)
        .post('/client-api/company-utilities/column-data')
        .set('X-API-Token', _auth.publicKey)
        .attach(_testFiles[fileIndex], _testFilePaths[fileIndex])
        .then(function ( res ) {
          expect(res).to.have.status(200);
        });
    });

    it.skip('should process xlsx files', function ( done ) {
      var fileIndex = _indexByExt(_testFilePaths, 'xlsx');

      chai.request(app)
        .post('/client-api/company-utilities/column-data')
        .set('X-API-Token', _auth.publicKey)
        .attach(_testFiles[fileIndex], _testFilePaths[fileIndex])
        .then(function ( res ) {
          expect(res).to.have.status(200);
        });
    });

    it('should parse dates', function ( done ) {
      var fileIndex = _indexByExt(_testFilePaths, 'csv', 'date-test.csv');

      chai.request(app)
        .post('/client-api/company-utilities/column-data')
        .set('X-API-Token', _auth.publicKey)
        .attach(_testFiles[fileIndex], _testFilePaths[fileIndex])
        .then(function ( res ) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          res.body.slice(1, res.body.length).forEach(function ( row ) {
            expect(moment(row[0]).format('MM/DD/YYYY')).to.equal('01/20/2015');
          });
          done();
        });
    });

    it('should parse column headers', function ( done ) {
      var fileIndex = _indexByExt(_testFilePaths, 'csv', 'test.csv');

      chai.request(app)
        .post('/client-api/company-utilities/column-data')
        .set('X-API-Token', _auth.publicKey)
        .attach(_testFiles[fileIndex], _testFilePaths[fileIndex])
        .then(function ( res ) {
          expect(res).to.have.status(200);
          var csvCompare = [
            [
              {
                mapsTo: 'name.first',
                matchedWith: 'firstname',
                originalHeader: 'First Name'
              },
              {
                mapsTo: 'name.middleInitial',
                matchedWith: 'middleinitial',
                originalHeader: 'Middle Initial'
              },
              {
                mapsTo: 'name.last',
                matchedWith: 'lastname',
                originalHeader: 'Last Name'
              },
              {
                mapsTo: 'name.suffix',
                matchedWith: 'suffix',
                originalHeader: 'Suffix'
              },
              {
                mapsTo: 'ssn',
                matchedWith: 'ssn',
                originalHeader: 'SSN',
                missingFields: false
              },
              {
                mapsTo: 'email',
                matchedWith: 'emailaddress',
                originalHeader: 'Email Address'
              },
              {
                mapsTo: 'legacyClientEmploymentDate',
                matchedWith: 'hiredate',
                originalHeader: 'Hire Date',
                missingFields: true
              }
            ],
            [ 'Mocha', 'T', 'Test', 'Jr', '123456789', 'mocha@test.js', '' ],
            [ 'Mochas', 'A', 'Btest', 'Sr', '123456781', 'mocha@test2.js', '' ],
            [ 'Mocha', '', 'Ctest', '', '123456782', 'mocha@test3.js', '' ]
          ];

          expect(res.body).to.deep.equal(csvCompare);
          done();
        });
    });
  });
});
