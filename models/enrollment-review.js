/*
  Enrollment Review (enrollment review request) - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var noteSchema = new Schema({
  text: String,
  time_stamp: { type: Date, default: Date.now }
}, { _id: true });

var enrollmentReviewSchema = new Schema({
  attachments: [{ type: mongoose.Schema.ObjectId, ref: 'File' }],
  employee:    { type: mongoose.Schema.ObjectId, ref: 'Employee', index: true },
  notes:       [ noteSchema ],
  approved:    Boolean,
  eventType:   String,
  eventDate:   Date,

  // System
  time_stamp: { type: Date, default: Date.now, index: true }
});

module.exports = createModel('EnrollmentReview', enrollmentReviewSchema);
