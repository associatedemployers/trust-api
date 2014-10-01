/*
  Company - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var companySchema = new Schema({
  // From XML -> Companies
  name: {
    company: String
  },

  contact: {
    name:  String,
    phone: String,
    fax:   String
  },

  address: {
    line1:   String,
    line2:   String,
    city:    String,
    state:   String,
    zipcode: String
  },

  // Relational
  medicalRates: [{ type: mongoose.Schema.ObjectId, ref: 'MedicalRate' }],
  dentalRates:  [{ type: mongoose.Schema.ObjectId, ref: 'DentalRate' }],
  visionRates:  [{ type: mongoose.Schema.ObjectId, ref: 'VisionRate' }],
  employees:    [{ type: mongoose.Schema.ObjectId, ref: 'Employee' }],
  locations:    [{ type: mongoose.Schema.ObjectId, ref: 'Location' }],

  // Legacy Fields and Flags
  legacyCompanyNumber:     String,
  legacyAemMemberId:       String,
  legacyBrokerId:          String,
  legacyRateTier:          String,
  legacyWaitingPeriod:     String,
  legacySelectCare:        String,
  legacyMinimumHours:      String,
  legacySoleProprietor:    String,
  legacyRetirees:          String,
  legacyLoa:               String,
  legacyContribution:      String,
  legacyNotes:             String,
  legacyWebId:             String,
  legacyWebPassword:       String,
  legacyWebEmail:          String,
  legacyAffiliated:        String,
  legacyCoverLifeIfWaived: String,
  legacyBrightChoicesFlag: String,
  legacyMtChamberFlag:     String,
  legacyWellnessFlag:      String,
  legacyEffectiveMonth:    String,
  legacyPrimaryCo:         String,
  legacyNumberEmployees:   String,

  legacyCompEffectDate:   Date,
  legacyBrokerEffectDate: Date,

  // System
  time_stamp: { type: Date, default: Date.now }
});

module.exports = createModel('Company', companySchema);
