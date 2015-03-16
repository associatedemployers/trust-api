var cwd          = process.cwd(),
    express      = require('express'),
    loginHandler = require(cwd + '/handlers/_company/login');

module.exports = function ( app ) {
  var loginRouter  = express.Router();

  loginRouter.post('/', loginHandler.login);

  app.use('/client-api/company/login', loginRouter);
};
