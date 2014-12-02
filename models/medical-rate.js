/*
  Medical Rate - Server Data Model
  ---
  -Should be polymorphic-
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model'),
    searchable  = require('./plugins/searchable');

var rateSchema = new Schema({
  // From XML -> MedicalRate
  ebmsNumber:    String,
  planNumber:    String,
  legacyNetwork: String,
  coInsurance:   String,
  deductible:    Number,
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

rateSchema.plugin(searchable, {
  paths: [
    'planNumber',
    'ebmsNumber',
    'name',
    'deductible'
  ]
});

module.exports = createModel('MedicalRate', rateSchema);
