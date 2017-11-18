# Published 
real ble-filter-orphe.js exist in node_modules/sensortag/ directory. 
You should edit following code in orphe-azureiot-shoes.js
```javascript
var dbleTag = null;
var OrpheFilter = require('./ble-filter-orphe');
``` 
And add real uuids. 
```javascript 
var ORPHE_SERVICE_UUID = 'please ask me';
var ORPHE_NOTIFY_UUID = 'please ask me';
var ORPHE_WRITE_UUID = 'please ask me';
``` 
