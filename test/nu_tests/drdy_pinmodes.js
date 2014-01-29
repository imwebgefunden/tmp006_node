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

exports.getDRDY_PinModeOk_cb = {
    setUp: function(callback) {
        this.oldConfReg = sens.wire.confReg;
        sens.init(function(err, val) {
            sens.confRegTS--; // fake some time between tests
            callback();
        });
    },
    tearDown: function(callback) {
        sens.wire.confReg = this.oldConfReg;
        callback();
    },
    'get drdy_PinMode should give back "enabled" on enabled mode': function(test) {
        test.expect(2);
        sens.wire.confReg = 0x7500;
        sens.getDrdy_PinMode(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 'enabled');
            test.done();
        });
    },
    'get drdy_PinMode should give back "disabled" on disabled mode': function(test) {
        test.expect(2);
        sens.getDrdy_PinMode(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 'disabled');
            test.done();
        });
    },
    'get drdy_PinMode should not change the timestamp for confReg': function(test) {
        test.expect(3);
        var oldTS = sens.confRegTS;
        var now = +new Date();
        sens.getDrdy_PinMode(function(err, val) {
            test.ifError(err);
            test.strictEqual(sens.confRegTS, oldTS);
            test.ok((sens.confRegTS < now));
            test.done();
        });
    },
};

exports.setDRDY_PinModeOk_cb = {
    setUp: function(callback) {
        this.oldConfReg = sens.wire.confReg;
        sens.init(function(err, val) {
            sens.confRegTS--; // fake some time between tests
            callback();
        });
    },
    tearDown: function(callback) {
        sens.wire.confReg = this.oldConfReg;
        callback();
    },
    'set drdy_PinMode to "enabled" should give back true': function(test) {
        test.expect(2);
        sens.setDrdy_PinMode('enabled', function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 'enabled');
            test.done();
        });
    },
    'set drdy_PinMode to "disabled" should give back true': function(test) {
        test.expect(2);
        sens.setDrdy_PinMode('disabled', function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 'disabled');
            test.done();
        });
    },
    'set drdy_PinMode should set the timestamp for confReg': function(test) {
        test.expect(3);
        var now_ = +new Date() - 1;
        var oldTS = sens.confRegTS;
        sens.setDrdy_PinMode('enabled', function(err, val) {
            test.ifError(err);
            test.notEqual(sens.confRegTS, oldTS);
            test.ok((sens.confRegTS > now_));
            test.done();
        });
    },
};

exports.setDRDY_PinodeFailed_cb = {
    setUp: function(callback) {
        this.oldConfReg = sens.wire.confReg;
        sens.init(function(err, val) {
            sens.confRegTS--; // fake some time between tests
            callback();
        });
    },
    tearDown: function(callback) {
        sens.wire.confReg = this.oldConfReg;
        callback();
    },
    'set drdy_PinMode to a wrong mode should give back an error and false': function(test) {
        test.expect(2);
        sens.setDrdy_PinMode('wrong', function(err, val) {
            test.strictEqual(err.message, 'wrong drdy_pinmode value in set drdy_pinmode command');
            test.strictEqual(val, false);
            test.done();
        });
    },
    'set drdy_PinMode to a wrong mode should not change the confReg': function(test) {
        test.expect(1);
        var oReg = sens.wire.confReg;
        sens.setDrdy_PinMode('dis', function(err, val) {
            test.strictEqual(oReg, sens.wire.confReg);
            test.done();
        });
    },
    'set drdy_PinMode to a wrong mode should not change the timestamp for confReg': function(test) {
        test.expect(2);
        var now = +new Date();
        var oldTS = sens.confRegTS;
        sens.setDrdy_PinMode('ena', function(err, val) {
            test.strictEqual(sens.confRegTS, oldTS);
            test.ok((sens.confRegTS < now));
            test.done();
        });
    },
};
