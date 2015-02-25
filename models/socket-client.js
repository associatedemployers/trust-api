/*
  Socket Client - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var socketClientSchema = new Schema({
  ip:         String,
  employee:   { type: Schema.ObjectId, ref: 'Employee' },
  time_stamp: { type: Date, default: Date.now }
});

module.exports = createModel('SocketClient', socketClientSchema);
