var cwd = process.cwd();

var express                 = require('express'),
    enrollmentPeriodHandler = require(cwd + '/handlers/_client/enrollment-period'),
    sessionMiddleware       = require(cwd + '/lib/security/middleware/session'),
    clientParserMiddleware  = require(cwd + '/lib/security/middleware/client-parser');

module.exports = function ( app ) {
  var enrollmentPeriodRouter = express.Router();

  var onlyCompanies = function ( req, res, next ) {
    if ( !req.session.data.userType || req.session.data.userType.toLowerCase() !== 'company' ) {
      return res.status(401).send('Invalid session type');
    }
    next();
  };

  enrollmentPeriodRouter.use( sessionMiddleware('Session') );
  enrollmentPeriodRouter.get('/', enrollmentPeriodHandler.fetchAll);
  enrollmentPeriodRouter.post('/', onlyCompanies, enrollmentPeriodHandler.create);
  enrollmentPeriodRouter.delete('/:id', onlyCompanies, enrollmentPeriodHandler.del);

  app.use([ '/client-api/enrollmentPeriods', '/client-api/enrollment-periods' ], enrollmentPeriodRouter);
};
