var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    _         = require('lodash');

var User = require('../models/user');

exports.fetchAll = function ( req, res, next ) {
  console.log(req.query);
  var query  = req.query,
      limit  = parseFloat(query.limit) || null,
      page   = parseFloat(query.page)  || 0,
      select = query.select || '',
      skip   = page * limit,
      sort   = query.sort || { time_stamp: 1 };

  if( req.query.ids ) {
    query._id = {
      $in: req.query.ids
    };

    delete query.ids;
  }

  delete query.limit;
  delete query.page;
  delete query.sort;
  delete query.select;

  for ( var key in query ) {
    var v = query[ key ];
    if( v === 'exists' ) {
      query[ key ] = {
        $exists: true
      };
    } else if ( v === 'nexists' ) {
      query[ key ] = {
        $exists: false
      };
    }
  }

  console.log(query, limit, page, skip);

  User
  .find( query )
  .sort( sort )
  .skip( Math.abs( skip ) )
  .limit( Math.abs( limit ) )
  .select( select )
  .exec(function ( err, records ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    User.count( query, function ( err, count ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      res.json( normalize.user( records, { totalRecords: count } ) );
    });
  });
};

exports.fetchByID = function ( req, res, next ) {
  var id = req.params.id;

  if( !id ) {
    return respond.error.res( res, 'Please specify an id in the url.' );
  }

  User
  .findById(id)
  .exec(function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    if( !record ) {
      return respond.code.notfound( res );
    }

    res.json( normalize.user( record ) );
  });
};

exports.create = function ( req, res, next ) {
 var payload = req.body.user;

  if( !payload ) {
    return respond.error.res( res, 'Provide a payload with your request, prefixed with the type' );
  }

  delete payload._id;

  var record = new User( payload );

  record.save(function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    res.send( normalize.user( record ) );
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
  var payload = req.body.user;

  if( !payload ) {
    return respond.error.res( res, 'Provide a payload with your request, prefixed with the type' );
  }

  if( !payload._id ) {
    return respond.error.res( res, 'Please provide an id with your DELETE request' );
  }

  User
  .findByIdAndRemove( payload._id )
  .exec(function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    respond.code.ok( res );
  });
};
