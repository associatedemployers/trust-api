var cwd = process.cwd();

var express                = require('express'),
    locationHandler        = require(cwd + '/handlers/_company/location'),
    sessionMiddleware      = require(cwd + '/lib/security/middleware/session'),
    clientParserMiddleware = require(cwd + '/lib/security/middleware/client-parser');

module.exports = function ( app ) {
  var locationRouter = express.Router();

  locationRouter.use( sessionMiddleware('Session') );
  locationRouter.get('/', locationHandler.fetchAll);

  app.use('/client-api/locations', locationRouter);
};
