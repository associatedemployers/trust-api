var express           = require('express'),
    permissionHandler = require('../handlers/permission'),
    sessionMiddleware = require('../lib/security/middleware/session');

module.exports = function (app) {
  var permissionRouter = express.Router();

  permissionRouter.use( sessionMiddleware('Session') );

  permissionRouter.get('/', permissionHandler.fetchAll);
  permissionRouter.post('/', permissionHandler.create);
  permissionRouter.put('/:id', permissionHandler.update);
  permissionRouter.delete('/:id', permissionHandler.del);

  app.use('/api/permissions', permissionRouter);
};
