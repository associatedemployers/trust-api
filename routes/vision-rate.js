var express            = require('express'),
    visionRateHandler = require('../handlers/vision-rate');

var sessionMiddleware       = require('../lib/security/middleware/session'),
    authorizationMiddleware = require('../lib/security/middleware/authorization');

module.exports = function (app) {
  var visionRateRouter = express.Router();

  visionRateRouter.use( sessionMiddleware('Session') );
  visionRateRouter.use( authorizationMiddleware({ allow: 'admin' }) );

  visionRateRouter.get('/', visionRateHandler.fetchAll);
  visionRateRouter.get('/:id', visionRateHandler.fetchByID);
  visionRateRouter.post('/', visionRateHandler.create);
  visionRateRouter.put('/:id', visionRateHandler.update);
  visionRateRouter.delete('/:id', visionRateHandler.del);

  app.use('/api/vision-rates', visionRateRouter);
  app.use('/api/visionRates', visionRateRouter);
};
