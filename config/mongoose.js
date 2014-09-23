/*
  Mongoose configuration
*/

var mongoose = require('mongoose'),
    winston  = require('winston');

var connection;

exports.init = function () {
  if( !connection ) {
    winston.info('Connecting to mongodb...');
    connection = mongoose.connect('localhost', 'trust');
  }

  return connection;
};
