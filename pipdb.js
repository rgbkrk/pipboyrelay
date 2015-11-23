require('buffertools').extend();

var Types = {
  Bool: 0,
  Int8: 1,
  UInt8: 2,
  Int32: 3,
  UInt32: 4,
  Float: 5,
  String: 6,
  List: 7,
  Dictionary: 8
};

var Database = {
  indexedProperties: {},
  propertyTypes: {}
};

exports.decodeDBEntries = function(buffer) {
  var cursor = 0;
  while(cursor <= buffer.length - 5) {
    var type = buffer.readUInt8(cursor);
    var id = buffer.readUInt32LE(cursor + 1);
    Database.propertyTypes[id] = type;

    cursor += 5;

    if(type <= 2) { // 8 bit number
      if(type == 0) {
        Database.indexedProperties[id] = (buffer.readUInt8(cursor) === 0) ? false : true;
      } else if(type == 1) {
        Database.indexedProperties[id] = buffer.readInt8(cursor);
      } else if(type == 2) {
        Database.indexedProperties[id] = buffer.readUInt8(cursor);
      }

      cursor += 1;
    } else if(type <= 5) { // 32 bit number
      if(type === 3) {
        Database.indexedProperties[id] = buffer.readInt32LE(cursor);
      } else if(type === 4) {
        Database.indexedProperties[id] = buffer.readUInt32LE(cursor);
      } else if(type === 5) {
        Database.indexedProperties[id] = buffer.readFloatLE(cursor);
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

      Database.indexedProperties[id] = s;
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

      Database.indexedProperties[id] = refs;
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

      Database.indexedProperties[id] = dict;
      cursor += 2; // skip dummy uint16
    }
  }
}

exports.normalizeDBEntry = function(index) {
  if(Database.propertyTypes[index] == Types.Dictionary) {
    var dict = {};

    for(var i in Database.indexedProperties[index]) {
      dict[i] = exports.normalizeDBEntry(Database.indexedProperties[index][i]);
    }

    return dict;
  } else if(Database.propertyTypes[index] == Types.List) {
    var list = [];

    for(var i in Database.indexedProperties[index]) {
      list.push(exports.normalizeDBEntry(Database.indexedProperties[index][i]));
    }

    return list;
  } else {
    return Database.indexedProperties[index];
  }
}

exports.getNormalizedDB = function() {
  var db = exports.normalizeDBEntry(0);
  return db;
}
