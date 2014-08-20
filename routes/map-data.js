var express        = require('express'),
    dataMapHandler = require('../handlers/data-mapper');

module.exports = function (app) {
  var dataMapRouter = express.Router();

  dataMapRouter.get('/:id/html/:limit', dataMapHandler.xmlToHtml);
  dataMapRouter.get('/:id/injectAndHtml/:limit', dataMapHandler.injectXml);

  dataMapRouter.get('/:id/htmlSingle/:limit', dataMapHandler.xmlToHtmlSingle);
  
  app.use('/api/map-data', dataMapRouter);
};
