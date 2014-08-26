/*
  Data Normalization Procedures
  ---
  Map & munge data
*/

exports.employee = function ( employee ) {
  return prefixType( 'employee', employee );
};

/* Private */

function prefixType (type, data) {
  var o = {};

  o[type] = data;

  return o;
}
