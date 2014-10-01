/*
  Company - Server Data Model
  ---
  Temporary for xml injection!
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var companyPlanSchema = new Schema({
  legacyEbmsNumber:  String,
  legacyPlanNumber:  String,
  legacyPlanType:    String,
  legacyDescription: String,
  legacyNetwork:     String,

  company: { type: mongoose.Schema.ObjectId, ref: 'Company' }
});

module.exports = createModel('CompanyPlan', companyPlanSchema);
