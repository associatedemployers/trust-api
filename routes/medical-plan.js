var express            = require('express'),
    medicalPlanHandler = require('../handlers/medical-plan');

var sessionMiddleware       = require('../lib/security/middleware/session'),
    authorizationMiddleware = require('../lib/security/middleware/authorization');

module.exports = function (app) {
  var medicalPlanRouter = express.Router();

  medicalPlanRouter.use( sessionMiddleware('Session') );
  medicalPlanRouter.use( authorizationMiddleware({ allow: 'admin' }) );

  medicalPlanRouter.get('/', medicalPlanHandler.fetchAll);
  medicalPlanRouter.get('/:id', medicalPlanHandler.fetchByID);
  medicalPlanRouter.post('/', medicalPlanHandler.create);
  medicalPlanRouter.put('/:id', medicalPlanHandler.update);
  medicalPlanRouter.delete('/:id', medicalPlanHandler.del);
  
  app.use('/api/medical-plans', medicalPlanRouter);
  app.use('/api/medicalPlans', medicalPlanRouter);
};
