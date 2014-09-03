/*
  toDate normalize, serializer
*/

exports.module = {
  normalize: function ( v ) {
    return ( v ) ? new Date( v ) : v;
  },
  serialize: function ( v ) {
    return ( v ) ? v.toISOString().split('.')[0] : v;
  }
};
