var cwd          = process.cwd(),
    mongoose     = require('mongoose'),
    winston      = require('winston'),
    chalk        = require('chalk'),
    _            = require('lodash'),
    normalize    = require(cwd + '/config/data-normalization'),
    respond      = require(cwd + '/handlers/response'),
    HistoryEvent = require(cwd + '/models/history-event'),
    parseQuery   = require(cwd + '/lib/utilities/parse-query');

function convertCamel ( str ) {
  return ( str ) ? str.charAt(0).toLowerCase() + str.substring(1, str.length) : str;
}

exports.getAll = function ( resourceName, populate, forceQuery ) {
  populate = populate || '';

  return function ( req, res, next ) {
    winston.log('debug', chalk.dim(req.query));

    var Model = mongoose.model(resourceName),
        lowerCaseResource = convertCamel(resourceName);

    var query  = ( req.query ) ? parseQuery( req.query ) : req.query,
        _count = query._count,
        limit  = parseFloat(query.limit) || null,
        page   = parseFloat(query.page)  || 0,
        select = query.select || '',
        skip   = page * limit,
        sort   = query.sort || { time_stamp: 1 };

    if ( forceQuery ) {
      query = _.merge(query, forceQuery);
    }

    if( query._distinct === true ) {
      return Model.distinct({}, select).exec().then(function ( items ) {
        res.send( items );
      });
    }

    if( query.ids ) {
      query._id = {
        $in: query.ids
      };

      delete query.ids;
    }

    delete query.limit;
    delete query.page;
    delete query.sort;
    delete query.select;
    delete query._count;

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

    winston.log('debug', chalk.dim(query, select, limit, page, skip));

    if( _count === true ) {
      var sendError = function ( err ) {
        respond.error.res( res, err, true );
      };

      return Model.count({}, function ( err, total ) {
        if ( err ) sendError( err );

        Model.count(query, function ( err, count ) {
          if ( err ) sendError( err );

          res.status(200).send({
            total: total,
            count: count
          });
        });
      });
    }

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

exports.getById = function ( resourceName, populate, select, strip, beforeVirtuals ) {
  populate = populate || '';

  return function ( req, res, next ) {
    var Model = mongoose.model(resourceName),
        lowerCaseResource = convertCamel(resourceName);

    var id                = req.params.id,
        snapshot          = req.query.snapshot,
        snapshotDirection = req.query.snapshotDirection || 'updated';

    if ( !id ) {
      return respond.error.res( res, 'Please specify an id in the url.' );
    }

    if ( snapshot ) console.log('Getting', snapshotDirection, 'doc for snapshot:', snapshot);

    (( snapshot ) ? 
      HistoryEvent.findOne({ _id: snapshot, documentId: id, documentModel: resourceName }) : 
      Model.findById( id ))
    .populate( populate )
    .select( select )
    .exec(function ( err, record ) {
      if( err ) {
        return respond.error.res( res, err, true );
      }

      if( !record ) {
        return respond.code.notfound( res );
      }

      var sendRecord = function ( err, record ) {
        if ( err ) {
          return respond.error.res( res, err, true );
        }

        record = stripObject( stripObject( record, beforeVirtuals, true ).toObject({ virtuals: true }), strip );

        var norm = normalize[ lowerCaseResource ],
            regularNormalize = {};

        regularNormalize[ lowerCaseResource ] = record;

        res.json( ( norm && typeof norm === 'function' ) ? norm( record ) : regularNormalize );
      };

      if( snapshot ) {
        record = new Model( record.documents[ snapshotDirection ] );
        Model.populate(record, {
          path: populate
        }, sendRecord);
      } else {
        sendRecord(null, record);
      }
    });
  };
};

function stripObject ( object, strip, mongooseObject ) {
  if ( !strip ) {
    return object;
  }

  var paths = strip.split(' ');

  paths.forEach(function ( path ) {
    if ( mongooseObject ) {
      object.set(path, undefined);
    } else {
      delete object[ path ];
    }
  });

  return object;
}
