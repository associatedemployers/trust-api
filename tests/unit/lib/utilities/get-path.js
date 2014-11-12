var chai        = require('chai'),
    expect      = chai.expect,
    chalk       = require('chalk');

var getPath = require(process.cwd() + '/lib/utilities/get-path');

describe('getPath utility', function () {
  var testObject = {
    name: {
      first: 'Bat',
      last:  'Man'
    },
    email: 'batman@gmail.com',
    tags: [ 'dark', 'knight' ],
    notes: [
      {
        text: 'Dear Diary'
      },
      {
        text: 'Batman'
      }
    ]
  };

  var fn = getPath.bind( testObject );

  it('should return a function when required', function () {
    expect(getPath).to.be.a('function');
  });

  it('should get key/value pair', function () {
    expect(fn('email')).to.equal('batman@gmail.com');
  });

  it('should get deep key/value pair', function () {
    expect(fn('name.first')).to.equal('Bat');
  });

  it('should extract single-level arrays', function () {
    expect(fn('tags')).to.eql(['dark', 'knight']);
  });

  it('should extract deep arrays', function () {
    expect(fn('notes.$.text')).to.eql(['Dear Diary', 'Batman']);
  });
});
