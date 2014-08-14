/*
  File Object
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    moment  = require('moment'),
    _       = require('lodash');

var FileStreamer = require('../file-streamer'),
    parse        = require('../parser');

exports.module = FileObject;

function FileObject ( file ) {

  if( typeof files !== 'object' ) {
    return winston.log('error', chalk.bgRed('You must pass an object to the FileObject constructor'));
  }

  this.meta = {
    from: file.from,
    to:   file.to
  };

  this.rootKey = file.rootKey || null;

  this.type    = file.type._dasherize;
}

FileObject.prototype.fetch = function ( freshness, fileStreamer, callback ) {

  var f   = freshness.split(' '),
      lf  = this.lastFetched,
      lfm = moment(lf, "YYYY/MM/DD HH:mm:ss");
  
  if( !(fileStreamer instanceof FileStreamer) ) {
    return winston.log('error', chalk.bgRed('Expected FileStreamer, got ', typeof fileStreamer));
  }

  if( lf && lfm.isValid() && moment().add( f[1], f[0] ).isBefore( moment() ) ) {
    if( callback && typeof callback === 'function' ) {
      callback( null, this );
    }
  } else {
    fileStreamer.readStream(this.meta.from, this.meta.to, function ( err ) {
      if( err ) {
        callback( err );
      }

      this.lastFetched = moment().format("YYYY/MM/DD HH:mm:ss");

      if( callback && typeof callback === 'function' ) {
        callback();
      }

    });
  }

}

FileObject.prototype.toXML = function ( callback ) {

}

FileObject.prototype.renderHtml = function ( callback ) {
  if( callback && typeof callback === 'function' ) {
    callback();
  }
}

/* Private */

String.prototype._dasherize = function () {
  return ( this ) ? this.replace(/[A-Z]/g, function ( v ) {
    return '-' + v.toLowerCase();
  }) : this;
}
