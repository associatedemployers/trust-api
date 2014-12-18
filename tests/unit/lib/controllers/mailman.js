var cwd = process.cwd();

var chai        = require('chai'),
    chaiPromise = require('chai-as-promised'),
    expect      = chai.expect,
    _           = require('lodash'),
    async       = require('async'),
    chalk       = require('chalk');

chai.use( chaiPromise );

var Mailman = require(cwd + '/lib/controllers/mailman');

describe('Mailman', function () {
  it('should be a constructor', function () {
    expect(Mailman).to.be.a('function');
  });

  (process.env.allow_test_sendmail === "true" ? it : it.skip)('should send an email', function ( done ) {
    this.timeout(60000);

    var postalWorker = new Mailman(),
        promise = postalWorker.send('james@aehr.org', 'Hello from Mocha.js', 'test', {
          testvar: 'OK :)'
        });

    expect(promise).to.be.fulfilled.and.notify(done);
  });

  it('should be utilize and render .hbs partials', function ( done ) {
    var postalWorker = new Mailman(),
        promise = postalWorker.__render('test-partial', {});

    expect(promise).to.be.fulfilled.then(function ( rendered ) {
      expect(rendered.text).to.contain('Hello :)');
      done();
    });
  });
});
