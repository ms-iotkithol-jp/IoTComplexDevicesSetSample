![Orphe on Edge](../images/OrpheOnEdge.png)
※ Current codes are just only sample using IoT Device SDK for NodeJS.
# Setup 
## Install 
At first, install Raspbian on Raspberry Pi 3 
After installing Raspbian, update NodeJS latest version. see [How to update NodeJS on Raspbain](https://www.raspberrypi.org/forums/viewtopic.php?f=34&t=140747). 
Next, install BlueZ 5.73. see [Azure IoT Edge SDK BLE Gateway Sample Installation](https://github.com/Azure/iot-edge/blob/master/v1/samples/ble_gateway/iot-hub-iot-edge-physical-device.md#install-bluez-537). 
Next, install base development tools and clone IoT Edge Ver 1 repository. see [Set up a Linux Development Environment](https://github.com/Azure/iot-edge/blob/master/v1/doc/devbox_setup.md#set-up-a-linux-development-environment). 

## Build 
First, build NodeJS baseline. 
```bash
$ cd iot-edge/v1 
$ tools/build_nodejs.sh 
``` 
※ Don't forget to execute export 2 environment variables after build. 

Next, build SDK.
```bash
$ tools/build.sh --enable-nodejs-binding 
``` 

## Setup BLE Node Module 
Make directory 'ble_nodejs' under samples directory of iot-edge. 
```bash 
$ cd samples 
$ mkdir ble_nodejs
$ cd ble_nodejs
$ cp -fr [OrpheController]/nodejs_modules . 
$ cp -fr [OrpheController]/src . 
``` 
Install [node-sensortag](https://github.com/sandeepmistry/node-sensortag). 
```bash 
$ npm install -g node-gyp 
$ npm install sensortag 
$ npm install
``` 

※ As default, noble can be run by sudo only. When you want to run by normal user, please do following. 
```bash
sudo apt-get install libcap2-bin
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```

## Run! 
### Run on IoT Edge SDK Ver 1 
Edit src/ble_nodejs_orphe.json for your Orphe shoes' MAC Address and Azure IoT Hub environment. 
```bash
$ ../../build/samples/nodejs_simple_sample src/ble_nodejs_orphe.json
```
※ Current published sources doesn't work by two reason. Any contribution to resolve noble is not able to load on Edge Runtimme is welcome.  
※ ble_nodejs_sample.json is a sample for CC2650 sensor tag. 
### Run on IoT Device SDK for node
```bash
$ cd nodejs_modules
$ node orphe-azureiot-shoe.js <<AA:BB:CC:DD:EE:FF>> '<<IoT Hub Connection String for Device Id>>'
```
This script can communicate with only one shoe. 
When this script is run at same time on different two shell, only one script execution of script works so that I can't connect two shoes from one Raspberry Pi 3 at same time. 
Any contribution to resolve this problem is welcome!
