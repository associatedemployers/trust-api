/*
  Mongoose configuration
*/

var mongoose = require('mongoose'),
    winston  = require('winston').loggers.get('default'),
    chalk    = require('chalk');

var connection;

mongoose.Promise = require('bluebird');

exports.init = function ( db, address, singleton ) {
  var _db = process.env.environment === 'test' ? 'trusttest' : db ? db : 'trust',
      _address = address || 'localhost';

  if( !connection && !singleton ) {
    mongoose.connection.close();

    winston.debug(chalk.dim('Connecting to', _db, 'db...'));

    connection = mongoose.connect(_address, _db);

    return connection;

  } else if( singleton ) {
    winston.debug(chalk.dim('Singleton connection to', _db, 'db...'));

    return mongoose.createConnection(_address + '/' + _db);
  } else {
    winston.debug(chalk.dim('Returning existing connection'));

    return connection;
  }
};
