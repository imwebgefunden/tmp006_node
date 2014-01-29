/*
 * This file is part of sensor_tmp006 for node.
 *
 * Bitbucket: https://bitbucket.org/iwg/tmp006_node
 * GitHub   : https://github.com/imwebgefunden/tmp006_node
 *
 * Copyright (C) Thomas Schneider, imwebgefunden@gmail.com
 *
 * sensor_tmp006 for node is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * sensor_tmp006 for node is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with sensor_tmp006 for node. If not, see
 * <http://www.gnu.org/licenses/>.
 */

/* jslint node: true */
"use strict";

var util = require('util');
var Wire = require('i2c');
var events = require('events');
var _ = require('underscore');
var async = require('async');
var debug;
var defaultOptions = {
    'debug': false,
    'address': 0x40,
    'device': '/dev/i2c-1',
    'opMode': 'continuous',
    'convRate': '1',
    'drdy_PinMode': 'disabled',
};

var TMP006 = function(opts) {
    var self = this;

    events.EventEmitter.call(this);
    self.options = _.extend({}, defaultOptions, opts);
    self.s0 = 6.4; // * 10^-14, s. eq 1a und 1b at calcObjTemp()
    self.confRegTS = 0; // timestamp for last confReg write
    self.valRegTS = 0; // timestamp for last vObj- or tAmb-Reg read
    self.wire = new Wire(this.options.address, {
        device: this.options.device,
        debug: this.options.debug
    });
};

util.inherits(TMP006, events.EventEmitter);

TMP006.prototype.registers = {
    'vObj': {
        'location': 0x00,
    },
    'tAmb': {
        'location': 0x01,
    },
    'config': {
        'location': 0x02,
    },
    'manId': {
        'location': 0xFE,
    },
    'devId': {
        'location': 0xFF,
    },
};

TMP006.prototype.allowedIds = {
    'manId': 0x5449,
    'devId': 0x0067,
};

TMP006.prototype.opModes = {
    // << 12, D14:D12
    'powerDown': 0x00,
    'continuous': 0x07,
};

TMP006.prototype.convRates = {
    // << 9, D11-D9, cTime in mSec
    '4': {
        'mask': 0x00,
        'cTime': 250
    },
    '2': {
        'mask': 0x01,
        'cTime': 500
    },
    '1': {
        'mask': 0x02,
        'cTime': 1000
    },
    '0.5': {
        'mask': 0x03,
        'cTime': 2000
    },
    '0.25': {
        'mask': 0x04,
        'cTime': 4000
    },
};

TMP006.prototype.drdy_PinModes = {
    // << 8, D8
    'disabled': 0x00,
    'enabled': 0x01,
};

TMP006.prototype.drdy_BitModes = {
    // << 7, D7
    'inProgress': 0x00,
    'ready': 0x01,
};

TMP006.prototype.init = function(callback) {
    var self = this;

    async.series([

            function(cB) {
                self.getManufacturerId(cB);
            },
            function(cB) {
                self.getDeviceId(cB);
            },
            function(cB) {
                self.setOpMode(self.options.opMode, cB);
            },
            function(cB) {
                self.setConvRate(self.options.convRate, cB);
            },
            function(cB) {
                self.setDrdy_PinMode(self.options.drdy_PinMode, cB);
            },
        ],
        function(err, results) {
            var ts = Math.round(+new Date() / 1000);
            var evData = {
                'addr': self.options.address,
                'type': 'TMP006',
                'ts': ts,
                'error': err
            };
            if (err) {
                self.emit('sensorInitFailed', evData);
                if (callback) callback(err, false);
            } else {
                self.emit('sensorInitCompleted', evData);
                if (callback) callback(null, true);
            }
        });
};

TMP006.prototype.readRegister = function(register, callback) {
    // all registers are 16bit with MSB first
    var self = this;

    if (_.has(self.registers, register) === false) {
        var err = new Error('wrong register in readRegister');
        callback(err, null);
        return;
    }

    self.wire.readBytes(self.registers[register].location, 2, function(err, bytes) {
        if ((register === 'vObj') | (register === 'tAmb')) {
            self.valRegTS = +new Date();
        }
        if (err) {
            callback(err, null);
        } else {
            callback(null, bytes);
        }
    });
};

TMP006.prototype.getManufacturerId = function(callback) {
    var self = this;

    self.readRegister('manId', function(err, bytes) {
        if (err) {
            if (callback) callback(new Error('read manufacturer id failed'), null);
            return;
        }
        var hi = bytes.readUInt8(0);
        var lo = bytes.readUInt8(1);
        var id = (hi << 8) + lo;

        if (id !== 0x5449) {
            throw new Error('wrong manufacturer id');
        } else {
            callback(null, id);
        }
    });
};

