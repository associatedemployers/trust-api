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
    medical: [{ type: Schema.ObjectId, ref: 'MedicalRate' }],
    dental:  [{ type: Schema.ObjectId, ref: 'DentalRate' }],
    vision:  [{ type: Schema.ObjectId, ref: 'VisionRate' }],
    life:    [{ type: Schema.ObjectId, ref: 'LifeRate' }]
  },

  // Info
  relationship:          String,
  ssn:                   String,
  gender:                String,
  ebmsTerminationCode:   String,
  otherInsuranceCompany: String, // Dependent's Other Health Insurance Company
  memberId:              Number,
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
