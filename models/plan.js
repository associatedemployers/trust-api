/*
  Medical Plan - Server Data Model
*/

var mongoose =   require('mongoose'),
    Schema =     mongoose.Schema,
    momentDate = require('../utils/moment-date');

var planSchema = new Schema({
  plan: { type: Schema.Types.ObjectId, ref: 'Example' },
  some: String,
  time_stamp: { type: String, default: new momentDate() }
});

module.exports = mongoose.model('MedicalPlan', planSchema);
