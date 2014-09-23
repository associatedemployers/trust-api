/*
  History Event - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var historyEventSchema = new Schema({
  description:  String,           // Calculated in Ticker.tick
  eventFlags:   [ String ],       // Array of Flag Strings, visual

  delta:        Array,            // Deep-diff calculation
  deltaTypes:   [ String ],       // Deep-diff type map, visual ( ex. N->Added )

  documents: {
    updated:  Object,             // lhs
    previous: Object              // rhs
  },

  documentModel: String,          // Document modelName
  documentId:    Schema.ObjectId, // Document's ObjectId
  updater:       Schema.ObjectId, // ObjectId of the user updating the document

  // System
  time_stamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HistoryEvent', historyEventSchema);
