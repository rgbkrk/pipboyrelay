require('buffertools').extend();

var hexy = require('hexy');
var buffer = new Buffer('');

var expectedSize = null;

function decodePacket(buffer) {
  var size = buffer.readUInt32LE(0);
  var channel = buffer.readUInt8(4);
  var content = buffer.slice(5);
  return { size: size, channel: channel, content: content };
}

exports.update = function(data, callback) {
  buffer = buffer.concat(data);

  if(!expectedSize) {
    expectedSize = buffer.readUInt32LE(0) + 5;
  }

  if(buffer.length >= expectedSize) {
    callback(decodePacket(buffer.slice(0, expectedSize)));
    buffer = buffer.slice(expectedSize);
    expectedSize = null;
  }
}
