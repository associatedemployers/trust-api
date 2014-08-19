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

  dataMapper.connect(function () {
    dataMapper.run(function ( fileObjects ) {
      winston.log('debug', chalk.green('Drained dataMapper run queue'));

      console.log('fileObjects', fileObjects);

      var fileObject = fileObjects[ req.params.id ];

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

      var fileObject = ( _.isArray( fileObjects ) ) ? fileObjects[ req.params.id ] : fileObjects;

      res.send( 200, fileObject.renderHtml() );

      dataMapper.disconnect();
    });
  });
}
