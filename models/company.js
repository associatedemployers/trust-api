/*
  Company - Server Data Model
*/

var mongoose =   require('mongoose'),
    Schema =     mongoose.Schema,
    momentDate = require('../utils/moment-date');

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

  // Legacy Fields and Flags
  legacyCompanyNumber:     String,
  legacyAemMemberId:       String,
  legacyBrokerId:          String,
  legacyRateTier:          String,
  legacyCompEffectDate:    String,
  legacyBrokerEffectDate:  String,
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

  // System
  time_stamp: { type: String, default: new momentDate() }
});

module.exports = mongoose.model('Company', companySchema);
