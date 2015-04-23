"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2014 Grant Galitz
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
function GameBoyAdvanceAffineBGRenderer(gfx, BGLayer) {
    this.gfx = gfx;
    this.BGLayer = BGLayer;
    this.initialize();
}
GameBoyAdvanceAffineBGRenderer.prototype.initialize = function () {
    this.scratchBuffer = getInt32Array(240);
    this.BGdx = 0x100;
    this.BGdmx = 0;
    this.BGdy = 0;
    this.BGdmy = 0x100;
    this.actualBGdx = 0x100;
    this.actualBGdmx = 0;
    this.actualBGdy = 0;
    this.actualBGdmy = 0x100;
    this.BGReferenceX = 0;
    this.BGReferenceY = 0;
    this.actualBGReferenceX = 0;
    this.actualBGReferenceY = 0;
    this.pb = 0;
    this.pd = 0;
    this.priorityPreprocess();
    this.offsetReferenceCounters();
}
if (typeof Math.imul == "function") {
    //Math.imul found, insert the optimized path in:
    GameBoyAdvanceAffineBGRenderer.prototype.renderScanLine = function (line, BGObject) {
        line = line | 0;
        var x = this.pb | 0;
        var y = this.pd | 0;
        if (this.gfx.BGMosaic[this.BGLayer & 3]) {
            //Correct line number for mosaic:
            var mosaicY = this.gfx.mosaicRenderer.getMosaicYOffset(line | 0) | 0;
            x = ((x | 0) - Math.imul(this.actualBGdmx | 0, mosaicY | 0)) | 0;
            y = ((y | 0) - Math.imul(this.actualBGdmy | 0, mosaicY | 0)) | 0;
        }
        for (var position = 0; (position | 0) < 240; position = ((position | 0) + 1) | 0, x = ((x | 0) + (this.actualBGdx | 0)) | 0, y = ((y | 0) + (this.actualBGdy | 0)) | 0) {
            //Fetch pixel:
            this.scratchBuffer[position | 0] = this.priorityFlag | BGObject.fetchPixel(x >> 8, y >> 8);
        }
        if (this.gfx.BGMosaic[this.BGLayer & 3]) {
            //Pixelize the line horizontally:
            this.gfx.mosaicRenderer.renderMosaicHorizontal(this.scratchBuffer);
        }
        return this.scratchBuffer;
    }
    GameBoyAdvanceAffineBGRenderer.prototype.offsetReferenceCounters = function () {
        var end = this.gfx.lastUnrenderedLine | 0;
        this.pb = Math.imul(((this.pb | 0) + (this.actualBGdmx | 0)) | 0, end | 0) | 0;
        this.pd = Math.imul(((this.pd | 0) + (this.actualBGdmy | 0)) | 0, end | 0) | 0;
    }
}
else {
    //Math.imul not found, use the compatibility method:
    GameBoyAdvanceAffineBGRenderer.prototype.renderScanLine = function (line, BGObject) {
        var x = this.pb;
        var y = this.pd;
        if (this.gfx.BGMosaic[this.BGLayer & 3]) {
            //Correct line number for mosaic:
            var mosaicY = this.gfx.mosaicRenderer.getMosaicYOffset(line | 0);
            x -= this.actualBGdmx * mosaicY;
            y -= this.actualBGdmy * mosaicY;
        }
        for (var position = 0; position < 240; ++position, x += this.actualBGdx, y += this.actualBGdy) {
            //Fetch pixel:
            this.scratchBuffer[position] = this.priorityFlag | BGObject.fetchPixel(x >> 8, y >> 8);
        }
        if (this.gfx.BGMosaic[this.BGLayer & 3]) {
            //Pixelize the line horizontally:
            this.gfx.mosaicRenderer.renderMosaicHorizontal(this.scratchBuffer);
        }
        return this.scratchBuffer;
    }
    GameBoyAdvanceAffineBGRenderer.prototype.offsetReferenceCounters = function () {
        var end = this.gfx.lastUnrenderedLine | 0;
        this.pb = (((this.pb | 0) + (this.actualBGdmx | 0)) * (end | 0)) | 0;
        this.pd = (((this.pd | 0) + (this.actualBGdmy | 0)) * (end | 0)) | 0;
    }
}
GameBoyAdvanceAffineBGRenderer.prototype.incrementReferenceCounters = function () {
    this.pb = ((this.pb | 0) + (this.actualBGdmx | 0)) | 0;
    this.pd = ((this.pd | 0) + (this.actualBGdmy | 0)) | 0;
}
GameBoyAdvanceAffineBGRenderer.prototype.resetReferenceCounters = function () {
    this.pb = this.actualBGReferenceX | 0;
    this.pd = this.actualBGReferenceY | 0;
}
GameBoyAdvanceAffineBGRenderer.prototype.priorityPreprocess = function () {
    this.priorityFlag = (this.gfx.BGPriority[this.BGLayer] << 23) | (1 << (this.BGLayer + 0x10));
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPA0 = function (data) {
    data = data | 0;
    this.BGdx = (this.BGdx & 0xFF00) | data;
    this.actualBGdx = (this.BGdx << 16) >> 16;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPA1 = function (data) {
    data = data | 0;
    this.BGdx = (data << 8) | (this.BGdx & 0xFF);
    this.actualBGdx = (this.BGdx << 16) >> 16;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPB0 = function (data) {
    data = data | 0;
    this.BGdmx = (this.BGdmx & 0xFF00) | data;
    this.actualBGdmx = (this.BGdmx << 16) >> 16;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPB1 = function (data) {
    data = data | 0;
    this.BGdmx = (data << 8) | (this.BGdmx & 0xFF);
    this.actualBGdmx = (this.BGdmx << 16) >> 16;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPC0 = function (data) {
    data = data | 0;
    this.BGdy = (this.BGdy & 0xFF00) | data;
    this.actualBGdy = (this.BGdy << 16) >> 16;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPC1 = function (data) {
    data = data | 0;
    this.BGdy = (data << 8) | (this.BGdy & 0xFF);
    this.actualBGdy = (this.BGdy << 16) >> 16;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPD0 = function (data) {
    data = data | 0;
    this.BGdmy = (this.BGdmy & 0xFF00) | data;
    this.actualBGdmy = (this.BGdmy << 16) >> 16;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGPD1 = function (data) {
    data = data | 0;
    this.BGdmy = (data << 8) | (this.BGdmy & 0xFF);
    this.actualBGdmy = (this.BGdmy << 16) >> 16;
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGX_L0 = function (data) {
    data = data | 0;
    this.BGReferenceX = (this.BGReferenceX & 0xFFFFF00) | data;
    this.actualBGReferenceX = (this.BGReferenceX << 4) >> 4;
    //Writing to the x reference doesn't reset the counters during draw!
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGX_L1 = function (data) {
    data = data | 0;
    this.BGReferenceX = (data << 8) | (this.BGReferenceX & 0xFFF00FF);
    this.actualBGReferenceX = (this.BGReferenceX << 4) >> 4;
    //Writing to the x reference doesn't reset the counters during draw!
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGX_H0 = function (data) {
    data = data | 0;
    this.BGReferenceX = (data << 16) | (this.BGReferenceX & 0xF00FFFF);
    this.actualBGReferenceX = (this.BGReferenceX << 4) >> 4;
    //Writing to the x reference doesn't reset the counters during draw!
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGX_H1 = function (data) {
    data = data | 0;
    this.BGReferenceX = ((data & 0xF) << 24) | (this.BGReferenceX & 0xFFFFFF);
    this.actualBGReferenceX = (this.BGReferenceX << 4) >> 4;
    //Writing to the x reference doesn't reset the counters during draw!
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGY_L0 = function (data) {
    data = data | 0;
    this.BGReferenceY = (this.BGReferenceY & 0xFFFFF00) | data;
    this.actualBGReferenceY = (this.BGReferenceY << 4) >> 4;
    this.resetReferenceCounters();
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGY_L1 = function (data) {
    data = data | 0;
    this.BGReferenceY = (data << 8) | (this.BGReferenceY & 0xFFF00FF);
    this.actualBGReferenceY = (this.BGReferenceY << 4) >> 4;
    this.resetReferenceCounters();
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGY_H0 = function (data) {
    data = data | 0;
    this.BGReferenceY = (data << 16) | (this.BGReferenceY & 0xF00FFFF);
    this.actualBGReferenceY = (this.BGReferenceY << 4) >> 4;
    this.resetReferenceCounters();
}
GameBoyAdvanceAffineBGRenderer.prototype.writeBGY_H1 = function (data) {
    data = data | 0;
    this.BGReferenceY = ((data & 0xF) << 24) | (this.BGReferenceY & 0xFFFFFF);
    this.actualBGReferenceY = (this.BGReferenceY << 4) >> 4;
    this.resetReferenceCounters();
}