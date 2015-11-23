var dgram = require('dgram')

var FALLOUT_UDP_PORT = 28000;
var FALLOUT_TCP_PORT = 27000;
var AUTODISCOVERY_PAYLOAD = '{"cmd":"autodiscover"}'

exports.discover = function(cb) {
  var client = dgram.createSocket('udp4')

  function socketFn() {
    client.setBroadcast(true);
    var message = new Buffer(AUTODISCOVERY_PAYLOAD);

    client.on('message', function (msg, rinfo) {
      try {
        var server = JSON.parse(msg.toString());
        server.info = rinfo;
        client.close();
        cb(undefined, server);
      } catch (e) {
        cb(e, undefined);
        client.close();
        return;
      }
    });

    client.send(message, 0, message.length, FALLOUT_UDP_PORT, '255.255.255.255', function (err) {
      if (err) {
        client.close();
        cb(err);
      }
    });
  }

  client.bind(null, null, socketFn);
}
