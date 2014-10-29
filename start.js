process.title = 'Trust API - Node.js';

var winston  = require('winston'),
    chalk    = require('chalk'),
    logLevel = ( process.env.environment === 'development' || process.env.environment === 'dev' ) ? 'debug' : 'info';

winston.loggers.add('default', {
  transports: [
    new ( winston.transports.Console )({ level: logLevel })
  ]
});

winston = winston.loggers.get('default');

winston.info(chalk.dim('Starting server...'));

var express = require('express'),
    app     = require('./index').init(express()),
    port = process.env.port || 3000;

app.listen(port, function () {
  winston.info(chalk.dim('Server listening on port', port, '...'));
});
