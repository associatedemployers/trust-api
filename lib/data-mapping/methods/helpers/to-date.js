/*
  toDate normalize, serializer
*/

exports.normalize = function ( v ) {
  if( !v ) {
    return v;
  }

  var spl = v.split('-');
  spl[ 1 ] = parseFloat( spl[ 1 ] ) - 1;

  return new Date( spl.join('-') );
};

exports.serialize = function ( v ) {
  return ( v ) ? v.toISOString().split('.')[0] : v;
};
