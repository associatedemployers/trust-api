/*
  toDate normalize, serializer
*/

exports.normalize = function ( v ) {
  return ( v ) ? new Date( v ) : v;
};

exports.serialize = function ( v ) {
  return ( v ) ? v.toISOString().split('.')[0] : v;
};
