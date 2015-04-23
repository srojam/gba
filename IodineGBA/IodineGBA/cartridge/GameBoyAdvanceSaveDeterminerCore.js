"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2015 Grant Galitz
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 * The full license is available at http://www.gnu.org/licenses/gpl.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 */
function GameBoyAdvanceSaveDeterminer(saveCore) {
    this.saves = null;
    this.saveCore = saveCore;
    this.possible = 0x7;
}
GameBoyAdvanceSaveDeterminer.prototype.flags = {
    SRAM: 1,
    FLASH: 2,
    EEPROM: 4
}
GameBoyAdvanceSaveDeterminer.prototype.initialize = function () {
    
}
GameBoyAdvanceSaveDeterminer.prototype.load = function (save) {
    this.saves = save;
    var length = save.length | 0;
    switch (length | 0) {
        case 0x200:
        case 0x2000:
            this.possible = this.flags.EEPROM | 0;
            break;
        case 0x8000:
            this.possible = this.flags.SRAM | 0;
            break;
        case 0x10000:
        case 0x20000:
            this.possible = this.flags.FLASH | 0;
    }
    this.checkDetermination();
}
GameBoyAdvanceSaveDeterminer.prototype.checkDetermination = function () {
    switch (this.possible) {
        case 0x1:
            this.saveCore.referenceSave(0x1);
            break;
        case 0x2:
            this.saveCore.referenceSave(0x2);
            break;
        case 0x4:
            this.saveCore.referenceSave(0x3);
    }
}
GameBoyAdvanceSaveDeterminer.prototype.readSRAM = function (address) {
    address = address | 0;
    var data = 0;
    //Is not EEPROM:
    this.possible &= ~this.flags.EEPROM;
    if (this.saves != null) {
        if ((this.possible & this.flags.FLASH) == (this.flags.FLASH | 0) || (this.possible & this.flags.SRAM) == (this.flags.SRAM | 0)) {
            //Read is the same between SRAM and FLASH for the most part:
            data = this.saves[(address | 0) % (this.saves.length | 0)] | 0;
        }
    }
    return data | 0;
}
GameBoyAdvanceSaveDeterminer.prototype.writeGPIO8 = function (address, data) {
    address = address | 0;
    data = data | 0;
    //GPIO (TODO):
}
GameBoyAdvanceSaveDeterminer.prototype.writeGPIO16 = function (address, data) {
    address = address | 0;
    data = data | 0;
    //GPIO (TODO):
}
GameBoyAdvanceSaveDeterminer.prototype.writeGPIO32 = function (address, data) {
    address = address | 0;
    data = data | 0;
    //GPIO (TODO):
}
GameBoyAdvanceSaveDeterminer.prototype.writeEEPROM16 = function (address, data) {
    address = address | 0;
    data = data | 0;
    if ((this.possible & this.flags.EEPROM) == (this.flags.EEPROM | 0)) {
        //EEPROM:
        this.possible = this.flags.EEPROM | 0;
        this.checkDetermination();
        this.saveCore.writeEEPROM16(address | 0, data | 0);
    }
}
GameBoyAdvanceSaveDeterminer.prototype.readEEPROM8 = function (address) {
    address = address | 0;
    var data = 0;
    if ((this.possible & this.flags.EEPROM) == (this.flags.EEPROM | 0)) {
        //EEPROM:
        this.possible = this.flags.EEPROM | 0;
        this.checkDetermination();
        return this.saveCore.readEEPROM8(address | 0) | 0;
    }
}
GameBoyAdvanceSaveDeterminer.prototype.readEEPROM16 = function (address) {
    address = address | 0;
    var data = 0;
    if ((this.possible & this.flags.EEPROM) == (this.flags.EEPROM | 0)) {
        //EEPROM:
        this.possible = this.flags.EEPROM | 0;
        this.checkDetermination();
        return this.saveCore.readEEPROM16(address | 0) | 0;
    }
}
GameBoyAdvanceSaveDeterminer.prototype.readEEPROM32 = function (address) {
    address = address | 0;
    var data = 0;
    if ((this.possible & this.flags.EEPROM) == (this.flags.EEPROM | 0)) {
        //EEPROM:
        this.possible = this.flags.EEPROM | 0;
        this.checkDetermination();
        return this.saveCore.readEEPROM32(address | 0) | 0;
    }
}
GameBoyAdvanceSaveDeterminer.prototype.writeSRAM = function (address, data) {
    address = address | 0;
    data = data | 0;
    //Is not EEPROM:
    this.possible &= ~this.flags.EEPROM;
    if ((this.possible & this.flags.FLASH) == (this.flags.FLASH | 0)) {
        if ((this.possible & this.flags.SRAM) == (this.flags.SRAM | 0)) {
            if ((address | 0) == 0x5555) {
                if ((data | 0) == 0xAA) {
                    //FLASH
                    this.possible = this.flags.FLASH | 0;
                }
                else {
                    //SRAM
                    this.possible = this.flags.SRAM | 0;
                }
            }
        }
        else {
            if ((address | 0) == 0x5555) {
                if ((data | 0) == 0xAA) {
                    //FLASH
                    this.possible = this.flags.FLASH | 0;
                }
                else {
                    //Is not Flash:
                    this.possible &= ~this.flags.FLASH;
                }
            }
        }
    }
    else if ((this.possible & this.flags.SRAM) == (this.flags.SRAM | 0)) {
        //SRAM
        this.possible = this.flags.SRAM | 0;
    }
    this.checkDetermination();
    this.saveCore.writeSRAMIfDefined(address | 0, data | 0);
}