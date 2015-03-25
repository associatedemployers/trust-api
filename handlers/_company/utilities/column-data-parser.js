var cwd = process.cwd();

var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    respond   = require(cwd + '/handlers/response'),
    _         = require('lodash');

var getConfig = require(cwd + '/lib/utilities/get-config'),
    keygen    = require('keygenerator'),
    tojson    = require('convert-json'),
    fs        = require('fs-extra'),
    Promise   = require('bluebird'); // jshint ignore:line

function ExtensionError ( message ) {
  this.message = 'File extension not supported';
  return this;
}

ExtensionError.prototype = Object.create(Error.prototype);

exports.parse = function ( req, res, next ) {
  var supportedExtensions = [ 'csv', 'xls', 'xlsx' ];

  var busboy = req.busboy,
      user   = req.session.user,
      dir    = cwd + ( getConfig('temporaryFileDirectory') ) + '/';

  var filePromise, filestream;

  if ( !busboy ) {
    // Reject empty requests
    return res.status(400).send('Please send a file with your request');
  }

  winston.debug(chalk.dim('Company API :: Column Data Parser :: Start'));

  fs.ensureDirSync(dir);

  busboy.on('file', function ( fieldname, file, filename, encoding, mimetype ) {
    console.log('file', fieldname);
    filePromise = new Promise(function ( resolve, reject ) {
      winston.debug(chalk.dim('Company API :: Column Data Parser :: Writing File', filename + '...'));

      var ext  = filename.split('.').pop().toLowerCase(),
          dest = dir + keygen._() + '.' + ext;

      if ( supportedExtensions.indexOf(ext) < 0 ) {
        throw new ExtensionError();
      }

      filestream = fs.createWriteStream( dest );

      file.pipe( filestream );

      filestream.on('close', function () {
        winston.debug(chalk.dim('Company API :: Column Data Parser :: Wrote file', filename));

        resolve({
          name:      filename,
          path:      dest,
          mimeType:  mimetype,
          encoding:  encoding,
          extension: ext
        });
      });
    });
  });

  busboy.on('field', function ( key, value ) {
    console.log('got k/v');
  });


  busboy.on('finish', function () {
    if ( !filePromise ) {
      return res.status(400).send('Possible incomplete file or request. Please make sure to include a file in your request.');
    }

    filePromise.then(function ( file ) {
      return (( file.extension === 'csv' ) ? _parseCsv : _parseExcel)(file);
    })
    .then(function ( result ) {
      console.log(result);
    })
    .catch(ExtensionError, function ( err ) {
      res.status(400).send(err.message);
    })
    .catch(function ( err ) {
      respond.error.res(res, err, true);
    });
  });

  req.pipe( busboy );
};

function _parseCsv ( file ) {
  return new Promise(function ( resolve, reject ) {
    tojson.csv(file.path, { newline: '\n\r' }, function ( err, result ) {
      if ( err ) {
        throw err;
      }

      console.log(result);
    });
  });
}

function _parseExcel ( file ) {
  return new Promise(function ( resolve, reject ) {
    ((file.extension === 'xls') ? tojson.xls : tojson.xlsx)(file.path, function ( err, result ) {
      if ( err ) {
        throw err;
      }

      console.log(result);
    });
  });
}
