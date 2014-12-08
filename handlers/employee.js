var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    _         = require('lodash');

var Employee    = require('../models/employee'),
    Company     = require('../models/company'),
    MedicalRate = require('../models/medical-rate');

exports.fetchAll = function ( req, res, next ) {
  console.log(req.query);
  var query  = req.query,
      limit  = parseFloat(query.limit) || null,
      page   = parseFloat(query.page)  || 0,
      select = query.select || '',
      skip   = page * limit,
      sort   = query.sort || { time_stamp: 1 };

  if( query._distinct === 'true' ) {
    return Employee.distinct({}, select).exec().then(function ( items ) {
      res.send( items );
    });
  }

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
    } else if ( v === 'false' ) {
      query[ key ] = false;
    } else if( v === 'true' ) {
      query[ key ] = true;
    }
  }

  console.log(query, select, limit, page, skip);

  Employee
  .find( query )
  .sort( sort )
  .skip( Math.abs( skip ) )
  .limit( Math.abs( limit ) )
  .select( select )
  .populate('plans.medical plans.dental plans.vision plans.life')
  .exec(function ( err, records ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    Employee.count( query, function ( err, count ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      res.json( normalize.employee( records, { totalRecords: count } ) );
    });
  });
};

exports.fetchByID = function ( req, res, next ) {
  var id = req.params.id;

  if( !id ) {
    return respond.error.res( res, 'Please specify an id in the url.' );
  }

  Employee
  .findById(id)
  .populate('plans.medical plans.dental plans.vision plans.life')
  .exec(function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    if( !record ) {
      return respond.code.notfound( res );
    }

    res.json( normalize.employee( record ) );
  });
};

exports.create = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.update = function ( req, res, next ) {
  var payload = req.body.employee;

  if( !payload ) {
    return respond.error.res( res, 'Provide a payload with your request, prefixed with the type' );
  }

  if( !payload._id ) {
    return respond.error.res( res, 'Please provide an id with your UPDATE/PUT request' );
  }

  Employee
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

      Employee
      .findById( updated._id )
      .populate('plans.medical plans.dental plans.vision plans.life')
      .exec(function ( err, updated ) {
        if( err ) {
          return respond.error.res( res, err );
        }

        res.send( normalize.employee( updated ) );
      });
    });
  });
};

exports.del = function ( req, res, next ) {
  var payload = req.body.employee;

  if( !payload ) {
    return respond.error.res( res, 'Provide a payload with your request, prefixed with the type' );
  }

  if( !payload._id ) {
    return respond.error.res( res, 'Please provide an id with your DELETE request' );
  }

  Employee
  .findByIdAndRemove( payload._id )
  .exec(function ( err, record ) {
    if( err ) {
      return respond.error.res( res, err, true );
    }

    respond.code.ok( res );
  });
};
