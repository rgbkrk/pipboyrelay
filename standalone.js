var dgram = require('dgram');
var net = require('net');
var io = require('socket.io')();
var hexy = require('hexy');
var pipboylib = require('pipboylib');

var falloutClient = new pipboylib.DiscoveryClient();

var FALLOUT_TCP_PORT = 27000;
var SOCKETIO_PORT = 3000;

var HEARTBEAT_BUF = new Buffer(5);
for(var i = 0; i < 5; i++) {
  HEARTBEAT_BUF[i] = 0;
}

var db = {};
var pipDecode = pipboylib.PipDecode();
var pipDB = pipboylib.PipDB();

console.log('Looking for Fallout 4 network service..');

function createClient() {
  var client = new net.Socket()

  client.on('connect', function () {
    console.log("Socket connected!");

    setInterval(function() { // send heartbeat every 1000ms or we get disconnected
      client.write(HEARTBEAT_BUF);
    }, 1000);
  });

  client.on('data', function (data) {
    pipDecode.emit('data', data);
  });

  client.on('close', function (hadError) {
    console.log('Connection closed!');
    process.exit(1);
  });

  client.on('end', function () {
    console.log('Connection ended!');
    process.exit(1);
  });

  client.on('error', function (err) {
    console.error('Connection error: ' + err);
    process.exit(1);
  });

  return client;
}

falloutClient.discover(function(err, server) {
  if(err) {
    console.error('Failed to discover Fallout 4 network service, reason: ' + err);
    process.exit(1);
  }

  console.log('Discovered Fallout 4 service at ' + server.info.address + ':' + server.info.port);

  var client = createClient();
  client.connect(FALLOUT_TCP_PORT, server.info.address);

  io.on('connection', function(socket) {
    socket.on('command', function(type, args) {
      try {
        var packet = pipboylib.PipEncode.createCommandPacket(type, args);
        client.write(packet);
      } catch(err) {
        console.error(err);
      }
    });
  });

  io.listen(SOCKETIO_PORT);
  console.log('Socket.io server listening on port ' + SOCKETIO_PORT);

  pipDecode.on('db_update', function(data) {
    pipDB.emit('data', data);
  });

  pipDecode.on('heartbeat', function() {
    // process.stdout.write('.');
  });

  pipDecode.on('info', function(data) {
    console.log("Got handshake! Lang: " + data.lang + ', Version: ' + data.version);
  });

  pipDB.on('db_update', function(db) {
    // process.stdout.write('o');
    io.emit('db_update', db);
  });
});
