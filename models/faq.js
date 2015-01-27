/*
  Faq (Frequently Asked Question) - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel   = require('./helpers/create-model'),
    searchable    = require('./plugins/searchable'),
    autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize( mongoose.connection );

var faqSchema = new Schema({
  faqId:    Number,
  question: String,
  answer:   String,

  time_stamp: { type: Date, default: Date.now }
});

faqSchema.plugin(searchable, {
  paths: [
    'faqId',
    'question',
    'answer'
  ]
}).plugin(autoIncrement.plugin, { model: 'Faq', field: 'faqId' });

module.exports = createModel('Faq', faqSchema);
