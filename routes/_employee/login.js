var cwd          = process.cwd(),
    express      = require('express'),
    loginHandler = require(cwd + '/handlers/employee-login');

var sessionMiddleware       = require(cwd + '/lib/security/middleware/session'),
    authorizationMiddleware = require(cwd + '/lib/security/middleware/authorization');

module.exports = function ( app ) {
  var loginRouter  = express.Router();

  loginRouter.post('/', loginHandler.login);
  loginRouter.post('/verify', loginHandler.verify);

  app.use('/client-api/employee/login', loginRouter);
};
