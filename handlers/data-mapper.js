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
    Mapper       = require('../lib/data-mapping/core/mapper');

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
  var cwd     = process.cwd(),
      fromDir = cwd + '/temp_data/legacy-files',
      toDir   = cwd + '/temp_data/__temp-legacy-files',
      File    = require(cwd + '/models/file');

  var fileFlagMap = {
    priv: 'Privacy Statement',
    vf:   'Voluntary Forms',
    slf:  'Supplemental Life Enrollment',
    misc: 'Miscellaneous Support Docs',
    AA:   'Adoption Agreement',
    AR:   'Audit Review'
  };

  winston.log('debug', chalk.dim('FileImport :: Copying directory for editing...'));

  fs.copy(fromDir, toDir, function ( err ) {
    if( err ) {
      winston.error( err );
      return res.send( err );
    }

    var pat = toDir + '/**/*.*';

    winston.log('debug', chalk.dim('FileImport :: Globbing file pattern', pat));

    glob(pat, function ( err, files ) {
      if( err ) {
        winston.error( err );
        return res.send( err );
      }

      winston.log('debug', chalk.dim('FileImport :: Copied directory! :)'));

      Promise.reduce(files, function ( count, filePath, index, filesLength ) {
        winston.log('debug', '\n' + chalk.underline('FileImport ::', index, '/', filesLength));
        slog(chalk.dim('Beginning Work...'));

        return new Promise(function ( resolve, reject ) {

          var isCompanyFile = filePath.toLowerCase().indexOf('company/') > -1,
              nameArr, extension, identifier, type;

          if( isCompanyFile ) {
            nameArr    = _.last( _.last( filePath.split('/') ).split(' - ') ).split('.');
            extension  = _.last( nameArr ).toLowerCase();
            var splt   = nameArr[ 0 ].split(' ');
            identifier = _.last( splt );
            type       = ( splt.length > 1 ) ? fileFlagMap[ splt[ 0 ] ] : null;
          } else {
            nameArr    = _.last( _.last( filePath.split('/') ).split(' ') ).split('.');
            extension  = _.last( nameArr ).toLowerCase();
            identifier = nameArr[ 0 ].substr(0, 9);
            type       = ( nameArr[ 0 ].length > 9 ) ? fileFlagMap[ nameArr[ 0 ].substring(9, nameArr[ 0 ].length) ] : 'Enrollment';
          }

          slog(chalk.dim('Creating', extension, 'file document for', identifier, '- isCompany?', isCompanyFile));

          var Model = ( isCompanyFile ) ? require(cwd + '/models/company') : require(cwd + '/models/employee'),
              query = {},
              idField = ( isCompanyFile ) ? 'legacyCompanyNumber' : 'memberId';

          query[ idField ] = identifier;

          Model.findOne( query ).exec(function ( err, doc ) {
            if( err ) {
              return reject( err );
            }

            if( !doc ) {
              winston.log('warn', 'No document found for file identifier', identifier);
              return resolve();
            }

            slog(chalk.dim('Found reference'));

            var fileLink = ( isCompanyFile ) ? 'company' : 'employee',
                fileInfo = {
                  extension: extension,
                  labels:    [ 'legacy' ]
                };

            if( type ) {
              fileInfo.labels.push( type );
            }

            fileInfo[ fileLink ] = doc._id;

            var file = new File( fileInfo );

            file.save(function ( err, fileDoc ) {
              if( err ) {
                return reject( err );
              }

              slog(chalk.dim('Saved file document. Moving old file...'));

              var dest = cwd + '/files/' + fileLink + '/' + doc._id + '-' + fileDoc._id + '.' + fileDoc.extension;

              fs.copy(filePath, dest, function ( err ) {
                if( err ) {
                  return reject( err );
                }

                slog(chalk.dim('Moved & renamed old file.'));
                winston.log('\n');

                if( indexOfId( doc.files, fileDoc._id ) < 0 ) {
                  doc.files.push( fileDoc._id );
                } else {
                  return resolve( fileDoc );
                }

                doc.save(function ( err ) {
                  if( err ) {
                    return reject( err );
                  }

                  slog(chalk.dim('Saved ref to doc.'));

                  resolve( fileDoc );
                });
              });
            });
          });
        }).then(function ( file ) {
          return count + 1;
        });
      }, 0).then(function ( results ) {
        res.send('Complete!');
      }).catch(function ( err ) {
        console.error( err );
        res.send( err );
      });
    });
  });
};

/* Private */
function fileObjectGetter ( ident, fileObjects ) {
  return ( isNaN( ident ) ) ? _.find(fileObjects, function ( file ) {
    return file.type.toLowerCase() === ident;
  }) : fileObjects[ ident ];
}
