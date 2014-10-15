/*
  Medical Rate - Server Data Model
  ---
  -Should be polymorphic-
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var rateSchema = new Schema({
  // From XML -> MedicalRate
  ebmsNumber:    String,
  planNumber:    String,
  legacyNetwork: String,
  coInsurance:   String,
  deductible:    String,
  name:          String,

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
  plan:    { type: mongoose.Schema.ObjectId, ref: 'MedicalPlan' },

  // System
  time_stamp: { type: Date, default: Date.now }
});

module.exports = createModel('MedicalRate', rateSchema);
