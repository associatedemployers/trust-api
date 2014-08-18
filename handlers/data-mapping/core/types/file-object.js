/*
  File Object
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    moment  = require('moment'),
    _       = require('lodash');

var FileStreamer = require('../file-streamer'),
    xparse        = require('../parser');

exports.module = FileObject;

function FileObject ( file ) {
  if( typeof file !== 'object' ) {
    return winston.log('error', chalk.bgRed('You must pass an object to the FileObject constructor'));
  }

  this.meta = {
    from: file.from,
    to:   file.to
  };

  this.rootKey = file.rootKey || null;

  this.type = file.type;
  this.typeDasherized = file.type._dasherize;
}

FileObject.prototype.fetch = function ( freshness, fileStreamer, callback ) {
  var f   = freshness.split(' '),
      lf  = this.lastFetched,
      lfm = moment(lf, "YYYY/MM/DD HH:mm:ss"),
      self = this;
  
  if( !(fileStreamer instanceof FileStreamer) ) {
    return winston.log('error', chalk.bgRed('Expected FileStreamer, got ', typeof fileStreamer));
  }

  if( lf && lfm.isValid() && moment().add( f[1], parseFloat(f[0]) ).isBefore( moment() ) ) {
    this._callback( callback );
  } else {
    fileStreamer.getStream(this.meta.from, this.meta.to, function ( err ) {
      if( err ) {
        return self._callback( callback, err );
      }

      fileStreamer.readStream( self.meta.to, function ( err, buff ) {
        if( err ) {
          self._callback( callback, err );
        }

        self.buffer      = buff;
        self.lastFetched = moment().format("YYYY/MM/DD HH:mm:ss");

        self._callback( callback );
      });
    });
  }
}

FileObject.prototype.toJSON = function ( callback ) {
  if( !this.buffer ) {
    return winston.log('error', chalk.bgRed('FileObject has no buffer!') );
  }

  this.json = xparse( this.buffer.toString() ).dataroot[ this.rootkey ];

  this._callback( callback, this.json );
}

FileObject.prototype.renderHtml = function ( callback ) {
  var data = this.json,
      dataKeys = [];

  var html = '<html>' +
             '<head><style>table { border: 1px solid #666; width: 100%; } th {background: #f8f8f8; font-weight: bold; padding: 2px; } </style></head>' +
             '<body>';

  html += '<table><tr>';

  for ( var key in data[0] ) {
    html += '<th>' + key + '</th>';
    dataKeys.push(key);
  }

  html += '</tr>';

  data.forEach(function ( item ) {
    html += '<tr>';

    for ( var key in item ) {
      html += '<td>' + item[ key ] + '</td>';
    }

    html += '</tr>';
  });

  html += '</table></body></html>';

  this._callback( callback, html );
}

FileObject.prototype._callback = function ( callback, args ) {
  if( callback && typeof callback === 'function' ) {
    callback.apply( this, args );
  }
}

/* Private */

String.prototype._dasherize = function () {
  return ( this ) ? this.replace(/[A-Z]/g, function ( v ) {
    return '-' + v.toLowerCase();
  }) : this;
}
