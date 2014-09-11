/*
  Company - Server Data Model
  ---
  Temporary for xml injection!
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var companyPlanSchema = new Schema({
  legacyEbmsNumber:  Number,
  legacyPlanNumber:  String,
  legacyPlanType:    String,
  legacyDescription: String,
  legacyNetwork:     String,

  company: { type: mongoose.Schema.ObjectId, ref: 'Company' }
});

module.exports = mongoose.model('CompanyPlan', companyPlanSchema);
