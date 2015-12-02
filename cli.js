#!/usr/bin/env node

var pipboylib = require('pipboylib');
var relay = require('./relay');

var hexy = require('hexy');
var util = require('util');

var UDPRelay = relay.UDPRelay;
var TCPRelay = relay.TCPRelay;

var program = require('commander');

var version = require('./package.json').version;

program
  .version(version)
  .option('-t --output-type <type>', 'Output type', /^(hex|decoded)$/i, 'hex')
  .parse(process.argv)

var maxShowLength = 48;

pipboylib.connection.discover().then(function (server) {
  // Set up a new relay for each running server

  var udpRelay = new UDPRelay();
  udpRelay.bind(server.info, function (data, telemetry) {
    var t = util.format('%s:%d -> %s:%d',
                        telemetry.src.address, telemetry.src.port,
                        telemetry.dst.address, telemetry.dst.port);

    console.log('[UDP Relay] ', t);
    if (program.outputType == 'hex') {
      var dataChunk = data.slice(0, Math.min(data.length, maxShowLength));
      var dots = '';
      if (dataChunk.length < data.length) {
        dots = '...';
      }
      console.log(hexy.hexy(dataChunk) + dots);
    } else {
      console.log("TODO: DECODE");
    }

  });

  var tcpServerInfo = {};
  tcpServerInfo.address = server.info.address;
  tcpServerInfo.port = pipboylib.constants.FALLOUT_TCP_PORT;
  tcpServerInfo.family = server.info.family;

  var tcpRelay = new TCPRelay();
  tcpRelay.listen(tcpServerInfo, function (data, telemetry) {
    var t = util.format('%s:%d -> %s:%d',
                        telemetry.src.address, telemetry.src.port,
                        telemetry.dst.address, telemetry.dst.port);

    console.log('[TCP Relay] ', t);

    if (program.outputType == 'hex') {
      var dataChunk = data.slice(0, Math.min(data.length, maxShowLength));
      var dots = '';
      if (dataChunk.length < data.length) {
        dots = '...';
      }

      console.log(hexy.hexy(dataChunk) + dots);
    } else {
      console.log("TODO: DECODE");
    }
  });

  console.log('UDP and TCP Relay created for:',
              server.MachineType, 'on', server.info.address)
  console.log('Connect to: ', tcpRelay.server.address())

}).catch(function(err) {
  throw err;
});
