/*
  Mapper
  ---
  This module handles mapping and injection
*/

var winston = require('winston'),
    chalk   = require('chalk'),
    _       = require('lodash');

var FileObject = require('./types/file-object');

exports.module = Mapper;

function Mapper ( options ) {
  this.options = options;
}

Mapper.prototype.run = function ( parsedArray ) {

  fileArray.forEach(function ( fileObject ) {

    if( !(fileObject instanceof FileObject) ) {
      return winston.log('error', chalk.bgRed('Tried to read a non-fileobject'));
    }

    

  }

}

Mapper.prototype.connect = function () {

}
