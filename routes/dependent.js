var express          = require('express'),
    dependentHandler = require('../handlers/dependent');

module.exports = function ( app ) {
  var dependentRouter = express.Router();

  dependentRouter.get('/', dependentHandler.fetchAll);
  dependentRouter.get('/:id', dependentHandler.fetchByID);
  dependentRouter.post('/', dependentHandler.create);
  dependentRouter.put('/:id', dependentHandler.update);
  dependentRouter.delete('/:id', dependentHandler.del);

  app.use('/api/dependents', dependentRouter);
};
