/*
  XML Parser Module
*/

var parser  = require('xml2json');

module.exports = function ( str ) {
  return parser.toJson(str, {
    object: true,
    sanitize: false
  });
};
