/*
  Global Response Handlers
  ---
  Simplifies & standardizes responses
*/

var winston = require('winston'),
    chalk   = require('chalk');

exports.error = {
  res: function ( res, err, thr ) {
    winston.log('debug', err);
    
    if( thr ) {
      res.status(500).send( err );
      winston.log('error', chalk.bgRed( err.stack || err ));
      throw new Error(err);
    } else {
      res.status(400).send( err );
    }
  },
  log: function ( err ) {
    winston.log('error', err);
  }
};

exports.code = {
  unauthorized: function ( res, msg ) {
    res.status(401).json({
      status: 'Unauthorized',
      error: msg || 'You are not authorized to access that resource.'
    });
  },
  notfound: function ( res, msg ) {
    res.status(404).json({
      status: 'Not Found',
      error: msg || 'That resource was not found or is unavailable.'
    });
  },
  notimplemented: function ( res, msg ) {
    res.status(501).json({
      status: 'Not Implemented',
      error: msg || 'This route has not been implemented yet.'
    });
  }
};
