/*
  Searchable
  ---
  Mongoose model plugin for generating a searchable, stringified field
*/

var _       = require('lodash'),
    getPath = require(process.cwd() + '/lib/utilities/get-path');

module.exports = Searchable;

function Searchable ( schema, options ) {
  if( !options.paths ) {
    throw new Error('Searchable requires "paths" to be specified in the options hash');
  }

  schema.add({ stringified: String });

  schema.pre('save', function ( next ) {
    var plain = this.toObject(),
        str  = [];

    options.paths.forEach(function ( path ) {
      var v = getPath.call( plain, path ),
          s = ( _.isArray( v ) ) ? v.join(' ') : v;
      str.push(s);
    });

    this.stringified = str.join(' ');
    next();
  });
}
