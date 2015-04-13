var cwd = process.cwd();

var express           = require('express'),
    busboy            = require('connect-busboy'),
    sessionMiddleware = require(cwd + '/lib/security/middleware/session');

var columnDataHandler = require(cwd + '/handlers/_company/utilities/column-data-parser');

module.exports = function ( app ) {
  var companyUtilityRouter = express.Router();

  companyUtilityRouter.use( sessionMiddleware('Session', true, 'company') );

  companyUtilityRouter.post('/column-data', busboy(), columnDataHandler.parse);
  
  app.use('/client-api/company-utilities', companyUtilityRouter);
};
