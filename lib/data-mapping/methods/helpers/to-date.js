/*
  toDate normalize, serializer
*/

var moment = require('moment'); // Helps us with the crazy date string/num from access

exports.normalize = function ( v ) {
  if( !v ) {
    return v;
  }

  var args = [ v ];

  if( typeof v === 'number' ) {
    args.push('YYYYMMDDHHmmss'); // Here's that crazy date string
  }

  return moment.apply(this, args).toDate();
};

exports.serialize = function ( v ) {
  return ( v ) ? v.toISOString().split('.')[0] : v;
};
