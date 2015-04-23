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
function GameBoyAdvanceJoyPad(IOCore) {
    this.IOCore = IOCore;
}
GameBoyAdvanceJoyPad.prototype.initialize = function () {
    this.keyInput = 0x3FF;
    this.keyInterrupt = 0;
}
GameBoyAdvanceJoyPad.prototype.keyPress = function (keyPressed) {
    switch (keyPressed.toUpperCase()) {
        case "A":
            this.keyInput &= ~0x1;
            break;
        case "B":
            this.keyInput &= ~0x2;
            break;
        case "SELECT":
            this.keyInput &= ~0x4;
            break;
        case "START":
            this.keyInput &= ~0x8;
            break;
        case "RIGHT":
            this.keyInput &= ~0x10;
            break;
        case "LEFT":
            this.keyInput &= ~0x20;
            break;
        case "UP":
            this.keyInput &= ~0x40;
            break;
        case "DOWN":
            this.keyInput &= ~0x80;
            break;
        case "R":
            this.keyInput &= ~0x100;
            break;
        case "L":
            this.keyInput &= ~0x200;
            break;
        default:
            return;
    }
    this.checkForMatch();
}
GameBoyAdvanceJoyPad.prototype.keyRelease = function (keyReleased) {
    switch (keyReleased.toUpperCase()) {
        case "A":
            this.keyInput |= 0x1;
            break;
        case "B":
            this.keyInput |= 0x2;
            break;
        case "SELECT":
            this.keyInput |= 0x4;
            break;
        case "START":
            this.keyInput |= 0x8;
            break;
        case "RIGHT":
            this.keyInput |= 0x10;
            break;
        case "LEFT":
            this.keyInput |= 0x20;
            break;
        case "UP":
            this.keyInput |= 0x40;
            break;
        case "DOWN":
            this.keyInput |= 0x80;
            break;
        case "R":
            this.keyInput |= 0x100;
            break;
        case "L":
            this.keyInput |= 0x200;
            break;
        default:
            return;
    }
    this.checkForMatch();
}
GameBoyAdvanceJoyPad.prototype.checkForMatch = function () {
    if ((this.keyInterrupt & 0x8000) == 0x8000) {
        if (((~this.keyInput) & this.keyInterrupt & 0x3FF) == (this.keyInterrupt & 0x3FF)) {
            this.IOCore.deflagStop();
            this.checkForIRQ();
        }
    }
    else if (((~this.keyInput) & this.keyInterrupt & 0x3FF) != 0) {
        this.IOCore.deflagStop();
        this.checkForIRQ();
    }
}
GameBoyAdvanceJoyPad.prototype.checkForIRQ = function () {
    if ((this.keyInterrupt & 0x4000) == 0x4000) {
        this.IOCore.irq.requestIRQ(0x1000);
    }
}
GameBoyAdvanceJoyPad.prototype.readKeyStatus8_0 = function () {
    return this.keyInput & 0xFF;
}
GameBoyAdvanceJoyPad.prototype.readKeyStatus8_1 = function () {
    return (this.keyInput >> 8) | 0;
}
GameBoyAdvanceJoyPad.prototype.readKeyStatus16 = function () {
    return this.keyInput | 0;
}
GameBoyAdvanceJoyPad.prototype.writeKeyControl8_0 = function (data) {
    data = data | 0;
    this.keyInterrupt = this.keyInterrupt & 0xC300;
    data = data & 0xFF;
    this.keyInterrupt = this.keyInterrupt | data;
}
GameBoyAdvanceJoyPad.prototype.writeKeyControl8_1 = function (data) {
    data = data | 0;
    this.keyInterrupt = this.keyInterrupt & 0xFF;
    data = data & 0xC3;
    this.keyInterrupt = this.keyInterrupt | (data << 8);
}
GameBoyAdvanceJoyPad.prototype.writeKeyControl16 = function (data) {
    data = data | 0;
    this.keyInterrupt = data & 0xC3FF;
}
GameBoyAdvanceJoyPad.prototype.readKeyControl8_0 = function () {
    return this.keyInterrupt & 0xFF;
}
GameBoyAdvanceJoyPad.prototype.readKeyControl8_1 = function () {
    return (this.keyInterrupt >> 8) | 0;
}
GameBoyAdvanceJoyPad.prototype.readKeyControl16 = function () {
    return this.keyInterrupt | 0;
}
GameBoyAdvanceJoyPad.prototype.readKeyStatusControl32 = function () {
    return this.keyInput | (this.keyInterrupt << 16);
}