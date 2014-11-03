var express     = require('express'),
    fileHandler = require('../handlers/file');

module.exports = function ( app ) {
  var fileRouter = express.Router();

  fileRouter.get('/', fileHandler.fetchAll);
  fileRouter.get('/:id', fileHandler.fetchByID);
  fileRouter.post('/', fileHandler.create);
  fileRouter.put('/:id', fileHandler.update);
  fileRouter.delete('/:id', fileHandler.del);

  app.use('/api/files', fileRouter);

  app.get('/api/file/:path', fileHandler.get);
};
