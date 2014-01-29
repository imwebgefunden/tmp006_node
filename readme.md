# Sensor TMP006 for node.js
---
A node.js module for working with the temperature sensor TMP006 via i2c.

## About the sensor
The TMP006 sensor measures the temperature of an object without making contact with it. The sensor detects the temperature by absorbing IR waves emitted in a range of -40°C to 125°C.
Breakouts with the sensor are available at [adafruit](http://www.adafruit.com/products/1296), [watterott (Germany)](http://www.watterott.com/de/Contact-less-Infrared-Thermopile-Sensor-Breakout-TMP006) and [sparkfun](https://www.sparkfun.com/products/11859).

## Install
```
$ npm install sensor_tmp006
```
#### Raspberry PI
Enable [i2c on your Pi](https://github.com/kelly/node-i2c#raspberry-pi-setup) if you haven't done already. To avoid having to run the i2c tools as root add the ‘pi’ user to the i2c group:
```
sudo adduser pi i2c
```

## Usage
The module is easy to use. You have different config-options 

### Simple Usage
```
var TMP006 = require('sensor_tmp006');

var sense = new TMP006();
sense.init(function(err, val) {
  if (!err) {
    sense.getObjTemp(function(error, val) {
      if (!error) console.log(val + ' °C');
    });    
  }
});
```
 
### Don't forget to call init()
```ìnit([cB])``` powers up the sensor and sets the given options. ```init()``` fires an ```sensorInitCompleted``` or  ```sensorInitFailed``` event.

### Options
The default options are:
```
{
  'debug': false,
  'address': 0x40,
  'device': '/dev/i2c-1',
  'opMode': 'continuous',
  'convRate': '1',
  'drdy_PinMode': 'disabled',
}
```

Configure the sensor by supplying an options object to the constructor like:
```
var sense = new TMP006({
  'convRate': '0.25',
  'drdy_PinMode': 'enabled',
});
```

### Getter & Setter for sensor settings
Getter supports only callbacks. Setter supports callbacks and event-emitters - ```sensorSettingChanged``` and ```sensorSettingFailed```. Getter and setter are:
```
getOpMode(cB) / setOpMode(newMode, [cB]) / modes: 'powerDown', 'continuous'
getConvRate(cB) / setConvRate(newMode, [cB]) / modes: '4', '2', '1', '0.5', '0.25
getDrdy_PinMode(cB) / setDrdy_PinMode(newMode, [cB]) / modes: 'disabled', 'enabled'
```

### Specials a la softreset, DRDY_-bit and S0-value
To perform a soft reset call:

```
softReset([cB]);
```
The optional ```cB``` is called after the softreset-cmd was send to the sensor - not if the softreset is finished! At the same time an event (```sensorSoftResetStarted```) will be emitted. In case of an error the event is ```sensorSoftResetStartFailed```.

You can read the state of the flipped data ready bit (DRDB_) with:
```
getDrdy_BitMode(cB) / gives back 'inProgress' or 'ready'
```
The ```cB``` is mandatory.

The default ```S0``` value for equatition 1 is ```6.4```. To change this use:
```
sense.s0 = 6.5;
```
Without a new value you get the currently used value. For more details see chapter 5.1 and 6 of TMP006's user guide.

### Temperature-Measurements
Measurement-functions using a callback and some of them an event-emitter. All events including a timestamp and additional data like the address to determine the sensor, who emitted the event.

* ```getObjTemp([cB])``` - the calculated object temperature in °C - emits event ```newSensorValue``` on success or ```sensorValueError``` on error
* ```getAllValues([cB])``` - all values (raw and calculated - dieTemperature too) - emits event ```newSensorValues``` on success or ```sensorValuesError``` on error

## Tests
Because it's not really a good idea to run test in an unknown environment all tests under test using a faked devices and not really your i2c bus. The faked device using a faked i2c-bus which is realised with the proxyquire module.

To run the complete test suite nodeunit is required. The best way is using grunt and the shipped gruntfile which comes with this module.

## Examples
All examples are using a real device on address ```0x40``` on your i2c bus. Be carefully if you have more as one device on your i2c or/and if you don't use the default address for the sensor.

## Licence
The licence is GPL v3 and the module is available at [Bitbucket](https://bitbucket.org/iwg/tmp006_node) and [GitHub](https://github.com/imwebgefunden/tmp006_node).