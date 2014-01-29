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

exports.getConvRateOk_cb = {
    setUp: function(callback) {
        this.oldConfReg = sens.wire.confReg;
        sens.wire.confReg = 0x7400;
        sens.init(function(err, val) {
            sens.confRegTS--; // fake some time between tests
            callback();
        });
    },
    tearDown: function(callback) {
        sens.wire.confReg = this.oldConfReg;
        callback();
    },
    'get convRate should give back "4" in 4 mode': function(test) {
        test.expect(2);
        sens.wire.confReg = 0x7000;
        sens.getConvRate(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, '4');
            test.done();
        });
    },
    'get convRate should give back "2" in 2 mode': function(test) {
        test.expect(2);
        sens.wire.confReg = 0x7200;
        sens.getConvRate(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, '2');
            test.done();
        });
    },
    'get convRate should give back "1" in 1 mode': function(test) {
        test.expect(2);
        sens.wire.confReg = 0x7400;
        sens.getConvRate(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, '1');
            test.done();
        });
    },
    'get convRate should give back "0.5" in 0.5 mode': function(test) {
        test.expect(2);
        sens.wire.confReg = 0x7600;
        sens.getConvRate(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, '0.5');
            test.done();
        });
    },
    'get convRate should give back "0.25" in 0.25 mode': function(test) {
        test.expect(2);
        sens.wire.confReg = 0x7800;
        sens.getConvRate(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, '0.25');
            test.done();
        });
    },
    'get convRate should not change the timestamp for confReg': function(test) {
        test.expect(3);
        var oldTS = sens.confRegTS;
        var now = +new Date();
        sens.getConvRate(function(err, val) {
            test.ifError(err);
            test.strictEqual(sens.confRegTS, oldTS);
            test.ok((sens.confRegTS < now), 'kkk');
            test.done();
        });
    },
};

exports.setConvRateOk_cb = {
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
    'set convRate to rates should call cb with no error and new value': function(test) {
        var convRateArr = Object.keys(sens.convRates);
        test.expect(1 + (convRateArr.length));
        async.eachSeries(convRateArr, function(newMode, cB) {
                sens.setConvRate(newMode, function(err, nM) {
                    test.strictEqual(nM, newMode, 'mode not set');
                    cB(err);
                });
            },
            function(err) {
                test.ifError(err);
                test.done();
            });
    },
    'set convRate should set the timestamp for confReg': function(test) {
        test.expect(3);
        var now_ = +new Date() - 1;
        var oldTS = sens.confRegTS;
        sens.setConvRate('1', function(err, val) {
            test.ifError(err);
            test.notEqual(sens.confRegTS, oldTS);
            test.ok((sens.confRegTS > now_));
            test.done();
        });
    },
};

exports.setConvRateFailed_cb = {
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
    'set convRate to a wrong conv rate should give back an error and false': function(test) {
        test.expect(2);
        sens.setConvRate('0,25', function(err, val) {
            test.strictEqual(err.message, 'wrong convRate value in set confRate command');
            test.strictEqual(val, false);
            test.done();
        });
    },
    'set convRate to a wrong conv rate should not change the confReg': function(test) {
        test.expect(1);
        var self = this;
        sens.setConvRate('0,5', function(err, val) {
            test.strictEqual(self.oldConfReg, sens.wire.confReg);
            test.done();
        });
    },
    'set convRate to a wrong conf rate should not change the timestamp for confReg': function(test) {
        test.expect(2);
        var now = +new Date();
        var oldTS = sens.confRegTS;
        sens.setConvRate('0,25', function(err, val) {
            test.strictEqual(sens.confRegTS, oldTS);
            test.ok((sens.confRegTS < now));
            test.done();
        });
    },
};
