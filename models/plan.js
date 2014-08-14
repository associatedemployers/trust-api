/*
  Medical Plan - Server Data Model
*/

var mongoose =   require('mongoose'),
    Schema =     mongoose.Schema,
    momentDate = require('../utils/moment-date');

var planSchema = new Schema({
  // From XML -> Medical Plan Key
  name:              String,
  legacyKey:         String,
  legacyDescription: String,
  ebmsIbeCode:       String,
  ebmsIbeCode2:      String,
  ebmsClmCode:       String,
  legacyGrouping:    String,
  legacyOrder:       String,
  legacyActive:      String
});

module.exports = mongoose.model('MedicalPlan', planSchema);
