var express       = require('express'),
    searchHandler = require('../handlers/search');

module.exports = function ( app ) {
  var searchRouter = express.Router();

  searchRouter.get('/', searchHandler.search);

  app.use('/api/search', searchRouter);
};
