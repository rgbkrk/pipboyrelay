require('buffertools').extend();

var dbIndices = {};
var dbTypes = {};

var dbEntryType = ['Bool', 'Int8', 'UInt8', 'Int32', 'UInt32', 'Float', 'String', 'List', 'Dictionary'];

exports.decodeDBEntries = function(buffer) {
  var cursor = 0;
  while(cursor <= buffer.length - 5) {
    var type = buffer.readUInt8(cursor);
    var id = buffer.readUInt32LE(cursor + 1);
    dbTypes[id] = dbEntryType[type];

    cursor += 5;

    if(type <= 2) { // 8 bit number
      if(type == 0) {
        dbIndices[id] = (buffer.readUInt8(cursor) === 0) ? false : true;
      } else if(type == 1) {
        dbIndices[id] = buffer.readInt8(cursor);
      } else if(type == 2) {
        dbIndices[id] = buffer.readUInt8(cursor);
      }

      cursor += 1;
    } else if(type <= 5) { // 32 bit number
      if(type === 3) {
        dbIndices[id] = buffer.readInt32LE(cursor);
      } else if(type === 4) {
        dbIndices[id] = buffer.readUInt32LE(cursor);
      } else if(type === 5) {
        dbIndices[id] = buffer.readFloatLE(cursor);
      }

      cursor += 4;
    } else if(type === 6) { // string
      var s = '';
      for(var i = cursor; i < buffer.length; i++) {
        if(buffer[i] != 0) {
          s += String.fromCharCode(buffer[i]);
        } else {
          break;
        }
      }

      dbIndices[id] = s;
      cursor += s.length + 1;
    } else if(type === 7) { // list
      var count = buffer.readUInt16LE(cursor);
      cursor += 2;

      var refs = [];
      for(var i = 0; i < count; i++) {
        var refId = buffer.readUInt32LE(cursor);
        refs.push(refId);
        cursor += 4;
      }

      dbIndices[id] = refs;
    } else if(type === 8) { // dict
      var count = buffer.readUInt16LE(cursor);
      cursor += 2;

      var dict = {};

      for(var i = 0; i < count; i++) {
        var refId = buffer.readUInt32LE(cursor);
        cursor += 4;

        var name = '';
        for(var q = cursor; q < buffer.length; q++) {
          if(buffer[q] == 0) {
            break;
          } else {
            name += String.fromCharCode(buffer[q]);
          }
        }

        cursor += name.length + 1;
        dict[name] = refId;
      }

      dbIndices[id] = dict;
      cursor += 2; // skip dummy uint16
    }
  }
}

exports.normalizeDBEntry = function(index) {
  if(dbTypes[index] === 'Dictionary') {
    var dict = {};

    for(var i in dbIndices[index]) {
      dict[i] = exports.normalizeDBEntry(dbIndices[index][i]);
    }

    return dict;
  } else if(dbTypes[index] === 'List') {
    var list = [];

    for(var i in dbIndices[index]) {
      list.push(exports.normalizeDBEntry(dbIndices[index][i]));
    }

    return list;
  } else {
    return dbIndices[index];
  }
}

exports.getNormalizedDB = function() {
  return exports.normalizeDBEntry(0);
}
