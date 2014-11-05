var express        = require('express'),
    testHandler = require('../handlers/test');

module.exports = function (app) {
  var testRouter = express.Router();

  testRouter.get('/preview-email/:template', testHandler.previewEmail);

  app.use('/api/test', testRouter);
};
