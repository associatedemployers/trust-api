var express     = require('express'),
    userHandler = require('../handlers/user');

module.exports = function ( app ) {
  var userRouter = express.Router();

  userRouter.get('/', userHandler.fetchAll);
  userRouter.get('/:id', userHandler.fetchByID);
  userRouter.post('/', userHandler.create);
  userRouter.put('/:id', userHandler.update);
  userRouter.delete('/:id', userHandler.del);

  app.use('/api/users', userRouter);
};
