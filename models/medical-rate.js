/*
  Medical Rate - Server Data Model
*/

var mongoose =   require('mongoose'),
    Schema =     mongoose.Schema,
    momentDate = require('../lib/utilities/moment-date');

var rateSchema = new Schema({
  // From XML -> MedicalRate
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

  legacyOldEmployeeRate:                   String,
  legacyOldEmployeeAndSpouseRate:          String,
  legacyOldEmployeeAndChildrenRate:        String,
  legacyOldFamilyRate:                     String,
  legacyRateChangeEmployeeRate:            String,
  legacyRateChangeEmployeeAndSpouseRate:   String,
  legacyRateChangeEmployeeAndChildrenRate: String,
  legacyRateChangeFamilyRate:              String,

  // Relational
  company: { type: mongoose.Schema.ObjectId, ref: 'Company' },

  // System
  time_stamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalRate', rateSchema);
