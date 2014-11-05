var express            = require('express'),
    medicalRateHandler = require('../handlers/medical-rate');

module.exports = function (app) {
  var medicalRateRouter = express.Router();

  medicalRateRouter.get('/', medicalRateHandler.fetchAll);
  medicalRateRouter.get('/:id', medicalRateHandler.fetchByID);

  medicalRateRouter.post('/', medicalRateHandler.create);

  medicalRateRouter.put('/:id', medicalRateHandler.update);

  medicalRateRouter.delete('/:id', medicalRateHandler.del);
  
  app.use('/api/medical-rates', medicalRateRouter);
  app.use('/api/medicalRates', medicalRateRouter);
};
