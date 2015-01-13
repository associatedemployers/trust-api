var _      = require('lodash'),
    moment = require('moment');

/**
 * For parsing queries where types are converted by http
 * @param  {Object} object Object to parse
 * @return {Object}        Parsed Object
 */
module.exports = function ( object, callback ) {
  if ( !_.isObject( object ) ) {
    return object;
  }

  callback = callback || defaultCallback;

  var mapObjectValue = function ( value ) {
    if( _.isObject( value ) && !_.isArray( value ) ) {
      return _.mapValues( value, mapObjectValue );
    } else if( _.isArray( value ) ) {
      return value.map( mapObjectValue );
    } else {
      return callback( value );
    }
  };

  return _.mapValues( object, mapObjectValue );
};

function defaultCallback ( value ) {
  if ( !isNaN( value ) ) {
    return parseFloat( value );
  } else if ( value === 'true' || value === 'false' ) {
    return ( value === 'true' ) ? true : false;
  } else if ( moment( value ).isValid() ) {
    return moment( value ).toDate();
  } else {
    return value;
  }
}
