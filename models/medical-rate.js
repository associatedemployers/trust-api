/*
  Medical Rate - Server Data Model
*/

var mongoose =   require('mongoose'),
    Schema =     mongoose.Schema,
    momentDate = require('../utils/moment-date');

var rateSchema = new Schema({
  // From XML -> MedicalRate

  // System
  time_stamp: { type: String, default: new momentDate() }
});

module.exports = mongoose.model('Medical Rate', rateSchema);
