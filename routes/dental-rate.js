var express            = require('express'),
    dentalRateHandler = require('../handlers/dental-rate');

var sessionMiddleware       = require('../lib/security/middleware/session'),
    authorizationMiddleware = require('../lib/security/middleware/authorization');

module.exports = function (app) {
  var dentalRateRouter = express.Router();

  dentalRateRouter.use( sessionMiddleware('Session') );
  dentalRateRouter.use( authorizationMiddleware({ allow: 'admin' }) );

  dentalRateRouter.get('/', dentalRateHandler.fetchAll);
  dentalRateRouter.get('/:id', dentalRateHandler.fetchByID);
  dentalRateRouter.post('/', dentalRateHandler.create);
  dentalRateRouter.put('/:id', dentalRateHandler.update);
  dentalRateRouter.delete('/:id', dentalRateHandler.del);

  app.use('/api/dental-rates', dentalRateRouter);
  app.use('/api/dentalRates', dentalRateRouter);
};
