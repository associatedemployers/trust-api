var express          = require('express'),
    dependentHandler = require('../handlers/dependent');

var sessionMiddleware       = require('../lib/security/middleware/session'),
    authorizationMiddleware = require('../lib/security/middleware/authorization');

module.exports = function ( app ) {
  var dependentRouter = express.Router();

  dependentRouter.use( sessionMiddleware('Session') );
  dependentRouter.use( authorizationMiddleware({ allow: 'admin' }) );

  dependentRouter.get('/', dependentHandler.fetchAll);
  dependentRouter.get('/:id', dependentHandler.fetchByID);
  dependentRouter.post('/', dependentHandler.create);
  dependentRouter.put('/:id', dependentHandler.update);
  dependentRouter.delete('/:id', dependentHandler.del);

  app.use('/api/dependents', dependentRouter);
};
