var express               = require('express'),
    permissionHandler     = require('../handlers/permission'),
    userPermissionHandler = require('../handlers/user-permission');

var sessionMiddleware       = require('../lib/security/middleware/session'),
    authorizationMiddleware = require('../lib/security/middleware/authorization');

module.exports = function (app) {
  var permissionRouter     = express.Router(),
      userPermissionRouter = express.Router();

  permissionRouter.use( sessionMiddleware('Session') );
  userPermissionRouter.use( sessionMiddleware('Session') );
  userPermissionRouter.use( authorizationMiddleware({ allow: 'admin' }) );

  permissionRouter.get('/', permissionHandler.fetchAll);
  permissionRouter.post('/', permissionHandler.create);
  permissionRouter.put('/:id', permissionHandler.update);
  permissionRouter.delete('/:id', permissionHandler.del);

  userPermissionRouter.get('/', userPermissionHandler.fetchAll);
  userPermissionRouter.get('/:id', userPermissionHandler.fetchById);
  userPermissionRouter.post('/', userPermissionHandler.create);
  userPermissionRouter.put('/:id', userPermissionHandler.update);

  app.use('/api/permissions', permissionRouter);
  app.use('/api/user-permissions', userPermissionRouter);
};
