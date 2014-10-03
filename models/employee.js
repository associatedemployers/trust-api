/*
  Medical Rate - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

/*
  Subdoc Schemas
*/
var contactSchema = new Schema({
  type:  String, // home, work, mobile, email
  value: String, // example@example.com
  ext:   String  // 124
});

var noteSchema = new Schema({
  ebms:   Boolean, // Upload this note to EBMS?
  concat: Boolean, // Concatenate this note in an export to EBMS or access?
  text:   String   // Text of the note
});

var beneficiarySchema = new Schema({
  type:     String, // primary or contingent
  name:     String, // John Doe
  relation: String, // Brother
  split:    Number  // Split of benefit ( e.g. 50 = 50% of life benefit ) ( 0-100 )
});

/*
  Doc Schema
*/
var employeeSchema = new Schema({
  // From XML -> Employee
  // Legacy
  legacyRecordNumber:              String,
  legacyCobraTermChoice:           String,
  legacyPreExistingCondition:      String,
  legacyCreditableCoverage:        String,
  legacyRetireeFlag:               String,
  legacyAflacFlag:                 String,
  legacyChangingCompany:           String,
  legacyChangingLocationInCompany: String,
  legacyMarriage:                  String,

  // Pretty Useless Legacy Flags/Fields (Virtuals)
  legacyXNonVolWaivingSpouse:          String,
  legacyXNonVolWaivingDependents:      String,
  legacyXNonVolWaiving:                String,
  legacyXNonVolWaivedSpouseName:       String,
  legacyXNonVolWaivedDependentName:    String,
  legacyXVolDentalWaivedSpouseName:    String,
  legacyXVolDentalWaivedDependentName: String,
  legacyXVolVisionWaivedSpouseName:    String,
  legacyXVolVisionWaivedDependentName: String,

  ebmsNumber:          String,
  memberId:            String, // 943 #
  ebmsTerminationCode: String,
  waived:              Boolean,

  name: {
    first:         String,
    middleInitial: String,
    last:          String,
    suffix:        String
  },

  address: {
    line1:   String,
    line2:   String,
    city:    String,
    state:   String,
    zipcode: String
  },

  // Subdocs
  contactMethods: [ contactSchema ],
  beneficiaries:  [ beneficiarySchema ],
  notes:          [ noteSchema ],

  ssn:           String,
  gender:        String,
  maritalStatus: String,

  dateOfBirth: {
    year:  Number,
    month: Number,
    day:   Number
  },

  // Relational
  company:  { type: mongoose.Schema.ObjectId, ref: 'Company' },
  location: { type: mongoose.Schema.ObjectId, ref: 'Location' }, // Track Employee Location

  // Plans
  //
  // Rationale for arrays of objects containing plan refs:
  // 1) Multiple enrolled plans per employee
  // 2) ---> Options per plan
  // 3) Brevity :D
  // 
  // Populate these paths normally like .populate('plans.medical.plan')
  plans: {
    medical: [{ plan: { type: Schema.ObjectId, ref: 'MedicalRate' }, covering: String }],
    dental:  [{ plan: { type: Schema.ObjectId, ref: 'DentalRate' },  covering: String }],
    vision:  [{ plan: { type: Schema.ObjectId, ref: 'VisionRate' },  covering: String }],
    life:    [{ plan: { type: Schema.ObjectId, ref: 'LifeRate' },    covering: String }]
  },

  // System DTs
  legacyClientEmploymentDate:  Date,
  legacyClientTerminationDate: Date,
  legacyInitialDateSent:       Date,
  legacyChangeSent:            Date,
  legacyTerminationSent:       Date,
  legacyTrapTermination:       Date,
  legacyCobraStartDate:        Date,
  legacyCobraTerminationDate:  Date,

  time_stamp: { type: Date, default: Date.now }
});

// Attach some mongoose hooks
employeeSchema = require(process.cwd() + '/lib/ticker/ticker').attach( employeeSchema );

module.exports = createModel('Employee', employeeSchema);
