// Unfortunatry current code doesn't work!
// 'undefined symbol: node_module_register' error happen!
// ../../../build/samples/nodejs_simple_sample ../src/ble_nodejs_orphe.json
// 
'use strict';

var async = require('async');
var BLEDevice = require('./bledevice');
var bleDataFilter = require('./ble-filter-orphe');

var BleTagReader = function(bleTagWorker, characteristic_uuid) {
    this.bleTagWoerker = bleTagWorker;
    this.characteristic_uuid = characteristic_uuid;
};

BleTagReader.onDataAvailable = function(data) {
    var dataJson = bleDataFilter.FromBLEDataToJson(this.characteristic_uuid, data);
    if (dataJson != null) {
        this.bleTagWorker.broker.publish({
            properties: {
                'source': 'ble-node',
                'macAddress': this.bleTagWorker.bleTag.address
            },
            content: Buffer.from(dataJson)
        });
    }
};

var rippingPyphen = function(original) {
    var result = original;
    if (original.indexOf('-') > 0) {
        var sl = original.split('-');
        result = sl[0];
        for (var i = 1; i < sl.length; i++) {
            result += sl[i];
        }
    }
    console.log('ripped from %s to %s', original, result);
    return result;
}
var parseeAndExecute = function(bleTagWorker, instructions) {
    var blespec = bleTagWorker.config;
    var bleTag = bleTagWorker.bleTag;
    for (var j = 0; j < instructions.length; j++) {
        var inst = instructions[i];
        if ((!inst.type) || (!inst.service_uuid) || (!inst.characteristic_uuid)) {
            console.log('instruction error - json should have type, service_uuid, characteristic_uuid!');
        } else {
            var inst_service_uuid = rippingPyphen(inst.service_uuid);
            var inst_charcteristic_uuid = rippingPyphen(inst.characteristic_uuid);
            if ((inst.type === 'write_at_init' && bleTagWorker.state === 0) || (inst.type === 'write_once') || (inst.type === 'write_at_exit' && bleTagWorker.state === 2)) {
                var data = new Buffer(inst.data, 'base64');
                bleTag.writeDataCharacteristic(inst_service_uuid, inst_characteristic_uuid, data, function(err) {
                    if (err) console.log('Write error - ' + err.message);
                    else console.log("Written!");
                });

            } else if (inst.type === 'read_once') {
                var bleTagReader = new BleTagReader(bleTagWorker, inst.characteristic_uuid);
                bleTag.readDataCharacteristic(inst_service_uuid, inst_characteristic_uuid, function(error, data) {
                    if (error) {
                        console.error(error.message);
                    } else {
                        bleTagReader.onDataAvailable(data);
                    }
                });
            } else if (inst.type === 'start_notify') {
                var bleTagReader = new BleTagReader(bleTagWorker, inst.characteristic_uuid);
                bleTag.notifyCharacteristic(inst_service_uuid, inst_characteristic_uuid, true, bleTagReader.onDataAvailable, function(error) {
                    if (error) {
                        console.log('start notify error - ' + error);
                    } else {
                        console.log('notify started ...');
                    }
                });

            } else if (inst.type === 'end_notify') {
                dbleTag.notifyCharacteristic(inst_service_uuid, inst_characteristic_uuid, false, null, function(error) {
                    if (error) {
                        console.log('end notify error - ' + error);
                    } else {
                        console.log('notify stopped ...');
                    }
                });

            } else if (inst.type === 'read_periodic') {

            } else {

            }
        }
    }
};

var BleTagWorker = function(broker, bleTag) {
    this.broker = broker;
    this.bleTag = bleTag;
    this.state = 0;
};

BleTagWorker.OnNotify = function(data) {
    var dataJson = bleDataFilter.FromBLEDataToJson(data);
    if (data != null) {
        this.broker.publish({
            properties: {
                'source': 'ble-node',
                'macAddress': this.bleTag.address
            },
            content: Buffer.from(dataJson)
        });
        client.sendEvent(new Message(data), function(error) {
            if (error) console.log(error)
            else console.log('send data - ' + data);
        });
    }

}

// This gateway module simply publishes whatever it receives.
module.exports = {
    broker: null,
    config: null,
    bleTagWorkers: null,
    create: function(broker, configuration) {
        console.log('ble-nodejs creating... with ' + configuration);
        this.broker = broker;
        this.config = JSON.parse(configuration);
        this.bleTagWorkers = [];
        for (var i = 0; i < config.length; i++) {
            var deviceMacAddress = config[i].macAddress;
            BLEDevice.discoverByAddress(deviceMacAddress, function(bleTag) {
                console.log('discovered:  ' + bleTag);
                var bleTagWorker = new BleTagWorker(this.broker, bleTag);
                bleTags.push(bleTagWorker);
                bleTag.on('disconnect', function() {
                    console.log('disconnect:' + bleTag);
                });

                console.log('connected:' + bleTag);
                console.log('dbleTag=' + dbleTag);
                async.series([
                    function(callback) {
                        console.log('Connect and Setup...');
                        dbleTag.connectAndSetup(callback);
                    }
                ]);
            });
        }
    },

    start: function() {
        console.log('ble-nodejs starting...');
        for (var i = 0; i < this.config.length; i++) {
            var blespec = config[i];
            for (var j = 0; j < bleTagWorkers.length; j++) {
                if (bleTagWorkers[j].bleTag.address === blespec.device_mac_address) {
                    console.log('parsing to execute for ' + blespec.device_mac_address);
                    parseeAndExecute(bleTagWorkers[j], blespec.instructions);
                    bleTagWorkers.state = 1;
                    break;
                }
            }
        }
    },
    receive: function(message) {
        var deviceMacAddress = message.properties['macAddress'];
        console.log('Recieved message from broker - ' + deviceMacAddress);
        let buf = Buffer.from(message.content);
        console.log(`forward.receive - ${buf.toString('utf8')}`);
        var instructions = bleDataFilter.FromJsonToBLEData(buf.toString('utf8'));
        for (var i = 0; i < bleTagWoerkers.length; i++) {
            if (deviceMacAddress === bleTagWoerkers[i].bleTag.address) {
                parseeAndExecute(bleTagWorkers[i], instructions);
                break;
            }
        }
    },
    destroy: function() {
        this.broker = null;
        for (var i = 0; i < config.length; i++) {
            for (var j = 0; j < bleTagWorkers.length; j++) {
                if (config.device_mac_address === bleTagWorkers[j].bleTag.address) {
                    bleTagWoerkers[j].state = 2;
                    parseeAndExecute(bleTagWoerkers[j], config.instructions);
                    break;
                }
            }
        }
        for (var i = 0; i < bleTags.length; i++) {
            bleTags[i].disconnect(function(err) {
                if (err) console.log('Disconnect error - ' + err.message);
            });
        }
    }
};