/*
  Medical Rate - Server Data Model
*/

var mongoose =   require('mongoose'),
    Schema =     mongoose.Schema,
    momentDate = require('../utils/moment-date');

var employeeSchema = new Schema({
  // From XML -> Employee

  // System
  time_stamp: { type: String, default: new momentDate() }
});

module.exports = mongoose.model('Employee', employeeSchema);
