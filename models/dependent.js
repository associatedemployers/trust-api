/*
  Dependent - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

// Doc Schema
var dependentSchema = new Schema({
  name: {
    first:         String,
    middleInitial: String,
    last:          String,
    suffix:        String
  },

  // Relational
  employee: { type: Schema.ObjectId, ref: 'Employee' },
  plans: {
    medical: [{ plan: { type: Schema.ObjectId, ref: 'MedicalRate' }, covering: String }],
    dental:  [{ plan: { type: Schema.ObjectId, ref: 'DentalRate' },  covering: String }],
    vision:  [{ plan: { type: Schema.ObjectId, ref: 'VisionRate' },  covering: String }],
    life:    [{ plan: { type: Schema.ObjectId, ref: 'LifeRate' },    covering: String }]
  },

  // Info
  relationship:          String,
  ssn:                   String,
  gender:                String,
  ebmsTerminationCode:   String,
  otherInsuranceCompany: String, // Dependent's Other Health Insurance Company
  memberId:              String,
  legacyId:              String,

  // Legacy Fields
  legacyPreExistingLength:          Number,  // Pre-existing condition length
  legacyPreExistingCertificate:     Boolean, // Pre-existing condition cert.
  legacyPreviousMedical:            Boolean, // Medical coverage previous to term date
  legacyMedicalEnrollment:          Boolean,
  legacyVoluntaryEnrollment:        Boolean,
  legacySupplementalLifeEnrollment: Boolean,
  legacyOtherHealthInsurance:       Boolean,
  legacyHasPaperwork:               Boolean,

  // DTs
  legacyEffectiveDate:   Date,
  legacyTerminationDate: Date,
  legacyInitialDateSent: Date,
  legacyChangeSent:      Date,
  legacyTerminationSent: Date,
  dateOfBirth:           Date,

  time_stamp: { type: Date, default: Date.now }
});

// Attach Ticker hooks
dependentSchema = require(process.cwd() + '/lib/ticker/ticker').attach( dependentSchema );

module.exports = createModel('Dependent', dependentSchema);
