/*
  Medical Plan - Server Data Model
*/

var mongoose   = require('mongoose'),
    Schema     = mongoose.Schema,
    momentDate = require('../lib/utilities/moment-date');

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
  legacyActive:      String,

  // System
  time_stamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalPlan', planSchema);
