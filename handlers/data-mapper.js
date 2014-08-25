/*
  Data Map Request
  ---
  Experimental Route Handler, do not use a url to init a db injection
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    _       = require('lodash');

var fileManifest = require('../config/xml-file-manifest'),
    Mapper       = require('../lib/data-mapping/core/mapper');

exports.xmlToHtml = function ( req, res, next ) {
  var dataMapper = new Mapper({
    freshness: '1 day'
  }).setupFiles( fileManifest );

  var id = req.params.id,
      limit = req.params.limit || null;

  dataMapper.connect(function () {
    dataMapper.run(function ( fileObjects ) {
      winston.log('debug', chalk.green('Drained dataMapper run queue'));

      var fileObject = fileObjectGetter( id, fileObjects );

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

/* Private */
function fileObjectGetter ( ident, fileObjects ) {
  return ( isNaN( ident ) ) ? _.find(fileObjects, function ( file ) {
    return file.type.toLowerCase() === ident;
  }) : fileObjects[ ident ];
}
