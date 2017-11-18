require('date-utils');

var BLEFilter = function() {
    this.lastG = -1;
}

BLEFilter.FromBLEDataToJson = function(characteristic_uuid, data) {
    var dt = new Date();
    var json = JSON.stringify({
        'time': dt.toFormat("YYYY-MM-DDTHH24:MI:SS"),
        'characteristic_uuid': characteristic_uuid,
        'data': data.toString('base64')
    });
    return json;
}

BLEFilter.FromJsonToBLEData = function(data) {
    var result = {};
    result.instructions = [];
    try {
        var commands = JSON.parse(data.toString());
        if (!commands.instructionType) {
            console.log("received ble raw data command");
            return commands;
        }
    } catch (err) {
        console.log('received data is invalid format JSON - ' + err);
    }
    return result;
}

module.exports = BLEFilter;