var cwd = process.cwd();

var express                = require('express'),
    companyHandler         = require(cwd + '/handlers/_company/company'),
    sessionMiddleware      = require(cwd + '/lib/security/middleware/session'),
    clientParserMiddleware = require(cwd + '/lib/security/middleware/client-parser');

module.exports = function ( app ) {
  var companyRouter = express.Router();

  companyRouter.use( sessionMiddleware('Session') );
  companyRouter.use( clientParserMiddleware('id', '_id') );

  companyRouter.get('/:id', companyHandler.fetchByID);
  companyRouter.put('/:id', companyHandler.update);
  companyRouter.delete('/:id', companyHandler.del);
  
  app.use('/client-api/companies', companyRouter);
};
