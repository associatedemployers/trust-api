/*
  Company - Server Data Model
*/

var mongoose = require('mongoose'),
    Promise  = require('bluebird'), // jshint ignore:line
    Schema   = mongoose.Schema,
    _        = require('lodash');

var createModel = require('./helpers/create-model');

var ticker     = require(process.cwd() + '/lib/ticker/ticker'),
    cryptify   = require('./plugins/cryptify'),
    searchable = require('./plugins/searchable');

var loginSchema = new Schema({
  ip: String,
  time_stamp: { type: Date, default: Date.now }
}, { _id: true });

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

  login: {
    companyId: String,
    email:     String,
    password:  String
  },

  logins: [ loginSchema ],

  automaticEmailNotifications: { type: boolean, default: true },

  // Relational
  medicalRates:      [{ type: mongoose.Schema.ObjectId, ref: 'MedicalRate' }],
  dentalRates:       [{ type: mongoose.Schema.ObjectId, ref: 'DentalRate' }],
  visionRates:       [{ type: mongoose.Schema.ObjectId, ref: 'VisionRate' }],
  employees:         [{ type: mongoose.Schema.ObjectId, ref: 'Employee' }],
  locations:         [{ type: mongoose.Schema.ObjectId, ref: 'Location' }],
  files:             [{ type: mongoose.Schema.ObjectId, ref: 'File' }],
  enrollmentPeriods: [{ type: mongoose.Schema.ObjectId, ref: 'EnrollmentPeriod' }],

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
  removedOn:              Date,

  // System
  time_stamp: { type: Date, default: Date.now, index: true }
});

/**
 * Records a login to the document
 * 
 * @return {Object} Promise
 */
companySchema.methods.recordLogin = function ( ip ) {
  var self = this;

  return new Promise(function ( resolve, reject ) {
    if ( !self.logins ) {
      self.logins = [];
    }

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

companySchema.virtual('lastLogin').get(function () {
  return ( !this.logins || this.logins.length < 1 ) ? null : _.sortBy(this.logins, 'time_stamp')[ 1 ];
});

companySchema = ticker
  .attach( companySchema )
  .plugin(searchable, {
    paths: [
      'name.company',
      'contact.name',
      'contact.phone',
      'contact.fax',
      'address.line1',
      'address.line2',
      'address.city',
      'address.state',
      'address.zipcode'
    ]
  })
  .plugin(cryptify, {
    paths: [ 'login.password' ],
    factor: 11
  });

module.exports = createModel('Company', companySchema);
