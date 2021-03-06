var cwd = process.cwd();

var express                = require('express'),
    employeeHandler        = require(cwd + '/handlers/employee'),
    employeeUtilityHandler = require(cwd + '/handlers/employee-utilities');

var sessionMiddleware       = require(cwd + '/lib/security/middleware/session'),
    authorizationMiddleware = require(cwd + '/lib/security/middleware/authorization');

module.exports = function ( app ) {
  var employeeRouter        = express.Router(),
      employeeUtilityRouter = express.Router();

  employeeRouter.use( sessionMiddleware('Session') );
  employeeRouter.use( authorizationMiddleware({ allow: 'admin' }) );

  employeeRouter.get('/', employeeHandler.fetchAll);
  employeeRouter.get('/:id', employeeHandler.fetchByID);
  employeeRouter.post('/', employeeHandler.create);
  employeeRouter.put('/:id', employeeHandler.update);
  employeeRouter.delete('/:id', employeeHandler.del);
  
  app.use('/api/employees', employeeRouter);

  employeeUtilityRouter.get('/decrypt-ssn', employeeUtilityHandler.decryptSSN);

  app.use('/api/employee', employeeUtilityRouter);
};
