var cwd = process.cwd();

var express                = require('express'),
    dependentHandler       = require(cwd + '/handlers/_employee/dependent'),
    sessionMiddleware      = require(cwd + '/lib/security/middleware/session'),
    clientParserMiddleware = require(cwd + '/lib/security/middleware/client-parser');

module.exports = function ( app ) {
  var dependentRouter        = express.Router(),
      dependentUtilityRouter = express.Router();

  dependentRouter.use( sessionMiddleware('Session') );
  dependentRouter.use( clientParserMiddleware('id', 'employee') );

  dependentRouter.get('/:id', dependentHandler.fetchByID);
  dependentRouter.put('/:id', dependentHandler.update);
  dependentRouter.delete('/:id', dependentHandler.del);
  
  app.use('/client-api/dependents', dependentRouter);
};
