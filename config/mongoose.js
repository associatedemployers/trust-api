/*
  Mongoose configuration
*/

var mongoose = require('mongoose'),
    winston  = require('winston');


exports.init = function () {
  winston.info('Connecting to mongodb...');
  return mongoose.connect('localhost', 'trust');
};
