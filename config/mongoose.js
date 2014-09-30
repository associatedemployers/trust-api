/*
  Mongoose configuration
*/

var mongoose = require('mongoose'),
    winston  = require('winston');

var connection;

exports.init = function ( db, address, singleton ) {
  // Defaults
  db      = db      || 'trust';
  address = address || 'localhost';

  if( !connection && !singleton ) {
    mongoose.connection.close();

    winston.info('Connecting to', db, 'db...');

    connection = mongoose.connect(address, db);

    return connection;

  } else if( singleton ) {

    winston.info('Singleton connection to', db, 'db...');

    return mongoose.connect(address, db);

  } else {

    return connection;

  }
};
