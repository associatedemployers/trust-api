var chai        = require('chai'),
    expect      = chai.expect,
    chalk       = require('chalk');

var token  = require(process.cwd() + '/lib/security/token'),
    jwt    = require('jwt-simple'),
    moment = require('moment');

describe('Token Module', function () {

  it('should create a public/private key pair', function () {
    var testObj = {
      test: 'data',
      test2: 'data2'
    };

    var keypair = token.createKeypair( testObj );

    // jshint ignore:start
    expect(keypair.privateKey).to.exist;
    expect(keypair.publicKey).to.exist;
    // jshint ignore:end

    var decoded = jwt.decode(keypair.publicKey, keypair.privateKey);

    expect(decoded.test).to.equal(testObj.test);
    expect(decoded.test2).to.equal(testObj.test2);
  });

  it('should generate expirations', function () {
    var expr = 1,
        unit = 'hour';

    var generator = token.expirationGenerator( expr, unit );

    expect(generator).to.be.a('function');

    var result = generator();

    expect(result).to.be.a('date');
    expect( Math.abs(moment().diff(moment(result), unit)) ).to.equal(expr);
  });

});
