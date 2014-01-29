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

exports.getDRDY_BitModeOk_cb = {
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
    'get drdy_BitMode should give back "inProgress" on inProgress mode': function(test) {
        test.expect(2);
        sens.wire.confReg = 0x7400;
        sens.getDrdy_BitMode(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 'inProgress');
            test.done();
        });
    },
    'get drdy_BitMode should give back "ready" on ready mode': function(test) {
        test.expect(2);
        sens.wire.confReg = 0x7480;
        sens.getDrdy_BitMode(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 'ready');
            test.done();
        });
    },
    'get drdy_BitMode should not change the timestamp for confReg': function(test) {
        test.expect(3);
        var oldTS = sens.confRegTS;
        var now = +new Date();
        sens.getDrdy_BitMode(function(err, val) {
            test.ifError(err);
            test.strictEqual(sens.confRegTS, oldTS);
            test.ok((sens.confRegTS < now));
            test.done();
        });
    },
};
