/*
  Enrollment Period - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var enrollmentPeriodSchema = new Schema({
  start: Date,
  end:   Date,
  super: Boolean,

  company: { type: Schema.ObjectId, ref: 'Company' },

  time_stamp: { type: Date, default: Date.now }
});

module.exports = createModel('EnrollmentPeriod', enrollmentPeriodSchema);
