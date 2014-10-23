/*
  Cryptify
  ---
  Mongoose model plugin for using bcrypt on paths
*/

var bcp     = require('bcrypt'),
    Promise = require('bluebird'); // jshint ignore:line

module.exports = Cryptify;

function Cryptify ( schema, options ) {
  if( !options.paths ) {
    throw new Error('Cryptify requires "paths" to be specified in the options hash');
  }

  var paths = options.paths.map(function ( path ) {
    return path.split('.');
  });

  workFactor = options.factor || 10;

  schema.pre('save', function ( next ) {
    if( !this.isNew ) {
      return next();
    }

    var doc = this;

    var getPathValue = function ( pathArray ) {
      var recursive = doc;

      pathArray.forEach(function ( subpath ) {
        recursive = recursive[ subpath ];
      });

      return recursive;
    };

    var setPathValue = function ( recursive, pathArray, value ) {
        var len  = pathArray.length - 1;

        for ( var i = 0; i < len; i++ ) {
            recursive = recursive[ pathArray[ i ] ];
        }

        recursive[ pathArray[ len ] ] = value;
    };

    paths.forEach(function ( path ) {
      var raw = getPathValue( path );

      generateHash( raw ).then(function ( hash ) {
        setPathValue( doc, path, hash ); 
      }).catch( next );
    });

    next();
  });
}

function generateHash ( raw ) {
  return new Promise(function ( resolve, reject ) {
    bcp.genSalt(workFactor, function ( err, salt ) {
      if( err ) {
        return reject( err );
      }

      bcp.hash(raw, salt, function ( err, hash ) {
        if( err ) {
          return reject( err );
        }

        resolve( hash );
      });
    });
  });
}
