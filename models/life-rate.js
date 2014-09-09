/*
  Life Rate - Server Data Model
  ---
  -Should be polymorphic-
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var rateSchema = new Schema({
  // From XML -> LifeRate
  planNumber: String,
  name:       String,

  coverage: Number,
  rate:     Number,

  ageGroup: {
    start: Number,
    end: Number
  },

  // Relational
  companies: [{ type: mongoose.Schema.ObjectId, ref: 'Company' }],

  // System
  time_stamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LifeRate', rateSchema);
