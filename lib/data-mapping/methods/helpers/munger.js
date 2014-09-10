var winston = require('winston'),
    chalk   = require('chalk');

/**
 * Munger Export
 * @param  {Object} definition
 * @param  {Array} hashes
 * @return {Array}
 */
module.exports = function ( definition, hashes ) {

  hashes.forEach(function ( hash ) {
    for ( var key in hash ) {
      // Grab the definition
      var d = definition[ key ];

      if( d && d === '-trash-' ) {

        delete hash[ key ];

      } else if( d && d !== key && typeof d === 'string') {

        var v = hash[ key ];

        // Boolean Type Mapping
        // -> Could use a hash to look up the type
        //    here, but it probably would be a
        //    big loss of readibility.
        if( d.indexOf('boolean-') > -1 ) {
          switch ( v.toLowerCase() ) {
            case '1':
            case 1:
            case 'yes':
            case 'n':
            case 'true':
              v = true;
              break;
            case '0':
            case 0:
            case 'no':
            case 'n':
            case 'false':
              v = false;
              break;
          }

          d = d.replace('boolean-', '');
        }

        hash[ d ] = v;

        delete hash[ key ];

      } else if( d && typeof d === 'object' ) {
        
        if( d.inHash ) {
          // Support object assignments! Yay!
          var h = d.inHash;

          if( !hash[ h ] ) {
            hash[ h ] = {};
          }

          hash[ h ][ d.toKey ] = hash[ key ];

        } else if( d.normalize && typeof d.normalize === 'function' ) {
          // Support methodical assignments! Yay!
          hash[ d.toKey ] = d.normalize( hash[ key ] );
        }

        delete hash[ key ];

      } else if( d === key ) {
        // This doesn't touch the key for performance reasons
        winston.log('warning', chalk.yellow('Key to Key map, skipping', key));

      } else {
        // Handle a definition error
        winston.log('error', chalk.bgRed('No definition found for key', key));

      }
    }
  });

  return hashes;
};
