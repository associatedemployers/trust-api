/*
  Employee - Server Data Model
*/

var mongoose = require('mongoose'),
    Promise  = require('bluebird'), // jshint ignore:line
    Schema   = mongoose.Schema,
    _        = require('lodash');

var createModel = require('./helpers/create-model');

var ticker     = require(process.cwd() + '/lib/ticker/ticker'),
    cryptify   = require('mongoose-cryptify'),
    searchable = require('./plugins/searchable');

var MedicalPlan = require('./medical-plan');

/*
  Subdoc Schemas
*/
var contactSchema = new Schema({
  type:  String, // home, work, mobile, email
  value: String, // example@example.com
  ext:   String, // 124
  time_stamp: { type: Date, default: Date.now }
}, { _id: true });

var noteSchema = new Schema({
  ebms:   Boolean, // Upload this note to EBMS?
  concat: Boolean, // Concatenate this note in an export to EBMS or access?
  text:   String,  // Text of the note
  time_stamp: { type: Date, default: Date.now }
}, { _id: true });

var beneficiarySchema = new Schema({
  type:     String, // primary or contingent
  name:     String, // John Doe
  relation: String, // Brother
  split: { type: Number, min: 1, max: 100, default: 100 }, // Split of benefit ( e.g. 50 = 50% of life benefit ) ( 1-100 )
  time_stamp: { type: Date, default: Date.now }
}, { _id: true });

var loginSchema = new Schema({
  ip: String,
  time_stamp: { type: Date, default: Date.now }
}, { _id: true });

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
  memberId:            Number, // 943 #
  ebmsTerminationCode: String,
  waived:              Boolean,
  enrolled:            { type: Boolean, default: false },

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
  logins:         [ loginSchema ],

  ssn:           String,
  ssnDc:         Number, // Temporary field while enrolling to be able to find the record until memberid is gen'd
  gender:        String,
  maritalStatus: String,

  dateOfBirth: Date,

  // Relational
  company:    { type: mongoose.Schema.ObjectId, ref: 'Company' },
  location:   { type: mongoose.Schema.ObjectId, ref: 'Location' },  // Track Employee Location
  dependents: [{ type: mongoose.Schema.ObjectId, ref: 'Dependent' }],
  files:      [{ type: mongoose.Schema.ObjectId, ref: 'File' }],

  // Plan/Rates
  medicalPlan: { type: mongoose.Schema.ObjectId, ref: 'MedicalPlan' },
  plans: {
    medical: [{ type: Schema.ObjectId, ref: 'MedicalRate' }],
    dental:  [{ type: Schema.ObjectId, ref: 'DentalRate' }],
    vision:  [{ type: Schema.ObjectId, ref: 'VisionRate' }],
    life:    [{ type: Schema.ObjectId, ref: 'LifeRate' }]
  },
  // Plan Meta
  planOptions: {
    medical: { covers: String },
    dental:  { covers: String },
    vision:  { covers: String },
    life:    { covers: String },
  },

  // System DTs
  legacyClientEmploymentDate:  { type: Date, index: true },
  legacyClientTerminationDate: { type: Date, index: true },
  legacyInitialDateSent:       Date,
  legacyChangeSent:            Date,
  legacyTerminationSent:       Date,
  legacyTrapTermination:       Date,
  legacyCobraStartDate:        Date,
  legacyCobraTerminationDate:  Date,

  time_stamp: { type: Date, default: Date.now, index: true }
});

/**
 * Records a login to the document
 * 
 * @return {Object} Promise
 */
employeeSchema.methods.recordLogin = function ( ip ) {
  var self = this;

  return new Promise(function ( resolve, reject ) {
    self.logins.push({
      ip: ip
    });

    self.save(function ( err, result ) {
      if ( err ) {
        return reject( err );
      }

      resolve( result.logins );
    });
  });
};

employeeSchema.pre('save', function ( next ) {
  var self = this;

  this.constructor.populate(this, { path: 'plans.medical', select: 'plan' }).then(function ( populatedRecord ) {
    var rate = populatedRecord.plans.medical[0];

    if( !rate || !rate.plan ) {
      return next();
    }

    MedicalPlan.findById(rate.plan, function ( err, plan ) {
      if( err ) return next( err );

      if( plan ) {
        self.medicalPlan = plan._id;
      }

      next.call( self );
    });
  }, next); // Next will throw the error
});

employeeSchema.virtual('lastLogin').get(function () {
  return ( !this.logins || this.logins.length < 1 ) ? null : _.sortBy(this.logins, 'time_stamp')[ 1 ];
});

employeeSchema = ticker
  .attach( employeeSchema )
  .plugin(searchable, {
    paths: [
      'name.first',
      'name.last',
      'name.middleInitial',
      'name.suffix',
      'address.line1',
      'address.line2',
      'address.city',
      'address.state',
      'address.zipcode',
      'notes.$.text',
      'beneficiaries.$.name',
      'contact.$.value'
    ]
  });

module.exports = createModel('Employee', employeeSchema);
