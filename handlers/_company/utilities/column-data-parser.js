var cwd = process.cwd();

var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    respond   = require(cwd + '/handlers/response'),
    moment    = require('moment'),
    _         = require('lodash');

var getConfig = require(cwd + '/lib/utilities/get-config'),
    headers   = require(cwd + '/config/column-data-headers'),
    keygen    = require('keygenerator'),
    tojson    = require('convert-json'),
    fs        = require('fs-extra'),
    Promise   = require('bluebird'); // jshint ignore:line

var requiredFields = [ 'ssn', 'hiredate' ];

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
      res.status(200).json(result);
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

  var _isDate = function ( value ) {
    if ( !/([0-9]){1,4}[\/-]([0-9]){1,2}[\/-]([0-9]){1,4}/.test(value) ) {
      return false;
    }

    var validDate;
    var validDateFormats = [
      'YYYY/MM/DD',
      'MM/DD/YYYY',
      'MM-DD-YYYY',
      'YYYY-MM-DD'
    ];

    validDateFormats.forEach(function ( format ) {
      var _d = moment(value, format);
      if ( _d.isValid() ) {
        validDate = _d.toDate();
      }
    });

    return validDate || false;
  };

  var _parseRow = function ( row ) {
    return row.map(function ( col ) {
      if ( !col || col.length < 1 ) {
        return col;
      }

      var isDate = _isDate(col);

      return ( isDate ) ? isDate : col;
    });
  };

  _.forOwn(employeeHeaders, function ( fuzz, field ) {
    fuzz.forEach(_pushHeader.bind({ field: field }));
  });

  dataArray[0] = dataArray[0].map(function ( colHeader, index ) {
    var parsedCol = _parseCol(colHeader),
        match = _.find(fuzzyHeaders, { header: parsedCol });

    if ( !match ) {
      return {
        originalHeader: colHeader
      };
    }

    var ret = {
      mapsTo: match.to,
      matchedWith: match.header,
      originalHeader: colHeader
    };

    if ( requiredFields.indexOf(match.header) > -1 ) {
      ret.missingFields = findUndefinedInCol(dataArray.slice(0, dataArray.length), index);
    }

    return ret;
  });

  dataArray = dataArray.concat(dataArray.splice(1, dataArray.length).map(_parseRow));

  return dataArray;
}

function findUndefinedInCol ( rows, colIndex ) {
  return rows.reduce(function ( isUndefined, row ) {
    return ( !isUndefined && (!row[ colIndex ] || row[colIndex].length < 1) ) ? true : isUndefined;
  }, false);
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
