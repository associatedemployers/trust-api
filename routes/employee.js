var express        = require('express'),
    employeeHandler = require('../handlers/employee');

module.exports = function (app) {
  var employeeRouter = express.Router();

  employeeRouter.get('/', employeeHandler.fetchAll);
  employeeRouter.get('/:id', employeeHandler.fetchByID);

  employeeRouter.post('/', employeeHandler.create);

  employeeRouter.put('/:id', employeeHandler.update);

  employeeRouter.delete('/:id', employeeHandler.del);
  
  app.use('/api/employee', employeeRouter);
};
