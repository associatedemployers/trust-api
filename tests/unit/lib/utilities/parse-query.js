var chai        = require('chai'),
    expect      = chai.expect,
    chalk       = require('chalk');

var parseQuery = require(process.cwd() + '/lib/utilities/parse-query');

describe('parseQuery utility', function () {
  var testQuery = {
    my: 'data',
    test: [ 1, '2', '3' ],
    data: {
      a: {
        b: {
          c: [
            {
              test: 'false',
              test2: 'true'
            },
            {
              test: {
                data: 'test'
              }
            }
          ]
        }
      }
    }
  };

  it('should be a function', function () {
    expect(parseQuery).to.be.a('function');
  });

  it('should work', function () {
    var mapped = parseQuery(testQuery);

    expect(mapped.my).to.equal('data');
    expect(mapped.test).to.be.an('array');
    expect(mapped.test[1]).to.equal(2);
    expect(mapped.data.a.b.c).to.be.an('array').and.to.deep.equal([
      {
        test: false,
        test2: true
      },
      {
        test: {
          data: 'test'
        }
      }
    ]);
  });
});
