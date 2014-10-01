var chai   = require('chai'),
    expect = chai.expect;

var configDir = process.cwd() + '/config/';

describe('Mongoose', function () {

  describe('Connection Wrapper', function () {
    var _wrapper  = require( configDir + 'mongoose' );
    var _mongoose = require('mongoose');

    it('has an init method', function () {
      expect(_wrapper.init, 'connection wrapper init method').to.be.a('function');
    });

    it('returns a connection', function () {
      var connection = _wrapper.init();

      expect(connection, 'mongoose connection').to.be.an('object');
    });

  });

});
