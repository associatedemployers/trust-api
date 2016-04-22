var express            = require('express'),
    userHandler        = require('../handlers/user'),
    userUtilityHandler = require('../handlers/user-utilities'),
    loginHandler       = require('../handlers/login');

var sessionMiddleware       = require('../lib/security/middleware/session'),
    authorizationMiddleware = require('../lib/security/middleware/authorization');

module.exports = function ( app ) {
  var userRouter        = express.Router(),
      userUtilityRouter = express.Router();

  userRouter.use( sessionMiddleware('Session', true) );
  userRouter.use( authorizationMiddleware({ allow: 'admin', authorizeMethods: [ 'post', 'put', 'delete' ] }) );

  userRouter.get('/', userHandler.fetchAll);
  userRouter.get('/:id', userHandler.fetchByID);
  userRouter.post('/', userHandler.create);
  userRouter.put('/:id', userHandler.update);
  userRouter.delete('/:id', userHandler.del);

  userUtilityRouter.post('/login', loginHandler.login);

  userUtilityRouter.get('/verify/:id', userUtilityHandler.fetchId, userUtilityHandler.verifyLink);
  userUtilityRouter.post('/verify/:id', userUtilityHandler.fetchId, userUtilityHandler.verifyAccount);

  app.use('/api/users', userRouter);
  app.use('/api/user', userUtilityRouter);
};
