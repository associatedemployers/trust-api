/*
  Data Map Request
  ---
  Experimental Route Handler, do not use a url to init a db injection
*/

var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    slog      = require('single-line-log').stdout,
    _         = require('lodash'),
    fs        = require('fs-extra'),
    Promise   = require('bluebird'), // jshint ignore:line
    indexOfId = require(process.cwd() + '/lib/utilities/find-by-objectid'),
    glob      = require('glob');

var fileManifest = require('../config/xml-file-manifest'),
    Mapper       = require('../lib/data-mapping/core/mapper'),
    fileImport   = require('../lib/data-mapping/core/file-import');

var fileTypes = fileManifest.map(function ( o ) {
  return o.type.toLowerCase();
});

exports.xmlToHtml = function ( req, res, next ) {
  var dataMapper = new Mapper({
    freshness: '1 day'
  }).setupFiles( fileManifest );

  var id = req.params.id,
      limit = req.params.limit || null;

  dataMapper.connect(function () {
    dataMapper.run(function ( fileObjects ) {
      winston.log('info', chalk.green('Drained dataMapper run queue'));

      var fileObject = fileObjectGetter( id, fileObjects );

      if( !fileObject ) {
        return res.send(id + ' is not manifested in xml. Here is a list of manifested xml objects:<br /><br />' + fileTypes.join('<br />'));
      }

      winston.log('info', chalk.dim('Rendering HTML for', fileObject.type));

      res.send( 200, fileObject.renderHtml( limit ) );

      dataMapper.disconnect();
    });
  });
};

exports.injectXml = function ( req, res, next ) {
  var dataMapper = new Mapper({
    freshness: '1 day',
    injectAndNormalize: true
  }).setupFiles( fileManifest );

  var id = req.params.id,
      limit = req.params.limit || null;

  dataMapper.connect(function () {
    dataMapper.run(function ( fileObjects ) {
      winston.log('debug', chalk.green('Drained dataMapper run queue'));

      var fileObject = fileObjectGetter( id, fileObjects );

      if( !fileObject ) {
        return res.send(id + ' is not manifested in xml. Here is a list of manifested xml objects:<br /><br />' + fileTypes.join('<br />'));
      }

      res.send( 200, fileObject.renderHtml( limit ) );

      dataMapper.disconnect();
    });
  });
};

exports.injectSingle = function ( req, res, next ) {
  var date = new Date(),
      timeStarted = date.getTime();

  var id = req.params.id,
      limit = req.params.limit || null;

  var file = fileObjectGetter( id, fileManifest );

  var dataMapper = new Mapper({
    freshness: '1 day',
    injectAndNormalize: true
  }).setupFiles([
    fileManifest[ fileManifest.indexOf( file ) ]
  ]);

  dataMapper.connect(function () {
    dataMapper.run(function ( fileObjects ) {
      winston.log('debug', chalk.green('Drained dataMapper run queue'));

      var date = new Date(),
          timeEnded = date.getTime();

      res.set('Time-On-Server', (( timeStarted - timeEnded ) / 1000).toString() + ' seconds');
      res.send( 200, fileObjects[0].renderHtml( limit ) );

      dataMapper.disconnect();
    });
  });
};

exports.xmlToHtmlSingle = function ( req, res, next ) {
  var id = req.params.id,
      limit = req.params.limit || null;

  var file = fileObjectGetter( id, fileManifest );

  if( !file ) {
    return res.send(id + ' is not manifested in xml. Here is a list of manifested xml objects:<br /><br />' + fileTypes.join('<br />'));
  }

  var dataMapper = new Mapper({
    freshness: '1 day'
  }).setupFiles([
    fileManifest[ fileManifest.indexOf( file ) ]
  ]);

  dataMapper.connect(function () {
    dataMapper.run(function ( fileObjects ) {
      winston.log('debug', chalk.green('Drained dataMapper run queue')); 

      res.send( 200, fileObjects[0].renderHtml( limit ) );

      dataMapper.disconnect();
    });
  });
};

exports.importFiles = function ( req, res, next ) {
  fileImport().then(function ( results ) {
    res.send('Complete!');
  }).catch(function ( err ) {
    console.error( err );
    res.send( err );
  });
};

/* Private */
function fileObjectGetter ( ident, fileObjects ) {
  return ( isNaN( ident ) ) ? _.find(fileObjects, function ( file ) {
    return file.type.toLowerCase() === ident;
  }) : fileObjects[ ident ];
}
