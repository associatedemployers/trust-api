var express            = require('express'),
    medicalPlanHandler = require('../handlers/medical-plan');

module.exports = function (app) {
  var medicalPlanRouter = express.Router();

  medicalPlanRouter.get('/', medicalPlanHandler.fetchAll);
  medicalPlanRouter.get('/:id', medicalPlanHandler.fetchByID);

  medicalPlanRouter.post('/', medicalPlanHandler.create);

  medicalPlanRouter.put('/:id', medicalPlanHandler.update);

  medicalPlanRouter.delete('/:id', medicalPlanHandler.del);

  app.use('/api/medical-rates', medicalPlanRouter);
  app.use('/api/medicalPlans', medicalPlanRouter);
};
