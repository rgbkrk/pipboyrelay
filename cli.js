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
  .option('-m --metadata', 'Metadata about telemetry')

program.on('--help', function (){
  console.log('  Examples:');
  console.log('');
  console.log('    $ pipboyrelay -t hex');
  console.log('    $ pipboyrelay -t decoded');
  console.log('');
});

program.parse(process.argv)

var maxShowLength = 48;

pipboylib.connection.discover().then(function (server) {
  // Set up a new relay for each running server

  var udpRelay = new UDPRelay();
  udpRelay.bind(server.info, function (data, telemetry) {
    if (program.metdata) {
      var t = util.format('%s:%d -> %s:%d',
                          telemetry.src.address, telemetry.src.port,
                          telemetry.dst.address, telemetry.dst.port);

      console.error('[UDP Relay] ', t);
    }
    if (program.outputType == 'hex') {
      var dataChunk = data.slice(0, Math.min(data.length, maxShowLength));
      var dots = '';
      if (dataChunk.length < data.length) {
        dots = '...';
      }
      console.log(hexy.hexy(dataChunk) + dots);
    } else {
      console.log(JSON.parse(data));
    }

  });

  var tcpServerInfo = {};
  tcpServerInfo.address = server.info.address;
  tcpServerInfo.port = pipboylib.constants.FALLOUT_TCP_PORT;
  tcpServerInfo.family = server.info.family;

  var clientParser, serverParser;

  if (program.outputType == 'decoded') {
    var clientParser = pipboylib.decoding.createDataStream()
    var serverParser = pipboylib.decoding.createDataStream()

    serverParser.on("readable", function() {
      var e;
      while (e = this.read()) {
        console.log(e);
      }
    });

    clientParser.on("readable", function() {
      var e;
      while (e = this.read()) {
        console.log(e);
      }
    });
  }

  var tcpRelay = new TCPRelay();
  tcpRelay.listen(tcpServerInfo, function (data, telemetry) {
    if (program.metdata) {
      var t = util.format('%s:%d -> %s:%d',
                          telemetry.src.address, telemetry.src.port,
                          telemetry.dst.address, telemetry.dst.port);
      console.error('[TCP Relay] ', t);
    }

    var fromServer = telemetry.src.port === tcpServerInfo.port &&
                     telemetry.src.address === tcpServerInfo.address;

    if (program.outputType == 'hex') {
      var dataChunk = data.slice(0, Math.min(data.length, maxShowLength));
      var dots = '';
      if (dataChunk.length < data.length) {
        dots = '...';
      }
      console.log(hexy.hexy(dataChunk) + dots);
    } else {
      var parser;
      if (fromServer) {
        parser = serverParser;
      } else {
        parser = clientParser;
      }
      parser.write(data);
    }
  });

  if (program.metadata) {
    console.error('UDP and TCP Relay created for:',
                  server.MachineType, 'on', server.info.address)
  }
}).catch(function(err) {
  throw err;
});
