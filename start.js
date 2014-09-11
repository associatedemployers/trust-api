var winston = require('winston');

winston.info('Starting server...');

var express = require('express'),
    app     = require('./index').init(express());

var port = process.env.PORT || 3000;

process.title = 'Trust API - Node.js';

app.listen(port, function () {
  winston.info('Server listening on port', port, '...');
});
