var chai   = require('chai'),
    expect = chai.expect;

var tickerDir = process.cwd() + '/lib/ticker/',
    Ticker    = require( tickerDir + 'core' );

describe('Ticker Module', function () {
  it('should return a Ticker instance', function () {
    var tickerInstance = require( tickerDir + 'ticker' );

    expect(tickerInstance).to.be.an.instanceof(Ticker);
  });
});

describe('Ticker Core', function () {
  var _ticker;

  describe('constructor', function () {
    it('exists', function () {
      expect(Ticker.constructor, 'Ticker.constructor').to.be.a('function');
    });

    it('constructs a ticker object', function () {
      _ticker = new Ticker();

      expect(_ticker).not.to.be.null; // jshint ignore:line
      expect(_ticker, 'Ticker Instance').to.be.an.instanceof(Ticker);
    });
  });

  describe('Public Methods Existence', function () {

    it('has tick method', function () {
      expect(_ticker.tick, 'Ticker.tick').to.be.a('function');
    });

    it('has rollback method', function () {
      expect(_ticker.rollback, 'Ticker.rollback').to.be.a('function');
    });

    it('has attach method', function () {
      expect(_ticker.attach, 'Ticker.attach').to.be.a('function');
    });

  });

});
