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
function GameBoyAdvanceBGMatrixRenderer(gfx, BGLayer) {
    this.gfx = gfx;
    this.BGLayer = BGLayer | 0;
    this.VRAM = this.gfx.VRAM;
    this.palette = this.gfx.palette256;
    this.bgAffineRenderer = this.gfx.bgAffineRenderer[BGLayer & 0x1];
    this.screenSizePreprocess();
    this.screenBaseBlockPreprocess();
    this.characterBaseBlockPreprocess();
    this.displayOverflowProcess(false);
}
GameBoyAdvanceBGMatrixRenderer.prototype.renderScanLine = function (line) {
    line = line | 0;
    return this.bgAffineRenderer.renderScanLine(line | 0, this);
}
if (typeof Math.imul == "function") {
    //Math.imul found, insert the optimized path in:
    GameBoyAdvanceBGMatrixRenderer.prototype.fetchTile = function (x, y) {
        //Compute address for tile VRAM to address:
        x = x | 0;
        y = y | 0;
        var tileNumber = ((x | 0) + Math.imul(y | 0, this.mapSize | 0)) | 0;
        return this.VRAM[((tileNumber | 0) + (this.BGScreenBaseBlock | 0)) & 0xFFFF] | 0;
    }
}
else {
    //Math.imul not found, use the compatibility method:
    GameBoyAdvanceBGMatrixRenderer.prototype.fetchTile = function (x, y) {
        //Compute address for tile VRAM to address:
        var tileNumber = x + (y * this.mapSize);
        return this.VRAM[(tileNumber + this.BGScreenBaseBlock) & 0xFFFF];
    }
}
GameBoyAdvanceBGMatrixRenderer.prototype.computeScreenAddress = function (x, y) {
    //Compute address for character VRAM to address:
    x = x | 0;
    y = y | 0;
    var address = this.fetchTile(x >> 3, y >> 3) << 6;
    address = ((address | 0) + (this.BGCharacterBaseBlock | 0)) | 0;
    address = ((address | 0) + ((y & 0x7) << 3)) | 0;
    address = ((address | 0) + (x & 0x7)) | 0;
    return address | 0;
}
GameBoyAdvanceBGMatrixRenderer.prototype.fetchPixelOverflow = function (x, y) {
    //Fetch the pixel:
    x = x | 0;
    y = y | 0;
    //Output pixel:
    var address = this.computeScreenAddress(x & this.mapSizeComparer, y & this.mapSizeComparer) | 0;
    return this.palette[this.VRAM[address & 0xFFFF] & 0xFF] | 0;
}
GameBoyAdvanceBGMatrixRenderer.prototype.fetchPixelNoOverflow = function (x, y) {
    //Fetch the pixel:
    x = x | 0;
    y = y | 0;
    //Output pixel:
    if ((x | 0) != (x & this.mapSizeComparer) || (y | 0) != (y & this.mapSizeComparer)) {
        //Overflow Handling:
        //Out of bounds with no overflow allowed:
        return 0x3800000;
    }
    var address = this.computeScreenAddress(x | 0, y | 0) | 0;
    return this.palette[this.VRAM[address & 0xFFFF] & 0xFF] | 0;
}
GameBoyAdvanceBGMatrixRenderer.prototype.screenBaseBlockPreprocess = function () {
    this.BGScreenBaseBlock = this.gfx.BGScreenBaseBlock[this.BGLayer & 3] << 11;
}
GameBoyAdvanceBGMatrixRenderer.prototype.characterBaseBlockPreprocess = function () {
    this.BGCharacterBaseBlock = this.gfx.BGCharacterBaseBlock[this.BGLayer & 3] << 14;
}
GameBoyAdvanceBGMatrixRenderer.prototype.screenSizePreprocess = function () {
    this.mapSize = 0x10 << (this.gfx.BGScreenSize[this.BGLayer & 3] | 0);
    this.mapSizeComparer = ((this.mapSize << 3) - 1) | 0;
}
GameBoyAdvanceBGMatrixRenderer.prototype.displayOverflowPreprocess = function () {
    var doOverflow = this.gfx.BGDisplayOverflow[this.BGLayer & 1];
    if (doOverflow != this.BGDisplayOverflow) {
        this.displayOverflowProcess(doOverflow);
    }
}
GameBoyAdvanceBGMatrixRenderer.prototype.displayOverflowProcess = function (doOverflow) {
    this.BGDisplayOverflow = doOverflow;
    this.fetchPixel = (doOverflow) ? this.fetchPixelOverflow : this.fetchPixelNoOverflow;
}