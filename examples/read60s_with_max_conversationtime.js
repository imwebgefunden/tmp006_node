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

var sens = new TMP006({
    'convRate': '0.25'
});
var nrOfSec = 60;
nrOfSec /= 4; // in longest conversation a value is only available every 4 seconds

var readyState;

var confRegShowerIntervaler = setInterval(function() {
    sens.getDrdy_BitMode(function(err, val) {
        if (!err) {
            console.log('drdy_bit is: ' + val);
            readyState = val;
        }
    });
}, 500);

sens.on('newSensorValues', function(allData) {
    console.log('received event "newSensorValues" - calculating ...');
    console.log('object temperature      : ' + allData.sensValues.devData.objTemperature.value);
    console.log('die (sensor) temperaure : ' + allData.sensValues.devData.dieTemperature.value);
    console.log(JSON.stringify(allData, null, 2));
});

function sensRead() {
    async.timesSeries(nrOfSec, function(n, next) {
        async.whilst(
            function() {
                return readyState !== 'ready';
            },
            function(callback) {
                setTimeout(callback, 100);
            },
            function(err) {
                sens.getAllValues(next);
            }
        );
    }, function(err, res) {
        // finished
        clearInterval(confRegShowerIntervaler);
        if (err) {
            console.log('Error occurred: ' + err);
        } else {
            console.log('finished');
        }
    });
}

console.log('sensor init ...');
sens.init(function(err, val) {
    if (err) {
        console.log('error on sensor init: ' + err);
    } else {
        console.log('sensor init completed. Read to get 25 values ...');
        sensRead();
    }
});
