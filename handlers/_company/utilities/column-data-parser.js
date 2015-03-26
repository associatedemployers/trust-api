var cwd = process.cwd();

var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    respond   = require(cwd + '/handlers/response'),
    _         = require('lodash');

var getConfig = require(cwd + '/lib/utilities/get-config'),
    headers   = require(cwd + '/config/column-data-headers'),
    keygen    = require('keygenerator'),
    tojson    = require('convert-json'),
    fs        = require('fs-extra'),
    Promise   = require('bluebird'); // jshint ignore:line

function UserError ( message ) {
  this.message = message || 'Bad request';
  return this;
}

UserError.prototype = Object.create(Error.prototype);

exports.parse = function ( req, res, next ) {
  // Manifest supported extensions
  var supportedExtensions = [ 'csv'/*, 'xls', 'xlsx' */];

  var busboy = req.busboy,
      user   = req.session.user,
      dir    = cwd + ( getConfig('temporaryFileDirectory') ) + '/';

  var filePromise, filestream;

  // Reject empty requests
  if ( !busboy ) {
    return res.status(400).send('Please send a file with your request');
  }

  winston.debug(chalk.dim('Company API :: Column Data Parser :: Start'));

  // Ensure our working directory is available
  fs.ensureDirSync(dir);

  // Handle incoming file
  busboy.on('file', function ( fieldname, file, filename, encoding, mimetype ) {
    filePromise = new Promise(function ( resolve, reject ) {
      winston.debug(chalk.dim('Company API :: Column Data Parser :: Writing File', filename + '...'));

      var ext  = filename.split('.').pop().toLowerCase(),
          dest = dir + keygen._() + '.' + ext; // Random temp file id

      // Check to make sure the file is supported before we encounter parsing errors
      if ( supportedExtensions.indexOf(ext) < 0 ) {
        throw new UserError('Unsupported file type');
      }
      // Create the WriteStream
      filestream = fs.createWriteStream( dest );
      // Pipe the file to the WriteStream
      file.pipe( filestream );
      // EOF
      filestream.on('close', function () {
        winston.debug(chalk.dim('Company API :: Column Data Parser :: Wrote file', filename));
        // Resolve with file properties
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

  busboy.on('finish', function () {
    if ( !filePromise ) {
      return res.status(400).send('Possible incomplete file or request. Please make sure to include a file in your request.');
    }

    filePromise
    .then(_parseCsv)
    .then(_interpretCsvData)
    .then(function ( result ) {
      res.status(200).send(result);
    })
    .catch(UserError, function ( err ) {
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

      if ( !result || !_.isArray(result) || result.length < 2 ) {
        throw new UserError('Invalid file content');
      }

      resolve(result);
    });
  });
}

function _interpretCsvData ( dataArray ) {
  var employeeHeaders = headers.employee,
      fuzzyHeaders = [];

  var _parseCol = function ( col ) {
    return col.replace(/\W/g, '').toLowerCase();
  };

  var _pushHeader = function ( i ) {
    fuzzyHeaders.push({
      header: _parseCol(i),
      to: this.field
    });
  };

  _.forOwn(employeeHeaders, function ( fuzz, field ) {
    fuzz.forEach(_pushHeader.bind({ field: field }));
  });

  dataArray[0] = dataArray[0].map(function ( colHeader ) {
    var parsedCol = _parseCol(colHeader),
        match = _.find(fuzzyHeaders, { header: parsedCol });

    return {
      mapsTo: match.to,
      matchedWith: match.header,
      originalHeader: colHeader
    };

  });

  return dataArray;
}

/*
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
*/
