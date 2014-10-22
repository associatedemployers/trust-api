/*
  toDate normalize, serializer
*/

exports.normalize = function ( v ) {
  if( !v ) {
    return v;
  }

  if( typeof v === 'number' ) {
    v = v.toString();

    return new Date(v.substr(0, 3), v.substr(4, 2), v.substr(6, 2), v.substr(8, 2), v.substr(10, 2), v.substr(12, 2));
  }

  var spl = v.split('-');
  spl[ 1 ] = parseFloat( spl[ 1 ] ) - 1;

  return new Date( spl.join('-') );
};

exports.serialize = function ( v ) {
  return ( v ) ? v.toISOString().split('.')[0] : v;
};
