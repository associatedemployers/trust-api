var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    _         = require('lodash');

var User          = require('../models/user'),
    ObjectId      = require('mongoose').Types.ObjectId,
    ResourceMixin = require('../lib/mixins/resource-handler');

exports.fetchAll = ResourceMixin.getAll('User');
exports.fetchByID = ResourceMixin.getById('User');

exports.create = function ( req, res, next ) {
  var payload = req.body.user;

  if( !payload ) {
    return respond.error.res( res, 'Provide a payload with your request, prefixed with the type' );
  }

  delete payload._id;

  User.findOne({ email: payload.email }).exec(function ( err, user ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    if( user ) {
      return respond.error.res( res, 'User with that email already exists...');
    }

    var record = new User( payload );

    record.save(function ( err, record ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      res.status(201).send( normalize.user( record ) );
    });
  });
};

exports.update = function ( req, res, next ) {
  var payload = req.body.user;

  if( !payload ) {
    return respond.error.res( res, 'Provide a payload with your request, prefixed with the type' );
  }

  if( !payload._id ) {
    return respond.error.res( res, 'Please provide an id with your UPDATE/PUT request' );
  }

  User
  .findById( payload._id )
  .exec(function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    // Read-only
    delete payload._id;

    // Merge the payload
    record = _.merge( record, payload );

    record.save(function ( err, updated ) {
      if( err ) {
        return respond.error.res( res, err );
      }

      User
      .findById( updated._id )
      .exec(function ( err, updated ) {
        if( err ) {
          return respond.error.res( res, err );
        }

        res.send( normalize.user( updated ) );
      });
    });
  });
};

exports.del = function ( req, res, next ) {
  var id = req.params.id;

  if( !id && !ObjectId.isValid( id ) ) {
    return respond.error.res( res, 'Please provide an id with your DELETE request' );
  }

  User
  .findByIdAndRemove( id )
  .exec(function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.status(200).send( record );
  });
};
