/*
  Location - Server Data Model
  ---
  Can be used by company & employee
  for tracking physical locations
*/
var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var locationSchema = new Schema({

});

module.exports = mongoose.model('Location', locationSchema);
