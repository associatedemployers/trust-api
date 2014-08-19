var express        = require('express'),
    dataMapHandler = require('../handlers/data-mapper');

module.exports = function (app) {
  var dataMapRouter = express.Router();

  dataMapRouter.get('/:id/html', dataMapHandler.xmlToHtml);
  dataMapRouter.get('/:id/injectAndHtml', dataMapHandler.injectXml);
  
  app.use('/api/map-data', dataMapRouter);
};
