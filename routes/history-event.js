var express        = require('express'),
    historyEventHandler = require('../handlers/history-event');

module.exports = function (app) {
  var historyEventRouter = express.Router();

  historyEventRouter.get('/', historyEventHandler.fetchAll);
  historyEventRouter.get('/:id', historyEventHandler.fetchByID);

  historyEventRouter.post('/', historyEventHandler.create);

  historyEventRouter.put('/:id', historyEventHandler.update);

  historyEventRouter.delete('/:id', historyEventHandler.del);
  
  app.use('/api/history-events', historyEventRouter);
};
