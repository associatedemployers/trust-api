/*
  Mapper
  ---
  This module handles mapping and injection
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    _       = require('lodash');

var FileObject   = require('./types/file-object'),
    FileStreamer = require('../file-streamer');

var ftp     = require('../../../config/ftp'),
    methods = require('../methods');

exports.module = Mapper;

function Mapper ( options ) {
  this.options = options;
  this.fileStreamer = new FileStreamer( ftp );
}

Mapper.prototype.setupFiles = function ( rawFiles, callback ) {
  var self = this;

  rawFiles.forEach(function ( file ) {
    var fileObject = new FileObject( file, methods[ file.type ] );

    self.fileArray.push( fileObject );
  });
}

Mapper.prototype.run = function ( callback ) {
  var self = this;

  this.fileArray.forEach(function ( fileObject ) {
    if( !( fileObject instanceof FileObject ) ) {
      return winston.log('error', chalk.bgRed('Tried to read a non-FileObject'));
    }

    self._addQueue( fileObject );
  }

  this._drain( callback );
}

Mapper.prototype._addQueue = function ( fileObject ) {
  this.queue.push( fileObject );
}

Mapper.prototype._drain = function ( callback ) {
  this.processingQueue = true;

  var queue    = this.queue,
      queueLen = queue.length,
      self     = this;

  if( !queue ) {
    this.processingQueue = false;
  }

  var fulfilled = 0;

  queue.forEach(function ( fileObject ) {
    // Freshness, FileStreamer, Callback
    fileObject.fetch( '1 second', self.fileStreamer, function ( err ) {
      if( err ) {
        throw new Error(err);
      }

      var json    = fileObject.toJSON(),
          methods = require('../methods/' + fileObject.typeDasherized);

      var normalized = ( methods && typeof methods.normalize === 'function' ) ? methods.normalize( json ) : json;

      if( methods && typeof methods.inject === 'function' ) {

        methods.inject(normalized, function ( /* records */ ) {
          fulfilled++;

          if( fulfilled === queueLen ) {
            self._callback( callback );
          }
        });

      } else {
        throw new Error('No injection method found for', fileObject.type);
      }
    });
  });
}

FileObject.prototype._callback = function ( callback, args ) {
  if( callback && typeof callback === 'function' ) {
    callback.apply( this, args );
  }
}
