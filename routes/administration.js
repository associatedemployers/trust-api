var express        = require('express'),
    adminHandler = require('../handlers/administration');

module.exports = function (app) {
  var adminRouter = express.Router();

  adminRouter.get('/stats', adminHandler.fetchStats);
  
  app.use('/api/administration', adminRouter);
};
