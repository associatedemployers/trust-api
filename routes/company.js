var express        = require('express'),
    companyHandler = require('../handlers/company');

var sessionMiddleware       = require('../lib/security/middleware/session'),
    authorizationMiddleware = require('../lib/security/middleware/authorization');

module.exports = function (app) {
  var companyRouter = express.Router();

  companyRouter.use( sessionMiddleware('Session') );
  companyRouter.use( authorizationMiddleware({ allow: 'admin' }) );

  companyRouter.get('/', companyHandler.fetchAll);
  companyRouter.get('/:id', companyHandler.fetchByID);

  companyRouter.post('/', companyHandler.create);

  companyRouter.put('/:id', companyHandler.update);

  companyRouter.delete('/:id', companyHandler.del);
  
  app.use('/api/companies', companyRouter);
};
