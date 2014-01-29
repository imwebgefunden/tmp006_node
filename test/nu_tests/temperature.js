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

var async = require('async');
var i2cFakeDev = require('../fakedevice/fake_i2c_tmp006_dev.js');
var proxyquire = require('proxyquire').noCallThru();

var TMP006 = proxyquire('./../../tmp006', {
    'i2c': i2cFakeDev
});

var sens = new TMP006();

exports.getObjTempOk_cb = {
    setUp: function(callback) {
        sens.init(callback);
    },
    tearDown: function(callback) {
        callback();
    },
    'getObjTemp should give back a value': function(test) {
        test.expect(2);
        sens.getObjTemp(function(err, val) {
            test.strictEqual(val, 0.68);
            test.ifError(err);
            test.done();
        });
    },
    'get all values should give back data ': function(test) {
        test.expect(2);
        var devData = {
            addr: 64,
            type: 'TMP006',
            ts: 0,
            error: null,
            sensValues: {
                devData: {
                    objTemperature: {
                        unit: '°C',
                        value: 0.68
                    },
                    dieTemperature: {
                        unit: '°C',
                        value: 16.63
                    }
                },
                rawData: {
                    addr_0x00: -732,
                    addr_0x01: 2128,
                }
            }
        };
        sens.getAllValues(function(err, val) {
            test.ifError(err);
            // clone the timestamp
            devData.ts = val.ts;
            test.deepEqual(val, devData, 'failure at all values');
            test.done();
        });
    },
};


exports.readTimestamp_cb = {
    setUp: function(callback) {
        sens.valRegTS = 0;
        sens.init(callback);
    },
    tearDown: function(callback) {
        callback();
    },
    'getObjTemp should set the timestamp for valRegTS': function(test) {
        test.expect(3);
        var now_ = +new Date() - 1;
        var oldTS = sens.valRegTS;
        sens.getObjTemp(function(err, val) {
            test.ifError(err);
            test.notEqual(sens.valRegTS, oldTS);
            test.ok((sens.valRegTS > now_));
            test.done();
        });
    },
    'getAllValues should set the timestamp for valRegTS': function(test) {
        test.expect(3);
        var now_ = +new Date() - 1;
        var oldTS = sens.valRegTS;
        sens.getAllValues(function(err, val) {
            test.ifError(err);
            test.notEqual(sens.valRegTS, oldTS);
            test.ok((sens.valRegTS > now_));
            test.done();
        });
    },
    'readRawVolt should set the timestamp for valRegTS': function(test) {
        test.expect(3);
        var now_ = +new Date() - 1;
        var oldTS = sens.valRegTS;
        sens.readRawVolt(function(err, val) {
            test.ifError(err);
            test.notEqual(sens.valRegTS, oldTS);
            test.ok((sens.valRegTS > now_));
            test.done();
        });
    },
    'readRawTemp should set the timestamp for valRegTS': function(test) {
        test.expect(3);
        var now_ = +new Date() - 1;
        var oldTS = sens.valRegTS;
        sens.readRawTemp(function(err, val) {
            test.ifError(err);
            test.notEqual(sens.valRegTS, oldTS);
            test.ok((sens.valRegTS > now_));
            test.done();
        });
    },
};
