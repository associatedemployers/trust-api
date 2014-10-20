/*
  Data Normalization Procedures
  ---
  Map & munge data
*/

exports.employee = function ( employee, meta ) {
  return prefixType( 'employee', employee, meta );
};

exports.dependent = function ( employee, meta ) {
  return prefixType( 'dependent', employee, meta );
};

exports.company = function ( company, meta ) {
  return prefixType( 'company', company, meta );
};

exports.historyEvent = function ( historyEvent, meta ) {
  return prefixType( 'historyEvent', historyEvent, meta );
};

/* Private */
function prefixType ( type, data, meta ) {
  var o = {};

  o[ type ] = data;

  if( meta ) {
    o.meta = meta;
  }

  return o;
}
