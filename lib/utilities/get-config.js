var winston   = require('winston'),
    appConfig = require(process.cwd() + '/config/app-config');

if ( !appConfig ) {
  winston.error('No app-config.json.');
}

module.exports = getConfig;

/**
 * Gets parameter from config with respect to environment
 * @param  {String} key Parameter key
 * @return {}           Parameter value
 */
function getConfig ( key ) {
  var env = process.env.environment,
      def = appConfig[ key ];

  return ( env && appConfig[ env ] && appConfig[ env ][ key ] ) ? appConfig[ env ][ key ] : def;
}
