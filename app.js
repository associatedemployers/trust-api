var bodyParser = require('body-parser'),
    express    = require('express'),
    globSync   = require('glob').sync,
    routes     = globSync('./routes/**/*.js', { cwd: __dirname }).map(require),
    cluster    = require('cluster'),
    winston    = require('winston').loggers.get('default'),
    chalk      = require('chalk'),
    morgan     = require('morgan');

require('./config/mongoose').init();

exports.init = function ( app ) {
  winston.debug(chalk.dim('Setting server options...'));

  app.enable('trust proxy');
  app.set('x-powered-by', 'Associated Employers');
  
  if( cluster.worker ) {
    app.set('worker', cluster.worker.id);
  }

  winston.debug(chalk.dim('Setting up middleware...'));

  var logRoute = ( process.env.environment === 'test' ) ? process.env.verboseLogging : true;

  if( logRoute ) {
    app.use( morgan('dev') );
  }

  app.use( bodyParser.json() );

  app.use(bodyParser.urlencoded({
    extended: true
  }));

  app.use(function ( req, res, next ) {
    if( app.settings.worker ) {
      winston.debug(chalk.dim('Request served by worker', app.settings.worker));
    }

    next();
  });

  winston.debug(chalk.dim('Getting routes...'));

  routes.forEach(function(route) {
    route(app);
  });

  registerModels();

  return app;
};

exports.registerModels = registerModels;

function registerModels () {
  winston.debug(chalk.dim('Registering models...'));
  globSync('./models/**/*.js').map(require);
}
