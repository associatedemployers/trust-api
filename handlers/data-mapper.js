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

  var id = req.params.id;

  dataMapper.connect(function () {
    dataMapper.run(function ( fileObjects ) {
      winston.log('debug', chalk.green('Drained dataMapper run queue'));

      var fileObject = fileObjectGetter( id, fileObjects );

      winston.log('info', chalk.dim('Rendering HTML for', fileObject.type));

      res.send( 200, fileObject.renderHtml() );

      dataMapper.disconnect();
    });
  });
}

exports.injectXml = function ( req, res, next ) {
  var dataMapper = new Mapper({
    freshness: '1 day',
    injectAndNormalize: true
  }).setupFiles( fileManifest );

  dataMapper.connect(function () {
    dataMapper.run(function ( fileObjects ) {
      winston.log('debug', chalk.green('Drained dataMapper run queue'));

      var fileObject = fileObjectGetter( id, fileObjects );

      res.send( 200, fileObject.renderHtml() );

      dataMapper.disconnect();
    });
  });
}

/* Private */

function fileObjectGetter ( ident, fileObjects ) {
  return ( isNaN( ident ) ) ? _.find(fileObjects, function ( file ) {
    return file.type.toLowerCase() === ident;
  }) : fileObjects[ ident ];
}
