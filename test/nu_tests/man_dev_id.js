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

exports.getManIdOk_cb = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        callback();
    },
    'get man id should give back "0x5449"': function(test) {
        test.expect(2);
        sens.getManufacturerId(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 0x5449, 'get a wrong manId value');
            test.done();
        });
    }
};

exports.getManIdFailed_cb = {
    setUp: function(callback) {
        this.oldManId = sens.wire.manIdReg;
        sens.wire.manIdReg = 0xFFFF;
        callback();
    },
    tearDown: function(callback) {
        sens.wire.manIdReg = this.oldManId;
        callback();
    },
    'get man id should raise an error if manId is not "0x5449"': function(test) {
        test.expect(1);
        test.throws(
            function() {
                sens.getManufacturerId(function(err, val) {});
            }, /wrong manufacturer id/);
        test.done();
    }
};

exports.getDevIdOk_cb = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        callback();
    },
    'get dev id should give back "0x0067"': function(test) {
        test.expect(2);
        sens.getDeviceId(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 0x0067, 'get a wrong devId value');
            test.done();
        });
    }
};

exports.getDevIdFailed_cb = {
    setUp: function(callback) {
        this.oldDevId = sens.wire.devIdReg;
        sens.wire.devIdReg = 0xFFFF;
        callback();
    },
    tearDown: function(callback) {
        sens.wire.devIdReg = this.oldDevId;
        callback();
    },
    'get man id should raise an error if manId is not "0x0067"': function(test) {
        test.expect(1);
        test.throws(
            function() {
                sens.getDeviceId(function(err, val) {});
            }, /wrong device id/);
        test.done();
    }
};
