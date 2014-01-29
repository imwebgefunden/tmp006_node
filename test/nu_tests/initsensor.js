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

exports.initOk_cb = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        callback();
    },
    'sensor init should give back true': function(test) {
        test.expect(2);
        sens.init(function(err, val) {
            test.ok(val, "init should give back true");
            test.ifError(err);
            test.done();
        });
    }
};

exports.initFailed_cb = {
    setUp: function(callback) {
        this.oldManId = sens.wire.manIdReg;
        this.oldDevId = sens.wire.devIdReg;
        sens.wire.devIdReg = 0xFFFF;
        callback();
    },
    tearDown: function(callback) {
        sens.wire.manIdReg = this.oldManId;
        sens.wire.devIdReg = this.oldDevId;
        callback();
    },
    'init should fail on wrong manufacturer id': function(test) {
        test.expect(1);
        sens.wire.manIdReg = 0xFFFF;
        test.throws(
            function() {
                sens.init(function(err, val) {});
            }, /wrong manufacturer id/);
        test.done();
    },
    'init should fail on wrong device id': function(test) {
        test.expect(1);
        sens.wire.devIdReg = 0xFFFF;
        test.throws(
            function() {
                sens.init(function(err, val) {});
            }, /wrong device id/);
        test.done();
    }
};
