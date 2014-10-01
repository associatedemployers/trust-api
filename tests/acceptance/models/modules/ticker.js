var cwd = process.cwd(),
    configDir    = cwd + '/config/',
    tickerDir    = cwd + '/lib/ticker/',
    mongoose     = require('mongoose'),
    createModel  = require(cwd + '/models/helpers/create-model'),
    dbConnection = require(configDir + 'mongoose').init('test', 'localhost');

var chai        = require('chai'),
    chaiPromise = require('chai-as-promised'),
    expect      = chai.expect,
    _           = require('lodash');

chai.use( chaiPromise );

var Ticker = require( tickerDir + 'core' );

describe('Ticker Module', function () {
  it('should return a Ticker instance', function () {
    var tickerInstance = require( tickerDir + 'ticker' );

    expect(tickerInstance).to.be.an.instanceof(Ticker);
  });
});

describe('Ticker Core', function () {
  var _ticker;

  before(function ( done ) {
    mongoose.disconnect(function () {
      done();
    });
  });

  describe('Constructor', function () {
    it('exists', function () {
      expect(Ticker.constructor, 'Ticker.constructor').to.be.a('function');
    });

    it('constructs a ticker object', function () {
      _ticker = new Ticker();

      expect(_ticker).not.to.be.null; // jshint ignore:line
      expect(_ticker, 'Ticker Instance').to.be.an.instanceof(Ticker);
    });
  });

  describe('Public Methods', function () {

    it('Ticker.tick', function () {
      expect(_ticker).to.respondTo('tick', 'Ticker.tick');
    });

    it('Ticker.rollback', function () {
      expect(_ticker).to.respondTo('rollback', 'Ticker.rollback');
    });

    it('Ticker.attach', function () {
      expect(_ticker).to.respondTo('attach', 'Ticker.attach');
    });

  });

  describe('Ticker.attach', function () {
    var _model = new mongoose.Schema({
          test: String
        });

    it('returns a schema', function () {
      var _schema = _ticker.attach( _model );

      expect(_schema, 'mongoose schema').to.be.an.instanceof(mongoose.Schema);
    });

    it('adds schema paths', function () {
      var _schema = _ticker.attach( _model );

      var testPath = _schema.path('test'),
          histPath = _schema.path('historyEvents');

      expect(testPath, 'model test path - test').to.be.an.instanceof(mongoose.Schema.Types.String);
      expect(histPath, 'model test path - hist').to.be.an.instanceof(mongoose.Schema.Types.Array);
    });
  });

  describe('Ticker.tick - acceptance race tests', function () {

    describe('Prelim Checking', function () {

      it('throws documentError given no document', function ( done ) {
        expect(_ticker.tick()).to.be.rejectedWith(Error, 'document', 'Relevant document error').and.notify(done);
      });

      it('throws typeError given non-mongo document', function ( done ) {
        var o = { test: 'test' };

        expect(_ticker.tick(o, o)).to.be.rejectedWith(Error, 'mongoose document', 'Relevant document error').and.notify(done);
      });

    });

    describe('Database Tests', function () {
      var _model;

      beforeEach(function ( done ) {
        _model = new mongoose.Schema({
          name: {
            first: String,
            last:  String
          },
          email:   String,
          tags:    Array
        });

        mongoose.connect('mongodb://localhost/test');

        done();
      });

      afterEach(function ( done ) {
        mongoose.connection.db.dropDatabase(function () {
          mongoose.disconnect(function () {
            done();
          });
        });
      });

      it('gives back the orig. doc given no updates', function ( done ) {
        // This works because the tick fn will always
        // attach the historyEvent to the document if
        // it passes prelim checks
        var testModel = createModel('TestUpdates', _model);

        var testRecord = new testModel({
          name: {
            first: 'noupdates'
          }
        });

        testRecord.save(function ( err, doc ) {
          if( err ) {
            throw err;
          }

          expect( _ticker.tick(doc, doc) ).to.become(doc).and.notify(done);
        });
      });

      describe('Automatic Registration', function () {

        it('automatically registers a new historyEvent ( 5s timeout )', function ( done ) {
          this.timeout(5000);

          var _schema   = _ticker.attach( _model ),
              testModel = createModel('Test', _schema);

          var testRecord = new testModel({
            name: {
              first: 'morgan',
              last:  'Freeman'
            },
            email: 'morgan@deepvoice.com',
            tags: [ 'awesome' ]
          });

          testRecord.save(function ( err, doc ) {
            if( err ) {
              throw err;
            }

            expect(doc, 'document').to.exist; // jshint ignore:line

            doc.name.first = 'Morgan';
            doc.email      = undefined;

            doc.tags.push('I can smell you');

            doc.save(function ( err, doc ) {
              if( err ) {
                throw err;
              }

              // Race to create historyEvent in a reasonable amount of time
              setTimeout(function () {
                testModel.findById(doc._id).populate('historyEvents').exec(function ( err, doc ) {
                  if( err ) {
                    throw err;
                  }

                  expect(doc, 'document').to.exist; // jshint ignore:line
                  expect(doc.historyEvents, 'doc[historyEvents]').to.be.an('array').and.to.have.length(1);

                  var mungedDoc = doc.toObject(),
                      historyEv = doc.historyEvents[0];

                  delete mungedDoc.historyEvents;
                  delete mungedDoc.__v;
                  delete doc.historyEvents[0].documents.updated.__v;

                  expect(historyEv, 'doc[historyEvents][0]').to.have.property('time_stamp');
                  expect(historyEv.documents.updated).to.deep.equal(mungedDoc);
                  expect(historyEv.deltaTypes).to.have.members(['Deleted', 'Changed']);

                  done();
                });
              }, 2000);
            });
          });
        });

      });
    });

  });

});
