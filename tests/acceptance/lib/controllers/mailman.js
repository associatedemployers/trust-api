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

  it('should send an email', function ( done ) {
    this.timeout(60000);

    var postalWorker = new Mailman(),
        promise = postalWorker.send('james@aehr.org', 'Hello from Mocha.js', 'test', {
          testvar: 'OK :)'
        });

    expect( promise ).to.be.fulfilled.and.notify(done);
  });
});
