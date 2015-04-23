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
function GameBoyAdvanceIRQ(IOCore) {
    //Build references:
    this.IOCore = IOCore;
}
GameBoyAdvanceIRQ.prototype.initialize = function () {
    this.interruptsEnabled = 0;
    this.interruptsRequested = 0;
    this.IME = 0;
    this.gfx = this.IOCore.gfx;
    this.timer = this.IOCore.timer;
    this.dmaChannel0 = this.IOCore.dmaChannel0;
    this.dmaChannel1 = this.IOCore.dmaChannel1;
    this.dmaChannel2 = this.IOCore.dmaChannel2;
    this.dmaChannel3 = this.IOCore.dmaChannel3;
}
GameBoyAdvanceIRQ.prototype.IRQMatch = function () {
    //Used to exit HALT:
    return (this.interruptsEnabled & this.interruptsRequested);
}
GameBoyAdvanceIRQ.prototype.checkForIRQFire = function () {
    //Tell the CPU core when the emulated hardware is triggering an IRQ:
    this.IOCore.cpu.triggerIRQ(this.interruptsEnabled & this.interruptsRequested & this.IME);
}
GameBoyAdvanceIRQ.prototype.requestIRQ = function (irqLineToSet) {
    irqLineToSet = irqLineToSet | 0;
    this.interruptsRequested |= irqLineToSet | 0;
    this.checkForIRQFire();
}
GameBoyAdvanceIRQ.prototype.writeIME = function (data) {
    data = data | 0;
    this.IOCore.updateCoreClocking();
    this.IME = (data << 31) >> 31;
    this.checkForIRQFire();
    this.IOCore.updateCoreEventTime();
}
GameBoyAdvanceIRQ.prototype.readIME = function () {
    return this.IME & 0x1;
}
GameBoyAdvanceIRQ.prototype.writeIE0 = function (data) {
    data = data | 0;
    this.interruptsEnabled &= 0x3F00;
    this.interruptsEnabled |= data | 0;
    this.checkForIRQFire();
}
GameBoyAdvanceIRQ.prototype.readIE0 = function () {
    return this.interruptsEnabled & 0xFF;
}
GameBoyAdvanceIRQ.prototype.writeIE1 = function (data) {
    data = data | 0;
    this.interruptsEnabled &= 0xFF;
    this.interruptsEnabled |= (data << 8) & 0x3F00;
    this.checkForIRQFire();
}
GameBoyAdvanceIRQ.prototype.readIE1 = function () {
    return this.interruptsEnabled >> 8;
}
GameBoyAdvanceIRQ.prototype.writeIF0 = function (data) {
    data = data | 0;
    this.interruptsRequested &= ~data;
    this.checkForIRQFire();
}
GameBoyAdvanceIRQ.prototype.readIF0 = function () {
    return this.interruptsRequested & 0xFF;
}
GameBoyAdvanceIRQ.prototype.writeIF1 = function (data) {
    data = data | 0;
    this.interruptsRequested &= ~(data << 8);
    this.checkForIRQFire();
}
GameBoyAdvanceIRQ.prototype.readIF1 = function () {
    return this.interruptsRequested >> 8;
}
GameBoyAdvanceIRQ.prototype.nextEventTime = function () {
    var clocks = 0x7FFFFFFF;
    clocks = this.findClosestEvent(clocks | 0, this.gfx.nextVBlankIRQEventTime() | 0, 0x1) | 0;
    clocks = this.findClosestEvent(clocks | 0, this.gfx.nextHBlankIRQEventTime() | 0, 0x2) | 0;
    clocks = this.findClosestEvent(clocks | 0, this.gfx.nextVCounterIRQEventTime() | 0, 0x4) | 0;
    clocks = this.findClosestEvent(clocks | 0, this.timer.nextTimer0IRQEventTime() | 0, 0x8) | 0;
    clocks = this.findClosestEvent(clocks | 0, this.timer.nextTimer1IRQEventTime() | 0, 0x10) | 0;
    clocks = this.findClosestEvent(clocks | 0, this.timer.nextTimer2IRQEventTime() | 0, 0x20) | 0;
    clocks = this.findClosestEvent(clocks | 0, this.timer.nextTimer3IRQEventTime() | 0, 0x40) | 0;
    //clocks = this.findClosestEvent(clocks | 0, this.IOCore.serial.nextIRQEventTime() | 0, 0x80) | 0;
    //clocks = this.findClosestEvent(clocks | 0, this.IOCore.cartridge.nextIRQEventTime() | 0, 0x2000) | 0;
    return clocks | 0;
}
GameBoyAdvanceIRQ.prototype.nextIRQEventTime = function () {
    var clocks = 0x7FFFFFFF;
    //Checks IME:
    if ((this.IME | 0) != 0) {
        clocks = this.nextEventTime() | 0;
    }
    return clocks | 0;
}
GameBoyAdvanceIRQ.prototype.findClosestEvent = function (oldClocks, newClocks, flagID) {
    oldClocks = oldClocks | 0;
    newClocks = newClocks | 0;
    flagID = flagID | 0;
    if ((this.interruptsEnabled & flagID) != 0) {
        oldClocks = Math.min(oldClocks | 0, newClocks | 0) | 0;
    }
    return oldClocks | 0;
}