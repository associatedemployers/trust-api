/*
  File Object
*/

var winston = require('winston').loggers.get('default'),
    chalk   = require('chalk'),
    moment  = require('moment'),
    fs      = require('fs-extra'),
    _       = require('lodash');

var FileStreamer = require('../file-streamer'),
    xparse        = require('../parser');

module.exports = FileObject;

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
  this.typeDasherized = file.type._dasherize();
}

FileObject.prototype.fetch = function ( freshness, fileStreamer, callback ) {
  var f   = freshness.split(' '),
      lf  = this.lastFetched,
      lfm = moment(lf, "YYYY/MM/DD HH:mm:ss"),
      self = this;
  
  if( !(fileStreamer instanceof FileStreamer) ) {
    return winston.log('error', chalk.bgRed('Expected FileStreamer, got ', typeof fileStreamer));
  }

  var alwaysFetch = ( process.env.ALWAYSFETCH === 'true' ) ? true : false;

  if (( lfm.isValid() && lfm.add( f[1], parseFloat(f[0]) ).isBefore( moment() ) ) || 
      ( !alwaysFetch && fs.existsSync( process.cwd() + fileStreamer.config.toLocalDirectory + this.meta.to ) )) {

    this._read(fileStreamer, function ( err, buff ) {
      if( err ) {
        return self._callback( callback, [ err ] );
      }

      self.lastFetched = moment().format("YYYY/MM/DD HH:mm:ss");

      self._callback( callback );
    });

  } else {

    fileStreamer.getStream(this.meta.from, this.meta.to, function ( err ) {
      if( err ) {
        return self._callback( callback, [ err ] );
      }

      self._read(fileStreamer, function ( err, buff ) {
        if( err ) {
          return self._callback( callback, [ err ] );
        }

        self.lastFetched = moment().format("YYYY/MM/DD HH:mm:ss");

        self._callback( callback );
      });
    });

  }
};

FileObject.prototype._read = function ( fileStreamer, callback ) {
  var self = this;

  fileStreamer.readStream(this.meta.to, function ( err, buff ) {
    if( err ) {
      return self._callback( callback, [ err ] );
    }

    self.buffer = buff;

    self._callback( callback, [ null, buff ] );
  });
};

FileObject.prototype.toJSON = function () {
  if( !this.buffer ) {
    return winston.log('error', chalk.bgRed('FileObject has no buffer!') );
  }

  var parsed = xparse( this.buffer.toString() );

  this.json = ( parsed.dataroot ) ? parsed.dataroot[ this.rootKey ] : [];

  return this.json;
};

FileObject.prototype.renderHtml = function ( limit ) {
  var data = this.json,
      dataKeys = [];

  if( !data ) {
    winston.log('error', chalk.bgRed('No data on fileObject! Cannot render HTML.'));
    return;
  }

  if( limit ) {
    console.log(limit);
    data = data.slice(0, limit);
  }

  var html = '<html>' +
             '<head><style>table { border: 1px solid #666; width: 100%; } th {background: #f8f8f8; font-weight: bold; padding: 2px; } tr:nth-child(even) { background-color: #F5F5F5; } .blankfield { background-color: rgba(255, 0, 0, 0.1); }</style></head>' +
             '<body>',
      tb   = '',
      tbh  = '';

  data.forEach(function ( item ) {
    var itemRow = [],
        itemCol = {};

    for ( var key in item ) {
      if( dataKeys.indexOf( key ) < 0 ) {
        tbh += '<th>' + key + '</th>';
        dataKeys.push(key);
      }

      itemCol[ key ] = '<td class="' + key + '">' + item[ key ] + '</td>';
    }

    dataKeys.forEach(function ( dataKey, index ) {
      var colHtml = itemCol[ dataKey ],
          colTd   = ( colHtml ) ? colHtml : '<td class="blankfield"></td>';

      itemRow[ index ] = colTd;
    });

    tb += '<tr>' + itemRow.join('') + '</tr>';
  });

  html += '<table><tr>' + tbh + '</tr>' + tb + '</table></body></html>';

  return html;
};

FileObject.prototype._callback = function ( callback, args ) {
  if( callback && typeof callback === 'function' ) {
    callback.apply( this, args );
  }
};

/* Private */

String.prototype._dasherize = function () {
  return ( this ) ? this.replace(/[A-Z]/g, function ( v ) {
    return '-' + v.toLowerCase();
  }) : this;
};