TMP006.prototype.getDeviceId = function(callback) {
    var self = this;

    self.readRegister('devId', function(err, bytes) {
        if (err) {
            if (callback) callback(new Error('read device id failed'), null);
            return;
        }
        var hi = bytes.readUInt8(0);
        var lo = bytes.readUInt8(1);
        var id = (hi << 8) + lo;

        if (id !== 0x0067) {
            throw new Error('wrong device id');
        } else {
            callback(null, id);
        }
    });
};

TMP006.prototype.writeConfReg = function(newVal, callback) {
    var self = this;
    var error = null;
    var ret = false;
    var pointer = self.registers.config.location;

    if (!_.isArray(newVal)) {
        error = new Error('writeConfReg: newVal is not an array');
    } else if (newVal.length !== 2) {
        error = new Error('writeConfReg: newVal.length is not 2');
    } else {
        self.wire.writeBytes(pointer, newVal, function(err) {
            if (err) {
                error = new Error('writeConfReg: write failed');
            } else {
                self.confRegTS = +new Date();
                ret = true;
            }
        });
    }
    callback(error, ret);
};

TMP006.prototype.softReset = function(callback) {
    var self = this;
    var resetCmd = [0x80, 0x00]; // 0x8000
    var evData = {
        'addr': self.options.address,
        'type': 'TMP006',
        'ts': 0,
        'error': null
    };

    self.writeConfReg(resetCmd, function(err, val) {
        evData.ts = Math.round(+new Date() / 1000);
        evData.error = err;
        if (err) {
            self.emit('sensorSoftResetStartFailed', evData);
            callback(new Error('softreset not set on write'), false);
        } else {
            self.emit('sensorSoftResetStarted', evData);
            callback(null, true);
        }
    });
};

TMP006.prototype.getOpMode = function(callback) {
    var self = this;
    var mStrO = _.invert(self.opModes);

    self.readRegister('config', function(err, bytes) {
        if (err) {
            callback(new Error('read opmode failed'), null);
            return;
        }
        var hi = bytes.readUInt8(0);
        var opM = (hi >> 4) & 0x07;
        callback(null, mStrO[opM]);
    });
};

TMP006.prototype.setOpMode = function(newMode, callback) {
    var self = this;
    var evData = {
        'addr': self.options.address,
        'type': 'TMP006',
        'setting': 'opMode',
        'newValue': newMode,
        'ts': 0,
        'error': null
    };

    if (_.has(self.opModes, newMode) === false) {
        evData.err = new Error('wrong opmode value in set opmode command');
        evData.ts = Math.round(+new Date() / 1000);
        self.emit('sensorSettingFailed', evData);
        if (callback) callback(evData.err, false);
        return;
    }

    async.waterfall([

            function(cB) {
                self.readRegister('config', cB);
            },
            function(bytes, cB) {
                var hi_ = bytes.readUInt8(0) & 0x0F;
                var lo = bytes.readUInt8(1);
                var nHi = (self.opModes[newMode] << 4) + hi_;
                self.writeConfReg([nHi, lo], cB);
            },
            function(arg1, cB) {
                self.getOpMode(function(err, val) {
                    if (err) {
                        cB(new Error('opmode not set'), 'reread');
                    } else {
                        if (val === newMode) {
                            cB(null, 'reread');
                        } else {
                            cB(new Error('opmode not set'), 'reread');
                        }
                    }
                });
            }
        ],
        function(err, results) {
            evData.ts = Math.round(+new Date() / 1000);
            if (err) {
                evData.error = new Error('new opMode not set');
                self.emit('sensorSettingFailed', evData);
                if (callback) callback(evData.err, null);
            } else {
                self.options.opMode = newMode;
                self.emit('sensorSettingChanged', evData);
                if (callback) callback(null, newMode);
            }
        });
};

TMP006.prototype.getConvRate = function(callback) {
    var self = this;
    var rStrO = _.pairs(self.convRates);

    self.readRegister('config', function(err, bytes) {
        if (err) {
            callback(new Error('read conv rate failed'), null);
            return;
        }
        var hi = bytes.readUInt8(0);
        var cR = (hi >> 1) & 0x07;
        var cR_ = _.find(rStrO, function(s) {
            return s[1].mask === cR;
        });
        if (cR_) {
            callback(null, cR_[0]);
        } else {
            callback(new Error('convRate not in list'), null);
        }
    });
};

