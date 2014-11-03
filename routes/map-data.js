var express        = require('express'),
    dataMapHandler = require('../handlers/data-mapper');

module.exports = function (app) {
  var dataMapRouter = express.Router(),
      importRouter  = express.Router();

  dataMapRouter.get('/:id/html/:limit', dataMapHandler.xmlToHtml);
  dataMapRouter.get('/:id/injectAndHtml/:limit', dataMapHandler.injectXml);

  dataMapRouter.get('/:id/injectSingle/:limit', dataMapHandler.injectSingle);
  dataMapRouter.get('/:id/htmlSingle/:limit', dataMapHandler.xmlToHtmlSingle);

  importRouter.get('/legacyFiles', dataMapHandler.importFiles);
  
  app.use('/api/map-data', dataMapRouter);
  app.use('/api/import', importRouter);
};
