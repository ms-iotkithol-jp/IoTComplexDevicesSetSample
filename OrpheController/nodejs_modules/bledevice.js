var util = require('util');
var BLETag = require('./bletag');

var targetAddress = process.argv[2];

var BLEDevice = function() {
    console.log('BLEDevice constructor');
};

BLEDevice.discoverAll = function(onDiscover) {
    console.log('BLEDevice.discoverAll');
    BLETag.discoverAll(onDiscover);
};

BLEDevice.stopDiscoverAll = function(onDiscover) {
    BLETag.stopDiscoverAll(onDiscover);
};

BLEDevice.discover = function(callback) {
    console.log('BLEDevice.discover');
    //   console.log('BLETag:' + this.BLETag);
    var onDiscover = function(bleTag) {
        BLETag.stopDiscoverAll(onDiscover);

        callback(bleTag);
    };

    BLEDevice.discoverAll(onDiscover);
};

BLEDevice.discoverByAddress = function(address, callback) {
    address = address.toLowerCase();

    var onDiscoverByAddress = function(bleTag) {
        if (bleTag._peripheral.address === address) {
            BLETag.stopDiscoverAll(onDiscoverByAddress);

            callback(bleTag);
        }
    };

    BLETag.discoverAll(onDiscoverByAddress);
};

BLEDevice.discoverById = function(id, callback) {
    var onDiscoverById = function(sensorTag) {
        if (sensorTag.id === id) {
            BLETag.stopDiscoverAll(onDiscoverById);

            callback(sensorTag);
        }
    };

    BLETag.discoverAll(onDiscoverById);
};

BLEDevice.BLETag = BLETag;

BLEDevice.setAddress = function(address) {
    BLETag.setAddress(address);
};

module.exports = BLEDevice;