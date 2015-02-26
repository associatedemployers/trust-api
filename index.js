var cluster = require('cluster'),
    os      = require('os'),
    getConfig = require('./lib/utilities/get-config');

var express = require('express'),
    winston  = require('winston'),
    chalk    = require('chalk'),
    logLevel = ( process.env.environment === 'development' || process.env.environment === 'dev' ) ? 'debug' : 'info';

winston.loggers.add('default', {
  transports: [
    new ( winston.transports.Console )({ level: logLevel })
  ]
});

var port       = getConfig('port') || 3000,
    socketPort = getConfig('socketPort') || 3001;

if( cluster.isMaster ) {
  var workers = [];

  os.cpus().forEach(function ( cpu, cpuIndex ) {
    function boot ( i ) {
      workers[ i ] = cluster.fork();

      workers[ i ].on('exit', function () {
        winston.error(chalk.bgRed('Worker died. :( RIP Worker', i, '. Rebooting...'));
        boot(i);
      });
    }

    boot( cpuIndex );
  });

  var SocketServer = require('./lib/socket/server'),
      server       = require('http').Server(express()),
      socketServer = new SocketServer(server);

  server.listen(socketPort, function () {
    winston.info(chalk.dim('Socket Server listening on port:', port));
  });
} else {
  winston.info(chalk.dim('[', cluster.worker.id, '] Starting worker ...'));

  process.title = 'Trust API Worker - ' + cluster.worker.id + ' - Node.js';

  var app = require('./app');

  app.registerModels();

  app.init(express()).listen(port, function () {
    winston.info(chalk.dim('[', cluster.worker.id, '] Worker listening on port:', port));
  });
}
