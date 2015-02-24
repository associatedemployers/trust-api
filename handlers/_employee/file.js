var cwd       = process.cwd(),
    winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../../config/data-normalization'),
    respond   = require('../response'),
    mongoose  = require('mongoose'),
    _         = require('lodash');

var Employee      = require(cwd + '/models/employee'),
    File          = require(cwd + '/models/file'),
    ResourceMixin = require(cwd + '/lib/mixins/resource-handler');

var getConfig = require(cwd + '/lib/utilities/get-config'),
    fs        = require('fs-extra'),
    Promise   = require('bluebird'); // jshint ignore:line

exports.fetchByID = ResourceMixin.getById('File');

exports.upload = function ( req, res, next ) {
  var busboy = req.busboy,
      user   = req.session.user,
      dir    = cwd + ( getConfig('clientUploadDirectory') || '/files/client' ) + '/';

  var files  = [],
      labels = [],
      filestream;

  winston.debug(chalk.dim('Client API :: File Upload :: Start'));

  if ( !busboy ) {
    // Reject empty requests
    return res.status(400).send('Please send a file with your request');
  }

  fs.ensureDirSync(dir);

  busboy.on('file', function ( fieldname, file, filename, encoding, mimetype ) {
    winston.debug(chalk.dim('Client API :: File Upload :: Streaming new file...'));
    var promise = new Promise(function ( resolve, reject ) {

      var originalFilename = filename.split('.').shift(),
          ext              = filename.split('.').pop(),
          fileId           = mongoose.Types.ObjectId(),
          dest             = dir + user._id.toString() + '-' + fileId.toString() + '.' + ext;

      filestream = fs.createWriteStream( dest );

      file.pipe( filestream );

      filestream.on('close', function () {
        winston.debug(chalk.dim('Client API :: File Upload :: Uploaded file', filename));
        
        var fileDocument = new File({
          _id:       fileId,
          employee:  user._id,
          name:      originalFilename,
          location:  dest,
          extension: ext,
          mimeType:  mimetype,
          encoding:  encoding,
          labels:    ( labels[ filename ] ) ? [ labels[ filename ] ] : null
        });

        winston.debug(chalk.dim('Client API :: File Upload :: Saving file document for', filename));

        fileDocument.save(function ( err, savedFileDocument ) {
          if ( err ) {
            return reject( err );
          }

          resolve( savedFileDocument );
        });
      });
    });

    files.push( promise );
  });

  busboy.on('field', function ( key, value ) {
    if ( key.indexOf('-label') > -1 ) {
      labels[ key.replace('-label', '') ] = value;
    }
  });

  busboy.on('finish', function () {
    var savedFiles;

    Promise.all(files).then(function ( results ) {
      return new Promise(function ( resolve, reject ) {
        results.forEach(function ( result ) {
          user.files.push( result );
        });

        savedFiles = results;

        user.save(function ( err, savedUser ) {
          if ( err ) {
            return reject( err );
          }

          resolve( savedUser );
        });
      });
    }).then(function ( /* savedUser */ ) {
      winston.debug(chalk.dim('Client API :: File Upload :: Finished with request'));
      res.status(201).send({
        file: savedFiles
      });
    }).catch(function ( err ) {
      respond.error.res(res, err, true);
    });
  });

  req.pipe( busboy );
};

exports.update = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.del = function ( req, res, next ) {
  respond.code.notimplemented(res);
};
