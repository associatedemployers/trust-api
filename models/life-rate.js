/*
  Life Rate - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var rateSchema = new Schema({
  // From XML -> LifeRate
  planNumber: String,
  name:       String,

  coverage: Number,
  rate:     Number,

  ageGroup: {
    start: Number,
    end:   Number
  },

  coversSpouse:     { type: Boolean, default: false },
  coversEmployee:   { type: Boolean, default: false },
  coversDependents: { type: Boolean, default: false },

  // Relational
  companies: [{ type: mongoose.Schema.ObjectId, ref: 'Company' }],

  // System
  time_stamp: { type: Date, default: Date.now }
});

module.exports = createModel('LifeRate', rateSchema);
