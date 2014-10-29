var bodyParser = require('body-parser'),
    express    = require('express'),
    globSync   = require('glob').sync,
    routes     = globSync('./routes/**/*.js', { cwd: __dirname }).map(require),
    winston    = require('winston').loggers.get('default'),
    chalk      = require('chalk'),
    morgan     = require('morgan');

require('./config/mongoose').init();

exports.init = function ( app ) {
  winston.debug(chalk.dim('Setting up middleware...'));
  app.use( morgan('dev') );
  app.use( bodyParser.json() );

  app.use( bodyParser.urlencoded({
    extended: true
  }) );

  winston.debug(chalk.dim('Getting routes...'));

  routes.forEach(function(route) {
    route(app);
  });

  winston.debug(chalk.dim('Setting server options...'));

  app.enable('trust proxy');
  app.set('x-powered-by', 'Associated Employers');

  registerModels();

  return app;
};

exports.registerModels = registerModels;

function registerModels () {
  winston.debug(chalk.dim('Registering models...'));
  globSync('./models/**/*.js').map(require);
}
