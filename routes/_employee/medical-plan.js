var cwd = process.cwd();

var express            = require('express'),
    medicalPlanHandler = require(cwd + '/handlers/_employee/medical-plan');

var sessionMiddleware = require(cwd + '/lib/security/middleware/session');

module.exports = function ( app ) {
  var medicalPlanRouter = express.Router();

  medicalPlanRouter.use( sessionMiddleware('Session') );

  medicalPlanRouter.get('/:id', medicalPlanHandler.fetchByID);

  app.use('/client-api/medicalPlans', medicalPlanRouter);
  app.use('/client-api/medical-plans', medicalPlanRouter);
};
