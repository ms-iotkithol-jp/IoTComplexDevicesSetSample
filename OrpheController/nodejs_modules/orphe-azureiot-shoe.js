// node orphe-azureiot-shoe.js <<mac-address>> '<< iot hub connection string for device-id >>'

var async = require('async');
require('date-utils');

if (process.argv.length !== 4) {
    console.log('sudo orphe-azureiot-shoe.js mac_address device_connection_string');
    process.exit(0);
}

console.log('orphe:' + process.argv[2]);
console.log('connection string:' + process.argv[3]);

//var targetAddress = process.argv[2];
var deviceMacAddress = process.argv[2];
var connectionString = process.argv[3];

// use factory function from AMQP-specific package
//var device = require('azure-iot-device');
//var client = device.Client.fromConnectionString(connectionString, device.Amqp);

var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;

// AMQP-specific factory function returns Client object from core package
var client = clientFromConnectionString(connectionString);
var Message = require('azure-iot-device').Message;
var BLEDevice = require('./bledevice');

var dbleTag = null;
var OrpheFilter = require('./ble-filter-orphe');

var ORPHE_SERVICE_UUID = '<< please ask >>';
var ORPHE_NOTIFY_UUID = '<< please ask >>';
var ORPHE_WRITE_UUID = '<< please ask >>';

var onOrpheNotified = function(data) {
    var dataJson = OrpheFilter.FromBLEDataToJson(ORPHE_NOTIFY_UUID, data);
    if (dataJson != null) {
        client.sendEvent(new Message(dataJson), function(error) {
            if (error) console.log(error)
            else console.log('send data - ' + dataJson);
        });
    }
};

// use Message object from core package

var iotConnectCallback = function(err) {
    if (err) {
        console.error('Could not connect: ' + err.Message);
    } else {
        console.log('Connected to IoT Hub');
        console.log('BLE connection...');
        BLEDevice.discoverByAddress(deviceMacAddress, function(bleTag) {
            console.log('try to connect ' + deviceMacAddress);
            console.log('discovered:  ' + bleTag);
            dbleTag = bleTag;
            bleTag.on('disconnect', function() {
                console.log('disconnect:' + bleTag);
                client.close(function(err, result) {
                    if (err) console.log('IoT Hub close failed: ' + err.message);
                });
                process.exit(0);
            });

            onConnected(bleTag);
        });
    }
}


var onConnected = function(bleTag) {
    console.log('connected:' + bleTag);
    console.log('dbleTag=' + dbleTag);
    async.series([
        function(callback) {
            console.log('Connect and Setup...');
            dbleTag.connectAndSetup(callback);
        },
        function(callback) {
            console.log('Waiting ... 5000 msec');
            setTimeout(callback, 5000);
        },
        function(callback) {
            console.log('Try start notify receive gesture');
            dbleTag.notifyCharacteristic(ORPHE_SERVICE_UUID, ORPHE_NOTIFY_UUID, true, onOrpheNotified, function(error) {
                if (error) {
                    console.log('notify error - ' + error);
                } else {
                    console.log('notify started ...');
                }
            });
            callback();
        }
    ]);

    client.on('message', function(msg) {
        var receivedData = OrpheFilter.FromJsonToBLEData(msg.getData());

        try {
            //            var commands = JSON.parse(receivedData);
            console.log('received json - ' + receivedData);
            var instructions = receivedData.instructions;
            console.log('insturction length - ' + instructions.length);
            for (var i = 0; i < instructions.length; i++) {
                var inst = instructions[i];
                console.log('command is : ' + inst);
                if (inst.type === 'write_once') {
                    var service_uuid = inst.service_uuid;
                    var characteristic_uuid = inst.characteristic_uuid;
                    var data = new Buffer(inst.data, 'base64');
                    var rawdata = new Uint8Array(data);
                    if (rawdata[0] === 52) { // TODO: will delete this check because this data is generated in ble-filter
                        dbleTag.writeDataCharacteristic(service_uuid, characteristic_uuid, data, function(err) {
                            if (err) console.log(err);
                            else console.log("Written! service_uuid=" + inst.service_uuid + ",characteristic_uuid=" + inst.characteristic_uuid + ",data=" + inst.data);
                        });
                    }
                }
            }
        } catch (err) {

            console.log('parse received message' + err);
        }

    });
    console.log('all done!');
};

client.open(iotConnectCallback);

console.log('Why this show?');