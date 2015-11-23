#!/usr/bin/env node

var pipboylib = require('pipboylib');
var relay = require('pipboylib/lib/relay');

var hexy = require('hexy');
var util = require('util');

var UDPRelay = relay.UDPRelay;
var TCPRelay = relay.TCPRelay;

var falloutClient = new pipboylib.DiscoveryClient();
var pipdecode = require('./pipdecode');
var pipdb = require('./pipdb');

var db = {};

falloutClient.discover(function (error, server) {
  if (error) {
    console.error(error);
    return;
  }

  console.log('Discovered: ', server);

  // Set up a new relay for each running server

  var udpRelay = new UDPRelay();
  udpRelay.bind(server.info, function (data, telemetry) {
    var t = util.format('%s:%d -> %s:%d',
                        telemetry.src.address, telemetry.src.port,
                        telemetry.dst.address, telemetry.dst.port);
    var dataChunk = data.slice(0, Math.min(data.length, maxShowLength));
    var dots = '';
    if (dataChunk.length < data.length) {
      dots = '...';
    }
    console.log('[UDP Relay] ', t);
    console.log(hexy.hexy(dataChunk) + dots);
  });

  var tcpServerInfo = {};
  tcpServerInfo.address = server.info.address;
  tcpServerInfo.port = pipboylib.FALLOUT_TCP_PORT;
  tcpServerInfo.family = server.info.family;

  pipdecode.onPacket = function(packet) {
    if(packet.channel === 1) {
      var handshake = JSON.parse(packet.content);
      console.log("Connected! Lang: " + handshake.lang + ', Version: ' + handshake.version);
    } else if(packet.channel === 3) {
      pipdb.decodeDBEntries(packet.content);
      db = pipdb.getNormalizedDB();
    }
  }

  var tcpRelay = new TCPRelay()
  tcpRelay.listen(tcpServerInfo, function (data, telemetry) {
    pipdecode.update(data);
  });

  console.log('UDP and TCP Relay created for: ', server.info);
});
