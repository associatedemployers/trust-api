var parseArgs = require('minimist'),
    winston   = require('winston'),
    chalk     = require('chalk'),
    _         = require('lodash'),
    Promise   = require('bluebird'); // jshint ignore:line

var slog         = require('single-line-log').stdout,
    fileImport   = require('./lib/data-mapping/core/file-import'),
    fileManifest = require('./config/xml-file-manifest'),
    Mapper       = require('./lib/data-mapping/core/mapper');

var commands  = {
  'import-access': _importAccessData,
  'import-files':  _importFiles,
  'import':        _importAll
};

winston.loggers.add('default', {
  transports: [
    new ( winston.transports.Console )({ level: 'debug' })
  ]
});

require('./app').registerModels();

_parseAndRunCommands();

/**
 * Initializes the access import
 * @return {Promise}
 */
function _importAccessData ( files ) {
  if ( typeof files === 'string' ) {
    var filesToImport = files.split(':').map(function ( file ) {
      return _.find( fileManifest, { type: file } );
    }).filter(function ( file ) {
      return _.isObject( file );
    });
  }

  return new Promise(function ( resolve, reject ) {
    var dataMapper = new Mapper({
      freshness: '1 day',
      injectAndNormalize: true
    }).setupFiles( filesToImport || fileManifest );

    dataMapper.connect(function () {
      dataMapper.run(function ( fileObjects ) {
        winston.log('debug', chalk.green('Finished importing access data...'));
        dataMapper.disconnect();
        resolve();
      });
    });
  });
}

/**
 * Initializes a file import
 * @return {Promise}
 */
function _importFiles () {
  return fileImport();
}

/**
 * Runs _importAccessData & _importFiles
 * @return {Promise}
 */
function _importAll () {
  return _importAccessData().then( _importFiles );
}

function _parseAndRunCommands () {
  var args = parseArgs(process.argv.slice(2)),
      ops  = [];

  for ( var arg in args ) {
    var command = commands[ arg ];

    if ( command && typeof command === 'function' ) {
      ops.push( command( args[ arg ] ) );
    }
  }

  Promise.all( ops )
  .then(function () {
    winston.log('info', chalk.bgGreen('Ran', ops.length, 'utilities'));
    process.exit(0);
  })
  .catch(function ( err ) {
    winston.error(chalk.bgRed( err ));
    process.exit(1);
  });
}
