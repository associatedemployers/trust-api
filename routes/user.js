var express      = require('express'),
    userHandler  = require('../handlers/user'),
    loginHandler = require('../handlers/login');

module.exports = function ( app ) {
  var userRouter        = express.Router(),
      userUtilityRouter = express.Router();

  userRouter.get('/', userHandler.fetchAll);
  userRouter.get('/:id', userHandler.fetchByID);
  userRouter.post('/', userHandler.create);
  userRouter.put('/:id', userHandler.update);
  userRouter.delete('/:id', userHandler.del);

  userUtilityRouter.post('/login', loginHandler.login);

  app.use('/api/users', userRouter);
  app.use('/api/user', userUtilityRouter);
};
