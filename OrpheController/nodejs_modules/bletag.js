var NobleDevice = require('noble-device');

var BLETag = function(peripheral) {
    //   console.log('BLETag = function(peripheral' + peripheral);
    NobleDevice.call(this, peripheral);

    this.type = 'ble device';
};

BLETag.setAddress = function(address) {
    this.targetAddress = address;
}

//BLETag.is = function(peripheral) {
//    console.log('BLETag.is - taddress=' + targetAddress + ',address=' + peripheral.address);
//    return (peripheral.address === targetAddress.toLowerCase());
//};

BLETag.prototype.toString = function() {
    return JSON.stringify({
        id: this.id,
        type: this.type
    });
};

BLETag.prototype.notify = function(CHAR_UUID, CHAR_DATA_UUID, onDataChanged, callback) {
    this.notifyCharacteristic(CHAR_UUID, CHAR_DATA_UUID, true, onDataChanged, callback);
};

BLETag.prototype.unnotifyIr = function(CHAR_UUID, CHAR_DATA_UUID, onDataChanged, callback) {
    this.notifyCharacteristic(CHAR_UUID, CHAR_DATA_UUID, false, onDataChanged, callback);
};

BLETag.prototype.setPeriod = function(CHAR_UUID, CHAR_PERIOD_UUID, period, callback) {
    this.writeUInt8Characteristic(CHAR_UUID, CHAR_PERIOD_UUID, period, callback);
};

NobleDevice.Util.inherits(BLETag, NobleDevice);
NobleDevice.Util.mixin(BLETag, NobleDevice.DeviceInformationService);
NobleDevice.Util.mixin(BLETag, NobleDevice.BatteryService);

module.exports = BLETag;