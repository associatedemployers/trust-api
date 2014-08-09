var express        = require('express'),
    dataMapHandler = require('../handlers/data-mapper');

module.exports = function (app) {
  var dataMapRouter = express.Router();

  dataMapRouter.get('/', dataMapHandler.mapData);
  
  app.use('/api/map-data', dataMapRouter);
};
