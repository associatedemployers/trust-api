/*
  File Steamer Module
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    fs      = require('fs-extra'),
    _       = require('lodash');

exports.module = FileStreamer;

function FileStreamer ( config, callback ) {
  this.config = config;
}

FileStreamer.prototype.readStream = function ( from, to, callback ) {
  var sftp = this.sftp;

  sftp.fastGet( from, to, callback );
}

FileStreamer.prototype.connect = function ( callback ) {
  winston.info(chalk.yellow('Connecting to SFTP Server...'));

  var connection = ftp.createConnection(),
      self       = this;

  winston.info(chalk.dim('-> Resolving...'));

  connection.on('ready', function () {
    winston.info(chalk.green('SSH Connection :: ready'));

    connection.sftp(function (err, sftp) {
      if(err) {
        return callback(err);
      }

      winston.info(chalk.green('SFTP Connection :: ready'));

      self.sftp = sftp;

      callback(err, sftp);
    });
  })
  .on('error', callback)
  .connect(_.merge({
    port: 22,
  }, this.config));
}
