var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require('../config/data-normalization'),
    respond   = require('./response'),
    fs        = require('fs-extra');

var File = require('../models/file'),
    ResourceMixin = require('../lib/mixins/resource-handler');

exports.get = function ( req, res, next ) {
  if( !req.params.path ) {
    return res.status(404).end();
  }

  var path = process.cwd() + '/files/',
      name = req.params.path;

  var pipeBack = function ( path ) {
    res.sendFile(path, function ( err ) {
      if ( err ) {
        if ( err.code === 'ECONNABORT' && res.statusCode === 304 ) {
          return;
        }

        console.error('SendFile error:', err, ' ( status: ' + err.status + ' )');

        if ( err.status ) {
          res.status( err.status ).end();
        }
      }
    });
  };

  fs.exists(path + 'employee/' + name, function ( exists ) {
    if( exists ) {
      return pipeBack( path + 'employee/' + name );
    }

    fs.exists(path + 'company/' + name, function ( exists ) {
      if( exists ) {
        pipeBack( path + 'company/' + name );
      } else {
        res.status(404).end();
      }
    });
  });
};


exports.fetchAll = ResourceMixin.getAll('File');
exports.fetchByID = ResourceMixin.getById('File');

exports.create = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.update = function ( req, res, next ) {
  respond.code.notimplemented(res);
};

exports.del = function ( req, res, next ) {
  respond.code.notimplemented(res);
};
