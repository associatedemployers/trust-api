var express        = require('express'),
    companyHandler = require('../handlers/company');

module.exports = function (app) {
  var companyRouter = express.Router();

  companyRouter.get('/', companyHandler.fetchAll);
  companyRouter.get('/:id', companyHandler.fetchByID);

  companyRouter.post('/', companyHandler.create);

  companyRouter.put('/:id', companyHandler.update);

  companyRouter.delete('/:id', companyHandler.del);
  
  app.use('/api/companies', companyRouter);
};
