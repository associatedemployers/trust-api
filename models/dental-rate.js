/*
  Dental Rate - Server Data Model
  ---
  -Should be polymorphic-
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var rateSchema = new Schema({
  // From XML -> DentalRate
  deductible:          String,
  planNumber:          String,
  name:                String,

  // Actual Rates
  employee:            Number,
  employeeAndSpouse:   Number,
  employeeAndChildren: Number,
  family:              Number,

  // Relational
  companies: [{ type: mongoose.Schema.ObjectId, ref: 'Company' }],

  // System
  time_stamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DentalRate', rateSchema);
