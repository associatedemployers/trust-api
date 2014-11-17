var express        = require('express'),
    permissionHandler = require('../handlers/permission');

module.exports = function (app) {
  var permissionRouter = express.Router();

  permissionRouter.get('/', permissionHandler.fetchAll);
  permissionRouter.get('/:id', permissionHandler.fetchByID);

  permissionRouter.post('/', permissionHandler.create);

  permissionRouter.put('/:id', permissionHandler.update);

  permissionRouter.delete('/:id', permissionHandler.del);
  
  app.use('/api/permissions', permissionRouter);
};
