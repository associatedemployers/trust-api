var winston     = require('winston').loggers.get('default'),
    chalk       = require('chalk'),
    normalize   = require('../config/data-normalization'),
    respond     = require('./response'),
    _           = require('lodash'),
    Promise     = require('bluebird'), // jshint ignore:line
    mongoose    = require('mongoose'),
    getPath     = require('../lib/utilities/get-path'),
    escapeRegex = require('../lib/utilities/escape-regex');

exports.search = function ( req, res, next ) {
  var query = req.query;

  var limit  = parseFloat(query.limit) || 100,
      page   = parseFloat(query.page)  || 0,
      skip   = page * limit,
      models = query.models;

  if( !models || !_.isArray( models ) || models.length < 1 ) {
    return respond.error.res( res, 'Please specify "models" in the request' );
  }

  if( !query.query ) {
    return respond.error.res( res, 'Please send a search query in the request' );
  }

  var searchPattern = query.query.replace(/,/g, '').split(' ').map(function ( str ) {
    return '(?=.*' + escapeRegex( str ) + ')';
  }).join('');

  var exp = new RegExp(searchPattern, 'gi');

  console.log(searchPattern);

  Promise.reduce(models, function ( results, modelName ) {
    return new Promise(function ( resolve, reject ) {
      modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

      var Model = mongoose.model( modelName ); // Throws if it can't find the model

      Model
      .find({ stringified: { $regex: exp } })
      .limit( Math.round(limit / models.length) )
      .exec(function ( err, docs ) {
        if( err ) {
          return reject( err.message );
        }

        resolve( docs );
      });
    }).then(function ( docs ) {
      return results.concat( docs );
    });
  }, [])
  .then(function ( results ) {
    if( query.normalize ) {
      var normalize = query.normalize;
      var outEmpty = function ( item ) {
        return ( item && !_.isEmpty( item ) );
      };

      var ret = results.map(function ( result ) {
        var type = result.constructor.modelName.toLowerCase(),
            n    = normalize[ type ];

        if( !n || typeof n !== 'object' ) {
          return result;
        }

        var o     = {},
            plain = result.toObject(),
            get   = getPath.bind( plain );

        for ( var key in n ) {
          var path = n[ key ];
          o[ key ] = ( _.isArray( path ) ) ? path.map( get ).filter( outEmpty ).join(' ') : get( n[ key ] );
        }

        o.type = type;

        return o;
      });

      res.send( ret );
    } else {
      res.send( results );
    }
  })
  .catch(function ( err ) {
    return respond.error.res( res, err, true );
  });
};
