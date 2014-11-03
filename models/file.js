/*
  File - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var noteSchema = new Schema({
  text: String,
  time_stamp: { type: Date, default: Date.now }
}, { _id: true });

var fileSchema = new Schema({
  attachments: [{ type: mongoose.Schema.ObjectId, ref: 'File' }],
  notes:       [ noteSchema ],
  company:      { type: mongoose.Schema.ObjectId, ref: 'Company', index: true },
  employee:     { type: mongoose.Schema.ObjectId, ref: 'Employee', index: true },
  historyEvent: { type: mongoose.Schema.ObjectId, ref: 'HistoryEvent', index: true },
  creator:      { type: mongoose.Schema.ObjectId, ref: 'User', index: true },

  name:                String,
  electronicSignature: String,
  extension:           { type: String, index: true },
  labels:              [ String ],

  // System
  time_stamp: { type: Date, default: Date.now, index: true }
});

module.exports = createModel('File', fileSchema);
