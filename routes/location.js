var express         = require('express'),
    locationHandler = require('../handlers/location');

var sessionMiddleware       = require('../lib/security/middleware/session'),
    authorizationMiddleware = require('../lib/security/middleware/authorization');

module.exports = function (app) {
  var locationRouter = express.Router();

  locationRouter.use( sessionMiddleware('Session') );
  locationRouter.use( authorizationMiddleware({ allow: 'admin' }) );

  locationRouter.get('/', locationHandler.fetchAll);
  locationRouter.get('/:id', locationHandler.fetchByID);

  locationRouter.post('/', locationHandler.create);

  locationRouter.put('/:id', locationHandler.update);

  locationRouter.delete('/:id', locationHandler.del);
  
  app.use('/api/company/locations', locationRouter);
};
