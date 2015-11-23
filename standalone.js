var dgram = require('dgram');
var net = require('net');

var discovery = require('./discover');
var pipdecode = require('./pipdecode');
var pipdb = require('./pipdb');

var FALLOUT_TCP_PORT = 27000;

discovery.discover(function(err, server) {
  if(err) {
    console.error('Failed to discover Fallout 4 network service, reason: ' + err);
    process.exit(1);
  }

  console.log('Discovered Fallout 4 service at ' + server.info.address + ':' + server.info.port);

  var client = new net.Socket()

  client.on('connect', function () {
    console.log("Socket connected!");
  });

  client.on('data', function (message) {
    pipdecode.update(message);
  });

  client.on('close', function (hadError) {
    console.log('Connection closed!');
  });

  client.on('end', function () {
    console.log('Connection closed!');
  });

  client.on('error', function (err) {
    console.error('Connection error: ' + err);
  });

  pipdecode.onPacket = function(packet) {
    if(packet.channel === 1) {
      var handshake = JSON.parse(packet.content);
      console.log("Got handshake! Lang: " + handshake.lang + ', Version: ' + handshake.version);
    } else if(packet.channel === 3) {
      pipdb.decodeDBEntries(packet.content);
      db = pipdb.getNormalizedDB();
      console.log("DB Update!");
    }
  }

  client.connect(FALLOUT_TCP_PORT, server.info.address);
});
