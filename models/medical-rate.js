/*
  Medical Rate - Server Data Model
*/

var mongoose =   require('mongoose'),
    Schema =     mongoose.Schema,
    momentDate = require('../utils/moment-date');

var rateSchema = new Schema({
  // From XML -> MedicalRate
  legacyCompanyNumber: String,
  ebmsNumber:          String,
  planNumber:          String,
  legacyNetwork:       String,
  coInsurance:         String,
  deductible:          String,
  legacyDescription:   String,

  // Actual Rates
  employee:            Number,
  employeeAndSpouse:   Number,
  employeeAndChildren: Number,
  family:              Number,

  // Relational
  company: { type: mongoose.Schema.ObjectId, ref: 'Company' },

  // System
  time_stamp: { type: String, default: new momentDate() }
});

module.exports = mongoose.model('MedicalRate', rateSchema);
