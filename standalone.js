var dgram = require('dgram');
var net = require('net');
var io = require('socket.io')();
var hexy = require('hexy');
var pipboylib = require('pipboylib');

var falloutClient = new pipboylib.DiscoveryClient();
var pipdecode = require('./pipdecode');
var pipdb = require('./pipdb');

var FALLOUT_TCP_PORT = 27000;
var SOCKETIO_PORT = 3000;

var HEARTBEAT_BUF = new Buffer(5);
for(var i = 0; i < 5; i++) {
  HEARTBEAT_BUF[i] = 0;
}

var db = {};

io.listen(SOCKETIO_PORT);
io.on('connection', function(socket) {
  console.log('Socket.io client connected!');
  socket.emit('db_update', db);
});

console.log("Socket.io server listening on port " + SOCKETIO_PORT);

falloutClient.discover(function(err, server) {
  if(err) {
    console.error('Failed to discover Fallout 4 network service, reason: ' + err);
    process.exit(1);
  }

  console.log('Discovered Fallout 4 service at ' + server.info.address + ':' + server.info.port);

  var client = new net.Socket()

  client.on('connect', function () {
    console.log("Socket connected!");

    setInterval(function() { // send heartbeat every 100ms or we get disconnected
      client.write(HEARTBEAT_BUF);
    }, 100);
  });

  client.on('data', function (message) {
    pipdecode.update(message);
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

  pipdecode.onPacket = function(packet) {
    if(packet.channel === 0) {
      process.stdout.write('.');
    } else if(packet.channel === 1) {
      var handshake = JSON.parse(packet.content);
      console.log("Got handshake! Lang: " + handshake.lang + ', Version: ' + handshake.version);
    } else if(packet.channel === 3) {
      pipdb.decodeDBEntries(packet.content);
      db = pipdb.getNormalizedDB();
      io.emit('db_update', db);
      process.stdout.write('o');
    }
  }

  client.connect(FALLOUT_TCP_PORT, server.info.address);
});