TMP006.prototype.setConvRate = function(newMode, callback) {
    var self = this;
    var evData = {
        'addr': self.options.address,
        'type': 'TMP006',
        'setting': 'convRate',
        'newValue': newMode,
        'ts': 0,
        'error': null
    };

    if (_.has(self.convRates, newMode) === false) {
        evData.err = new Error('wrong convRate value in set confRate command');
        evData.ts = Math.round(+new Date() / 1000);
        self.emit('sensorSettingFailed', evData);
        if (callback) callback(evData.err, false);
        return;
    }

    async.waterfall([

            function(cB) {
                self.readRegister('config', cB);
            },
            function(bytes, cB) {
                var hi_ = bytes.readUInt8(0) & 0xF1;
                var lo = bytes.readUInt8(1);
                var nHi = (self.convRates[newMode].mask << 1) | hi_;
                self.writeConfReg([nHi, lo], cB);
            },
            function(arg1, cB) {
                self.getConvRate(function(err, val) {
                    if (err) {
                        cB(new Error('convRate not set'), 'reread');
                    } else {
                        if (val === newMode) {
                            cB(null, 'reread');
                        } else {
                            cB(new Error('convRate not set'), 'reread');
                        }
                    }
                });
            }
        ],
        function(err, results) {
            evData.ts = Math.round(+new Date() / 1000);
            if (err) {
                evData.error = new Error('new convRate not set');
                self.emit('sensorSettingFailed', evData);
                if (callback) callback(evData.err, null);
            } else {
                self.options.convRate = newMode;
                self.emit('sensorSettingChanged', evData);
                if (callback) callback(null, newMode);
            }
        });
};

TMP006.prototype.getDrdy_PinMode = function(callback) {
    var self = this;
    var modInv = _.invert(self.drdy_PinModes);

    self.readRegister('config', function(err, bytes) {
        if (err) {
            callback(new Error('read drdy_pinmode failed'), null);
            return;
        }
        var hi = bytes.readUInt8(0);
        var pM = hi & 0x01;
        callback(null, modInv[pM]);
    });
};

TMP006.prototype.setDrdy_PinMode = function(newMode, callback) {
    var self = this;
    var evData = {
        'addr': self.options.address,
        'type': 'TMP006',
        'setting': 'drdy_PinMode',
        'newValue': newMode,
        'ts': 0,
        'error': null
    };

    if (_.has(self.drdy_PinModes, newMode) === false) {
        evData.err = new Error('wrong drdy_pinmode value in set drdy_pinmode command');
        evData.ts = Math.round(+new Date() / 1000);
        self.emit('sensorSettingFailed', evData);
        if (callback) callback(evData.err, false);
        return;
    }

    async.waterfall([

            function(cB) {
                self.readRegister('config', cB);
            },
            function(bytes, cB) {
                var hi_ = bytes.readUInt8(0) & 0xFE;
                var lo = bytes.readUInt8(1);
                var nHi = self.drdy_PinModes[newMode] | hi_;
                self.writeConfReg([nHi, lo], cB);
            },
            function(arg1, cB) {
                self.getDrdy_PinMode(function(err, val) {
                    if (err) {
                        cB(new Error('drdy_pin mode not set'), 'reread');
                    } else {
                        if (val === newMode) {
                            cB(null, 'reread');
                        } else {
                            cB(new Error('drdy_pin not set'), 'reread');
                        }
                    }
                });
            }
        ],
        function(err, results) {
            evData.ts = Math.round(+new Date() / 1000);
            if (err) {
                evData.error = new Error('new drdy_pinmode not set');
                self.emit('sensorSettingFailed', evData);
                if (callback) callback(evData.err, null);
            } else {
                self.options.drdy_PinMode = newMode;
                self.emit('sensorSettingChanged', evData);
                if (callback) callback(null, newMode);
            }
        });
};

TMP006.prototype.getDrdy_BitMode = function(callback) {
    var self = this;
    var modInv = _.invert(self.drdy_BitModes);

    self.readRegister('config', function(err, bytes) {
        if (err) {
            callback(new Error('read drdy_bitmode failed'), null);
            return;
        }
        var lo = bytes.readUInt8(1);
        var pM = (lo >> 7) & 0x01;
        callback(null, modInv[pM]);
    });
};

TMP006.prototype.readRawVolt = function(callback) {
    var self = this;

    self.readRegister('vObj', function(err, bytes) {
        if (err) {
            callback(new Error('read rawV failed'), null);
            return;
        }
        var hi = bytes.readInt8(0);
        var lo = bytes.readUInt8(1);
        callback(null, (hi << 8) | lo);
    });
};

