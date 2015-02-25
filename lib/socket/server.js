/*
  socket.io server & controller
*/

var winston  = require('winston'),
    chalk    = require('chalk'),
    globSync = require('glob').sync,
    mongoose = require('mongoose'),
    redis    = require('socket.io-redis'),
    _        = require('lodash');

var socketio     = require('socket.io'),
    SocketClient = require(process.cwd() + '/models/socket-client');

module.exports = SocketServer;

function SocketServer ( app ) {
  var connection = socketio(app);

  connection.adapter(redis(
    {
      host: 'localhost',
      port: 6379
    }
  ));

  this.connection = connection;
  this.socketConnections = [];

  var self = this;

  connection.sockets.on('connection', function ( clientSocket ) {
    winston.debug(chalk.dim('Socket Server :: User Connected [', clientSocket.request.connection.remoteAddress, ']'));

    self.__loadClientEvents( clientSocket );
    self.socketConnections.push({
      id:     mongoose.Types.ObjectId(),
      socket: clientSocket
    });
  });
}

/**
 * Loads event managers/listeners on a client socket
 * @private
 * @param  {Object} socket
 */
SocketServer.prototype.__loadClientEvents = function ( socket ) {
  var self          = this,
      eventManagers = globSync('./event-managers/*.*');

  var context = {
    socket:     socket,
    controller: this
  };

  eventManagers.forEach(function ( eventManager ) {
    socket.on(eventManager.options.name, eventManager.run.bind( context ));
  });

  winston.debug(chalk.dim('Socket Server :: Registered', eventManagers.length + 'Events for Client'));
};

SocketServer.prototype.clientExists = function ( socket ) {
  return !!_.find(this.socketConnections, function ( cSocket ) {
    return socket.request.connection.remoteAddress === cSocket.request.connection.remoteAddress;
  });
};

/**
 * Adds a client to the server
 * @param {Object}   socket
 * @param {ObjectId} id
 * @return {Array}   socketConnections
 */
SocketServer.prototype.addClient = function ( socket, id ) {
  if ( !this.clientExists.call(this, socket) ) {
    this.socketConnections.push({
      id:     id,
      socket: socket
    });
  }

  winston.debug(chalk.dim('Socket Server :: User Added [', socket.request.connection.remoteAddress, ']'));

  return this.socketConnections;
};

/**
 * Removes a client from the server
 * @param  {Object} socket
 * @return {Array}  socketConnections
 */
SocketServer.prototype.removeClient = function ( socket ) {
  var r = _.pull(this.socketConnections[ socket ], { socket: socket });

  winston.debug(chalk.dim('Socket Server :: User Removed [', socket.request.connection.remoteAddress, ']'));

  if ( this.removedClient && typeof this.removedClient === 'function' ) {
    this.removedClient.call(this, r);
  }

  return this.socketConnections;
};
