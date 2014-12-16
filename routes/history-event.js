var express        = require('express'),
    historyEventHandler = require('../handlers/history-event');

var sessionMiddleware       = require('../lib/security/middleware/session'),
    authorizationMiddleware = require('../lib/security/middleware/authorization');

module.exports = function (app) {
  var historyEventRouter = express.Router();

  historyEventRouter.use( sessionMiddleware('Session') );
  historyEventRouter.use( authorizationMiddleware({ allow: 'admin' }) );

  historyEventRouter.get('/', historyEventHandler.fetchAll);
  historyEventRouter.get('/:id', historyEventHandler.fetchByID);
  historyEventRouter.post('/', historyEventHandler.create);
  historyEventRouter.put('/:id', historyEventHandler.update);
  historyEventRouter.delete('/:id', historyEventHandler.del);
  
  app.use('/api/history-events', historyEventRouter);
};
