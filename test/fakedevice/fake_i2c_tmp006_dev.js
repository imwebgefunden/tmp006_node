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

var i2cFakeDev = function(addr, opts) {
    var self = this;
    self.addr = addr;
    self.confReg = 0x7400; // used here the soft reset values, addr is 0x02 
    self.vObj = 0xFD24; // addr is 0x00
    self.tAmb = 0x0850; // addr is 0x01
    self.manIdReg = 0x5449; // Addr: 0xFE, Val: 0x5449, same for every TMP006 
    self.devIdReg = 0x0067; // Addr: 0xFF, Val: 0x0067 same for every TMP006 
};

i2cFakeDev.prototype.readBytes = function(cmd, len, callback) {
    var self = this;
    var buf = new Buffer(len);
    var err = null;

    switch (cmd) {
        case 0x00: // vObjReg
            buf.writeUInt16BE(self.vObj, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0x01: // tAmbReg
            buf.writeUInt16BE(self.tAmb, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0x02: // confReg
            buf.writeUInt16BE(self.confReg, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xFE: // manId
            buf.writeUInt16BE(self.manIdReg, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xFF: // devId
            buf.writeUInt16BE(self.devIdReg, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        default:
            buf.writeUInt8(0, 0);
            err = new Error('not implemented in fake device');
    }

    callback(err, buf);
};

i2cFakeDev.prototype.writeBytes = function(cmd, data, callback) {
    var self = this;
    // cmd is pointer for tmp006
    var err = null;


    if (data.length !== 2) {
        err = new Error('wrong data len in writeBytes for faked device');
    } else {
        var newRegVal = (data[0] << 8) + data[1];
        var resBit = (newRegVal >> 15);
        switch (cmd) {
            case 0x02: // only config reg at addr 0x02 is writable at tmp006
                if (resBit === 0x01) {
                    // device reset
                    self.confReg = 0x7400;
                } else {
                    self.confReg = (data[0] << 8) + data[1];
                }
                break;
            default:
                err = new Error('not implemented in fake device');
        }
    }

    if (err) {
        callback(err, false);
    } else {
        callback(null, true);
    }
};

module.exports = i2cFakeDev;
