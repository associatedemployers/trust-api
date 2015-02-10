var cwd       = process.cwd(),
    mongoose  = require('mongoose'),
    winston   = require('winston'),
    chalk     = require('chalk'),
    slog      = require('single-line-log').stdout,
    _         = require('lodash'),
    fs        = require('fs-extra'),
    moment    = require('moment'),
    Promise   = require('bluebird'), // jshint ignore:line
    indexOfId = require(cwd + '/lib/utilities/find-by-objectid'),
    glob      = require('glob');

var fromDir = cwd + '/temp_data/legacy-files',
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

module.exports = function () {
  return new Promise(function ( resolve, reject ) {
    winston.log('info', chalk.dim('FileImport :: Copying directory for editing...'));

    fs.copy(fromDir, toDir, function ( err ) {
      if ( err ) {
        winston.error( err );
        return res.send( err );
      }

      var pat           = toDir + '/**/*.*',
          times         = [],
          timeRemaining = 'Estimating time...';

      winston.log('info', chalk.dim('FileImport :: Globbing file pattern', pat));

      glob(pat, function ( err, files ) {
        if ( err ) {
          winston.error( err );
          return res.send( err );
        }

        winston.log('info', chalk.dim('FileImport :: Copied directory! :)'));

        Promise.reduce(files, function ( count, filePath, index, filesLength ) {
          slog(chalk.dim(index, '/', filesLength, '::', timeRemaining, '::', 'Beginning Work...'));
          var start = moment();

          return new Promise(function ( resolve, reject ) {

            var isCompanyFile = filePath.toLowerCase().indexOf('company/') > -1,
                nameArr, extension, identifier, type;

            if ( isCompanyFile ) {
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

            slog(chalk.dim(index, '/', filesLength, '::', timeRemaining, '::', 'Creating', extension, 'file document for', identifier, '- isCompany?', isCompanyFile));

            var Model = ( isCompanyFile ) ? require(cwd + '/models/company') : require(cwd + '/models/employee'),
                query = {},
                idField = ( isCompanyFile ) ? 'legacyCompanyNumber' : 'memberId';

            if ( isNaN( identifier ) ) {
              return resolve();
            }

            query[ idField ] = identifier;

            Model.findOne( query ).exec(function ( err, doc ) {
              if ( err ) {
                return reject( err );
              }

              if ( !doc ) {
                return resolve();
              }

              slog(chalk.dim(index, '/', filesLength, '::', timeRemaining, '::', 'Found reference'));

              var fileLink = ( isCompanyFile ) ? 'company' : 'employee',
                  fileInfo = {
                    extension: extension,
                    labels:    [ 'legacy' ]
                  };

              if ( type ) {
                fileInfo.labels.push( type );
              }

              fileInfo[ fileLink ] = doc._id;

              var file = new File( fileInfo );

              file.save(function ( err, fileDoc ) {
                if ( err ) {
                  return reject( err );
                }

                slog(chalk.dim(index, '/', filesLength, '::', timeRemaining, '::', 'Saved file document. Moving old file...'));

                var dest = cwd + '/files/' + fileLink + '/' + doc._id + '-' + fileDoc._id + '.' + fileDoc.extension;

                fs.copy(filePath, dest, function ( err ) {
                  if ( err ) {
                    return reject( err );
                  }

                  slog(chalk.dim(index, '/', filesLength, '::', timeRemaining, '::', 'Moved & renamed old file.'));

                  if ( indexOfId( doc.files, fileDoc._id ) < 0 ) {
                    doc.files.push( fileDoc._id );
                  } else {
                    return resolve( fileDoc );
                  }

                  doc.save(function ( err ) {
                    if ( err ) {
                      return reject( err );
                    }

                    slog(chalk.dim(index, '/', filesLength, '::', timeRemaining, '::', 'Saved ref to doc.'));

                    var end = moment();

                    times.push( end.diff(start, 'milliseconds') );

                    if ( times.length > 500 ) {
                      times.splice( 499, 1 );
                    }

                    timeRemaining = Math.floor( ( ( filesLength - index ) * ( avgArray( times ) / 1000 ) ) / 60 ) + 'min remaining';

                    resolve( fileDoc );
                  });
                });
              });
            });
          }).then(function ( file ) {
            return count + 1;
          });
        }, 0).then( resolve ).catch( reject );
      });
    });
  });
};

function avgArray ( array ) {
  return _.reduce(array, function( sum, time ) {
    return sum + time;
  }, 0) / array.length;
}
