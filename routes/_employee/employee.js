var cwd = process.cwd();

var express                = require('express'),
    employeeHandler        = require(cwd + '/handlers/employee');

var sessionMiddleware      = require(cwd + '/lib/security/middleware/session'),
    clientParserMiddleware = require(cwd + '/lib/security/middleware/client-parser');

module.exports = function ( app ) {
  var employeeRouter        = express.Router(),
      employeeUtilityRouter = express.Router();

  employeeRouter.use( sessionMiddleware('Session') );
  employeeRouter.use( clientParserMiddleware('id', '_id') );

  employeeRouter.get('/:id', employeeHandler.fetchByID);
  employeeRouter.put('/:id', employeeHandler.update);
  employeeRouter.delete('/:id', employeeHandler.del);
  
  app.use('/client-api/employees', employeeRouter);
};
