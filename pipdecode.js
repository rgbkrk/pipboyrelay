require('buffertools').extend();

var buffer = new Buffer('');
var expectedSize = null;

function decodePacket(buffer) {
  var size = buffer.readUInt32LE(0);
  var channel = buffer.readUInt8(4);
  var content = buffer.slice(5);
  return { size: size, channel: channel, content: content };
}

exports.onPacket = null;

exports.update = function(data) {
  buffer = buffer.concat(data);

  if(!expectedSize) {
    expectedSize = buffer.readUInt32LE(0) + 5;
  }

  if(buffer.length >= expectedSize) {
    var packet = decodePacket(buffer.slice(0, expectedSize));

    if(exports.onPacket) {
      exports.onPacket(packet);
    }

    buffer = buffer.slice(expectedSize);
    expectedSize = null;
  }
}
