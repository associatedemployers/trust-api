var cwd = process.cwd();

var express                = require('express'),
    employeeHandler        = require(cwd + '/handlers/_company/employee'),
    sessionMiddleware      = require(cwd + '/lib/security/middleware/session'),
    clientParserMiddleware = require(cwd + '/lib/security/middleware/client-parser');

module.exports = function ( app ) {
  var employeeRouter = express.Router();
  employeeRouter.use( sessionMiddleware('Session') );
  employeeRouter.get('/', employeeHandler.fetchAll);

  app.use('/client-api/employees', employeeRouter);
};
