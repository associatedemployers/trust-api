var mongoose  = require('mongoose'),
    normalize = require('../../config/data-normalization'),
    respond   = require('../../handlers/response');

function convertCamel ( str ) {
  return ( str ) ? str.charAt(0).toLowerCase() + str.substring(1, str.length) : str;
}

exports.getAll = function ( resourceName, populate ) {
  populate = populate || '';

  return function ( req, res, next ) {
    console.log( req.query );

    var Model = mongoose.model(resourceName),
        lowerCaseResource = convertCamel(resourceName);

    var query  = req.query,
        limit  = parseFloat(query.limit) || null,
        page   = parseFloat(query.page)  || 0,
        select = query.select || '',
        skip   = page * limit,
        sort   = query.sort || { time_stamp: 1 };

    if( query._distinct === 'true' ) {
      return Model.distinct({}, select).exec().then(function ( items ) {
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

    Model
    .find( query )
    .sort( sort )
    .skip( Math.abs( skip ) )
    .limit( Math.abs( limit ) )
    .select( select )
    .populate( populate )
    .exec(function ( err, records ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      records = records.map(function ( record ) { return record.toObject({ virtuals: true }); });

      Model.count( query, function ( err, count ) {
        if( err ) {
          return respond.error.res( res, err, true );
        }

        var norm = normalize[ lowerCaseResource ],
            regularNormalize = {
              meta: {
                totalRecords: count
              }
            };

        regularNormalize[ lowerCaseResource ] = records;

        res.json( ( norm && typeof norm === 'function' ) ? norm( records, regularNormalize.meta ) : regularNormalize );
      });
    });
  };
};

exports.getById = function ( resourceName, populate ) {
  populate = populate || '';

  return function ( req, res, next ) {
    var Model = mongoose.model(resourceName),
        lowerCaseResource = convertCamel(resourceName);

    var id = req.params.id;

    if( !id ) {
      return respond.error.res( res, 'Please specify an id in the url.' );
    }

    Model
    .findById( id )
    .populate( populate )
    .exec(function ( err, record ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      if( !record ) {
        return respond.code.notfound( res );
      }

      record = record.toObject({ virtuals: true });

      var norm = normalize[ lowerCaseResource ],
          regularNormalize = {};

      regularNormalize[ lowerCaseResource ] = record;

      res.json( ( norm && typeof norm === 'function' ) ? norm( record ) : regularNormalize );
    });
  };
};
