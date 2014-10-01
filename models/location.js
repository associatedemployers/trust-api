/*
  Location - Server Data Model
  ---
  Can be used by company & employee
  for tracking physical locations
*/
var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var locationSchema = new Schema({
  ebmsNumber:          String,
  legacyCompanyNumber: String,
  legacyCompanyName:   String, // Don't use this
  soleProprietorship:  Boolean,
  embeddedDeductible:  Boolean,
  legacyInactive:      Boolean,

  address: {
   line1:   String,
   line2:   String,
   city:    String,
   state:   String,
   zipcode: String,
  },
  
  contact: {
   phone: String,
   fax:   String,
  },

  company:   { type: mongoose.Schema.ObjectId, ref: 'Company' },
  employees: [{ type: mongoose.Schema.ObjectId, ref: 'Employee' }],

  legacyEffectiveDate: Date,
  time_stamp:          String,
});

module.exports = createModel('Location', locationSchema);
