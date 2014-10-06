/*
  Mapper
  ---
  This module handles mapping and injection
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    _       = require('lodash'),
    async   = require('async');

var FileObject   = require('./types/file-object'),
    FileStreamer = require('./file-streamer');

var ftp     = require('../../../config/ftp');

module.exports = Mapper;

function Mapper ( options ) {
  this.options = {
    freshness: options.freshness || '1 second',
    injectAndNormalize: options.injectAndNormalize
  };

  this.fileStreamer = new FileStreamer( ftp );

  this.fileArray = [];
  this.queue     = [];
  this.processed = [];

  return this;
}

Mapper.prototype.connect = function ( callback ) {
  this.fileStreamer.connect( callback );
};

Mapper.prototype.disconnect = function ( callback ) {
  this.fileStreamer.disconnect( callback );
};

Mapper.prototype.setupFiles = function ( rawFiles ) {
  var self = this;

  rawFiles.forEach(function ( file ) {
    var fileObject = new FileObject( file );

    self.fileArray.push( fileObject );
  });

  return this;
};

Mapper.prototype.run = function ( callback ) {
  var self = this;

  this.fileArray.forEach(function ( fileObject ) {
    if( !( fileObject instanceof FileObject ) ) {
      return winston.log('error', chalk.bgRed('Tried to read a non-FileObject'));
    }

    self._addQueue( fileObject );
  });

  this._drain( callback );
};

Mapper.prototype._addQueue = function ( fileObject ) {
  this.queue.push( fileObject );
};

Mapper.prototype._drain = function ( callback ) {
  if( this.processingQueue ) {
    winston.log('error', chalk.bgRed('Attempted to drain queue while processing.'));
    return this._callback( callback );
  }

  this.processingQueue = true;

  var queue    = this.queue,
      queueLen = queue.length,
      injnorm  = this.options.injectAndNormalize,
      self     = this;

  if( !queue ) {
    this.processingQueue = false;
  }

  var fulfilled = 0;

  async.mapSeries(queue, function ( fileObject, cb ) {
    // Freshness, FileStreamer, Callback
    fileObject.fetch(self.options.freshness, self.fileStreamer, function ( err ) {
      if( err ) {
        throw new Error( err );
      }

      var json    = fileObject.toJSON(),
          methods = require('../methods/' + fileObject.typeDasherized);

      winston.log('info', chalk.green( 'Running queue hooks for fileObject:', fileObject.type ));

      var done = function ( documents, err ) {
        fulfilled++;

        winston.log('info', chalk.dim( fulfilled, 'of', queueLen ));

        _.pull( self.queue, fileObject );

        cb( err, fileObject );
      };

      // Inject and Normalize
      if( injnorm ) {
        winston.log('info', chalk.dim('-->Running normalize hook for', fileObject.type));
        var normalized = ( methods && typeof methods.normalize === 'function' ) ? methods.normalize( json ) : json;

        if( methods && typeof methods.inject === 'function' ) {
          // Recieves records as callback argument.
          winston.log('info', chalk.dim('-->Running inject hook for', fileObject.type));
          methods.inject(normalized, done);
        } else {
          winston.log('error', chalk.bgRed('No injection method found for', fileObject.type));
        }
      } else {
        cb( null, fileObject );
      }
    });
  }, function ( err, result ) {
    self.processingQueue = false;

    self._callback( callback, [ result ] );
  });
};

Mapper.prototype._callback = function ( callback, args ) {
  if( callback && typeof callback === 'function' ) {
    callback.apply( this, args );
  }
};
