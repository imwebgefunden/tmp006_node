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
var TMP006 = require('../tmp006');

var sens = new TMP006();

function d2h(i) {
    return ('0x' + (i + 0x10000).toString(16).substr(-4).toUpperCase());
}

function printReg(bytes, cB) {
    var hi = bytes.readUInt8(0);
    var lo = bytes.readUInt8(1);
    var word = (hi << 8) + lo;
    console.log('config register: ' + d2h(word));
    cB();
}

async.series([

        function(cB) {
            console.log('sensor init with defaults ...');
            sens.init(cB);
        },
        function(cB) {
            sens.readRegister('config', function(err, bytes) {
                if (err) {
                    cB(err, null);
                } else {
                    printReg(bytes, cB);
                }
            });
        },
        function(cB) {
            console.log('change some default settings ...');
            console.log('set opMode to "continuous"');
            sens.setOpMode('continuous', cB);
        },
        function(cB) {
            console.log('set convRate to "4"');
            sens.setConvRate('4', cB);
        },
        function(cB) {
            sens.readRegister('config', function(err, bytes) {
                if (err) {
                    cB(err, null);
                } else {
                    printReg(bytes, cB);
                }
            });
        },
        function(cB) {
            console.log('start soft reset now');
            sens.softReset(cB);
        },
        function(cB) {
            console.log('soft reset performed - now waiting for 1 second');
            setTimeout(function() {
                console.log('registers after soft reset:');
                sens.readRegister('config', function(err, bytes) {
                    if (err) {
                        cB(err, null);
                    } else {
                        printReg(bytes, cB);
                    }
                });
            }, 1000);
        },
    ],
    function(err, results) {
        if (err) {
            console.log(' Finished with error ...');
            console.log(err);
        } else {
            console.log(' Finished without errors');
        }
    });
