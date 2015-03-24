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
  ebmsNumbers:         [ String ],
  legacyCompanyNumber: String,
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
  time_stamp:          Date,
});

module.exports = createModel('Location', locationSchema);
