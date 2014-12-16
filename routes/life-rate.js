var express            = require('express'),
    lifeRateHandler = require('../handlers/life-rate');

var sessionMiddleware       = require('../lib/security/middleware/session'),
    authorizationMiddleware = require('../lib/security/middleware/authorization');

module.exports = function (app) {
  var lifeRateRouter = express.Router();

  lifeRateRouter.use( sessionMiddleware('Session') );
  lifeRateRouter.use( authorizationMiddleware({ allow: 'admin' }) );

  lifeRateRouter.get('/', lifeRateHandler.fetchAll);
  lifeRateRouter.get('/:id', lifeRateHandler.fetchByID);
  lifeRateRouter.post('/', lifeRateHandler.create);
  lifeRateRouter.put('/:id', lifeRateHandler.update);
  lifeRateRouter.delete('/:id', lifeRateHandler.del);

  app.use('/api/life-rates', lifeRateRouter);
  app.use('/api/lifeRates', lifeRateRouter);
};