TMP006.prototype.readRawTemp = function(callback) {
    var self = this;

    self.readRegister('tAmb', function(err, bytes) {
        if (err) {
            callback(new Error('read tAmb failed'), null);
            return;
        }
        var hi = bytes.readInt8(0);
        var lo = bytes.readUInt8(1);
        callback(null, (hi << 8) | lo);
    });
};

TMP006.prototype.calcObjTemp = function(rawV, rawT) {
    var self = this;
    var vObj = rawV;
    var tDie = rawT >> 2;

    tDie *= 1 / 32; // LSB = 1/32°C
    tDie += 273.15; // C in Kelvin

    vObj *= 156.25; // LSB = 156.25 nV
    vObj /= 1000000000; // nV in V

    var tDietRef = tDie - 298.15;

    var s = self.s0 * (1 + tDietRef * (0.00175 - 0.00001678 * tDietRef)); // eq 1
    s /= 10000000; // eq 1a
    s /= 10000000; // eq 1b

    var vOS = -0.0000294 + tDietRef * (-0.00000057 + 0.00000000463 * tDietRef); // eq 2

    var fVobj = (vObj - vOS) * (1 + 13.4 * (vObj - vOS)); // eq 3

    var tObj = Math.sqrt(Math.sqrt(Math.pow(tDie, 4) + fVobj / s)); // eq 4

    tObj -= 273.15; // Kelvin in C
    return (Math.round(tObj * 100) / 100); // dec with .xx)    
};

TMP006.prototype.getObjTemp = function(callback) {
    var self = this;
    var tObj = 0;
    var evData = {
        'addr': self.options.address,
        'type': 'TMP006',
        'valType': 'temperature',
        'ts': 0,
        'error': null,
        'sensVal': -255
    };

    async.series({

            start: function(cB) {
                // check if confRegTS and valRegTS are in Time; otherwise wait for 
                // TODO check if we can work here with DRDY-bit for faster response
                var cTime = self.convRates[self.options.convRate].cTime;
                var now = +new Date();
                var cT = now - self.confRegTS;
                var vT = now - self.valRegTS;
                var wTime = (cT <= vT) ? cT : vT;
                wTime = cTime - wTime;
                if (wTime > 0) {
                    setTimeout(cB, wTime);
                } else {
                    cB();
                }
            },
            rV: function(cB) {
                self.readRawVolt(cB);
            },
            rT: function(cB) {
                self.readRawTemp(cB);
            },
        },
        function(err, result) {
            evData.ts = Math.round(+new Date() / 1000);
            evData.error = err;
            if (err) {
                self.emit('sensorValueError', evData);
                if (callback) callback(err, -255);
            } else {
                tObj = self.calcObjTemp(result.rV, result.rT);
                evData.sensVal = tObj;
                self.emit('newSensorValue', evData);
                if (callback) callback(null, tObj);
            }
        });
};

TMP006.prototype.getAllValues = function(callback) {
    var self = this;
    var tObj = 0;
    var tDie = 0;
    var evData = {
        'addr': self.options.address,
        'type': 'TMP006',
        'ts': 0,
        'error': null
    };


    async.series({

            start: function(cB) {
                // check if confRegTS and valRegTS are in Time; otherwise wait for 
                // TODO check if we can work here with DRDY-bit for faster response
                var cTime = self.convRates[self.options.convRate].cTime;
                var now = +new Date();
                var cT = now - self.confRegTS;
                var vT = now - self.valRegTS;
                var wTime = (cT <= vT) ? cT : vT;
                wTime = cTime - wTime;
                if (wTime > 0) {
                    setTimeout(cB, wTime);
                } else {
                    cB();
                }
            },
            rV: function(cB) {
                self.readRawVolt(cB);
            },
            rT: function(cB) {
                self.readRawTemp(cB);
            },
        },
        function(err, result) {
            evData.ts = Math.round(+new Date() / 1000);
            evData.error = err;
            if (err) {
                self.emit('sensorValuesError', evData);
                if (callback) callback(err, null);
            } else {
                tDie = result.rT >> 2;
                tDie *= 1 / 32; // LSB = 1/32°C
                tObj = self.calcObjTemp(result.rV, result.rT);
                var devData = {
                    devData: {
                        objTemperature: {
                            unit: '°C',
                            value: tObj,
                        },
                        dieTemperature: {
                            unit: '°C',
                            value: Math.round(tDie * 100) / 100,
                        },
                    },
                    rawData: {
                        addr_0x00: result.rV,
                        addr_0x01: result.rT,
                    }
                };
                evData.sensValues = devData;
                self.emit('newSensorValues', evData);
                if (callback) callback(null, evData);
            }
        });

};

module.exports = TMP006;
