var cwd = process.cwd();

var express                 = require('express'),
    enrollmentPeriodHandler = require(cwd + '/handlers/_employee/enrollment-period');

module.exports = function ( app ) {
  var enrollmentPeriodRouter = express.Router();

  enrollmentPeriodRouter.get('/', enrollmentPeriodHandler.fetchAll);
  enrollmentPeriodRouter.get('/:id', enrollmentPeriodHandler.fetchByID);

  app.use([ '/client-api/enrollmentPeriods', 'client-api/enrollment-period' ], enrollmentPeriodRouter);
};
