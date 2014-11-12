var cwd = process.cwd(),
    configDir    = cwd + '/config/',
    mongoose     = require('mongoose'),
    createModel  = require(cwd + '/models/helpers/create-model');

var chai        = require('chai'),
    chaiPromise = require('chai-as-promised'),
    expect      = chai.expect,
    _           = require('lodash'),
    chalk       = require('chalk');

chai.use( chaiPromise );

var searchable = require(cwd + '/models/plugins/searchable');

describe('SchemaPlugin :: Searchable', function () {
  var _model;

  beforeEach(function ( done ) {
    _model = new mongoose.Schema({
      name: {
        first: String,
        last:  String
      },
      email:   String,
      tags:    Array,
      notes: [{
        text: String
      }]
    });

    mongoose.connect('localhost/trusttest');

    done();
  });

  afterEach(function ( done ) {
    mongoose.connection.db.dropDatabase(function () {
      mongoose.disconnect(function () {
        done();
      });
    });
  });

  it('should create a "stringified" value ( 5s timeout )', function ( done ) {
    this.timeout(5000);

    var _schema = _model.plugin(searchable, {
      paths: [
        'name.first',
        'name.last',
        'tags',
        'notes.$.text'
      ]
    });

    var testModel = createModel('SearchableTest', _schema);

    var testRecord = new testModel({
      name: {
        first: 'morgan',
        last:  'Freeman'
      },
      email: 'morgan@deepvoice.com',
      tags: [ 'awesome' ],
      notes: [{
        text: 'I am nested.'
      }]
    });

    testRecord.save(function ( err, doc ) {
      if( err ) {
        throw err;
      }

      expect(doc, 'document').to.exist; // jshint ignore:line

      expect(doc.stringified)
        .to.contain('morgan')
        .and.to.contain('Freeman')
        .and.to.contain('awesome')
        .and.to.contain('I am nested.')
        .and.to.not.contain('morgan@deepvoice.com');

      doc.tags.push('I can smell you');
      doc.notes.push({
        text: 'Really'
      });

      doc.save(function ( err, doc ) {
        if( err ) {
          throw err;
        }

        expect(doc.stringified)
          .to.contain('morgan')
          .and.to.contain('Freeman')
          .and.to.contain('Really')
          .and.to.contain('I can smell you');

        done();
      });
    });
  });
});
