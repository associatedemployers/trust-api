var cwd = process.cwd();

var express                = require('express'),
    fileHandler            = require(cwd + '/handlers/_employee/file'),
    sessionMiddleware      = require(cwd + '/lib/security/middleware/session'),
    clientParserMiddleware = require(cwd + '/lib/security/middleware/client-parser');

module.exports = function ( app ) {
  var fileRouter   = express.Router(),
      clientParser = clientParserMiddleware('id', 'files');

  fileRouter.use( sessionMiddleware('Session') );

  fileRouter.get('/:id', clientParser, fileHandler.fetchByID);
  fileRouter.post('/', fileHandler.upload);
  fileRouter.put('/:id', clientParser, fileHandler.update);
  fileRouter.delete('/:id', clientParser, fileHandler.del);

  app.use('/client-api/files', fileRouter);
};
