/*
  Company - Server Data Model
  ---
  Temporary!
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var companyPlanSchema = new Schema({
  legacyEbmsNumber:  String,
  legacyPlanNumber:  String,
  legacyPlanType:    String,
  legacyDescription: String,
  legacyNetwork:     String,
});

module.exports = mongoose.model('CompanyPlan', companyPlanSchema);
