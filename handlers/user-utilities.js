var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    _         = require('lodash');

var mongoose       = require('mongoose'),
    User           = require('../models/user'),
    UserPermission = require('../models/user-permission'),
    Mailman        = require('../lib/controllers/mailman');

exports.verifyLink = function ( req, res, next ) {
  var id = req.params.id;

  if( !id || !mongoose.Types.ObjectId.isValid( id ) ) {
    return respond.error.res(res, 'Please provide a valid id in your request.');
  }

  User.findById(id, function ( err, user ) {
    if( err ) {
      return respond.error.res(res, err, true);
    }

    if( !user ) {
      return respond.code.notfound(res, 'Verify link not found.');
    }

    res.status(200).end();
  });
};

exports.verifyAccount = function ( req, res, next ) {

};
