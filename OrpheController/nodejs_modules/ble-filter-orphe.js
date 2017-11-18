require('date-utils');

var ORPHE_SERVICE_UUID = '<< please ask >>';
var ORPHE_NOTIFY_UUID = '<< please ask >>';
var ORPHE_WRITE_UUID = '<< please ask >>';

var BLEFilter = function() {
    this.lastG = -1;
}

BLEFilter.FromBLEDataToJson = function(characteristic_uuid, data) {
    if (ORPHE_NOTIFY_UUID === characteristic_uuid) {
        var header = << please ask >> ;
        var g = << please ask >> ;
        var s = << please ask >> ;
        //    console.log('onOrpheNotified - called g=' + g);
        if (gesture != << please ask >> && g != this.lastG) {
            //      console.log('\theader = %02x', header);
            console.log('\tgesture = %d', g);
            //  console.log('\tstrength = %d', s);
            this.lastG = g;
            var gesture = '';
            if (g === << please ask >> ) {
                gesture = 'step';
            } else if (g === << please ask >> ) {
                gesture = 'kick';
            } else if (g === << please ask >> ) {
                gesture = 'lift';
            } else if (g === << please ask >> ) {
                gesture = 'turn';
            } else if (g === << please ask >> ) {
                gesture = 'advertise';
            }
            console.log('gesture is :' + gesture);
            if (gesture != '' || (g >= 1 && g <= 4)) {
                var dt = new Date();
                var json = JSON.stringify({
                    'time': dt.toFormat("YYYY-MM-DDTHH24:MI:SS"),
                    'gesture': gesture,
                    'strength': s
                });
                return json;
            }
        }
    } else {
        console.log('characteristic_uuid - unknown:' + characteristic_uuid);
    }
    return null;
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
        if (commands.instructionType === 'orphe') {
            var instructions = commands.instructions;
            // data format should be - {"instructionType":"orphe","instructions":[{"command":"lighting","pattern":1},...]}
            // in the case of "instructionType" doesn't exist , element of instructions should be {"type":"...","service_uuid":,"...","characteristic_uuid","data":"BASE64 encoding"}
            console.log('insturction length - ' + instructions.length);
            for (var i = 0; i < instructions.length; i++) {
                var rinst = {};
                var inst = instructions[i];
                console.log('command is : command=%s,pattern=%d', inst.command, inst.pattern);
                if (inst.command === 'lighting') {
                    var data = << please ask >> ;
                    data[0] = << please ask >> ;
                    data[1] = << please ask >> ;
                    var b = new Buffer(data);
                    var encoded = b.toString('base64');
                    rinst.service_uuid = ORPHE_SERVICE_UUID;
                    rinst.type = 'write_once';
                    rinst.characteristic_uuid = ORPHE_WRITE_UUID;
                    rinst.data = encoded;
                    result.instructions.push(rinst);
                }
            }
        }
    } catch (err) {
        console.log('received data is invalid format JSON - ' + err);
    }
    return result;
}

module.exports = BLEFilter;