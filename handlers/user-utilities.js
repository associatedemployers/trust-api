var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    _         = require('lodash');

var mongoose       = require('mongoose'),
    User           = require('../models/user'),
    UserPermission = require('../models/user-permission'),
    Mailman        = require('../lib/controllers/mailman');

exports.fetchId = function ( req, res, next ) {
  var id = req.params.id;

  if( !id || !mongoose.Types.ObjectId.isValid( id ) ) {
    return respond.error.res(res, 'Please provide a valid id in your request');
  }

  User.findById(id, function ( err, user ) {
    if( err ) {
      return respond.error.res(res, err, true);
    }

    if( !user || ( user && user.verified === true ) ) {
      return respond.code.notfound(res, 'Id not found or already verified');
    }

    req.verifyUser = user;

    next();
  });
};

exports.verifyLink = function ( req, res, next ) {
  res.status(200).end();
};

exports.verifyAccount = function ( req, res, next ) {
  var user = req.verifyUser,
      password = req.body.password;

  if( !password ) {
    return respond.error.res(res, 'Please provide a password in the body of your request');
  }

  user.login.password = password;

  user.save(function ( err, updatedUser ) {
    if( err ) {
      return respond.error.res(res, err, true);
    }

    res.status(200).end();
  });
};
