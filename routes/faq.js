var express    = require('express'),
    faqHandler = require('../handlers/faq');

module.exports = function (app) {
  var faqRouter = express.Router();

  faqRouter.get('/', faqHandler.fetchAll);
  faqRouter.get('/:id', faqHandler.fetchByID);
  faqRouter.post('/', faqHandler.create);
  faqRouter.put('/:id', faqHandler.update);
  faqRouter.delete('/:id', faqHandler.del);

  app.use('/client-api/faqs', faqRouter);
};
