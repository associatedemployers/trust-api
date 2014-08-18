/*
  File Steamer Module
*/

var winston    = require('winston'),
    chalk      = require('chalk'),
    fs         = require('fs-extra'),
    Connection = require('ssh2'),
    _          = require('lodash');

exports.module = FileStreamer;

function FileStreamer ( config, callback ) {
  this.config = config;
  this.connection = this.createConnection();
}

FileStreamer.prototype.createConnection = function () {
  return new Connection();
}

FileStreamer.prototype.connect = function ( callback ) {
  winston.info( chalk.yellow('Connecting to SFTP Server...') );

  var connection = this.connection,
      self       = this;

  winston.info( chalk.dim('-> Resolving...') );

  connection.on('ready', function () {
    winston.info( chalk.green('SSH Connection :: ready') );

    connection.sftp(function (err, sftp) {
      if(err) {
        return callback(err);
      }

      winston.info( chalk.green('SFTP Connection :: ready') );

      self.sftp = sftp;

      callback(err, sftp);
    });
  })
  .on('error', callback)
  .connect(_.merge({
    port: 22,
  }, this.config));
}

FileStreamer.prototype.getStream = function ( from, to, callback ) {
  var sftp     = this.sftp,
      config   = this.config,
      fromDest = config.dataDirectory + from,
      toDest   = process.cwd() + config.toLocalDirectory + to;

  sftp.fastGet( fromDest, toDest, callback );
}

FileStreamer.prototype.readStream = function ( path, callback ) {
  fs.readFile(path, function (err, data) {
    callback( err, data );
  });
}
