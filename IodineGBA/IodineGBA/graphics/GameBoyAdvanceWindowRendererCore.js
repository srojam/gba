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
function GameBoyAdvanceWindowRenderer(gfx) {
    this.gfx = gfx;
    this.WINXCoordRight = 0;
    this.WINXCoordLeft = 0;
    this.WINYCoordBottom = 0;
    this.WINYCoordTop = 0;
    this.WINBG0 = false;
    this.WINBG1 = false;
    this.WINBG2 = false;
    this.WINBG3 = false;
    this.WINOBJ = false;
    this.WINEffects = false;
    this.compositor = new GameBoyAdvanceCompositor(this.gfx);
    this.preprocess();
}
GameBoyAdvanceWindowRenderer.prototype.renderScanLine = function (line, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    line = line | 0;
    //Arrange our layer stack so we can remove disabled and order for correct edge case priority:
    OBJBuffer = (this.WINOBJ) ? OBJBuffer : null;
    BG0Buffer = (this.WINBG0) ? BG0Buffer : null;
    BG1Buffer = (this.WINBG1) ? BG1Buffer : null;
    BG2Buffer = (this.WINBG2) ? BG2Buffer : null;
    BG3Buffer = (this.WINBG3) ? BG3Buffer : null;
    if (this.checkYRange(line | 0)) {
        var right =  this.WINXCoordRight | 0;
        var left = this.WINXCoordLeft | 0;
        if ((left | 0) <= (right | 0)) {
            left = Math.min(left | 0, 240) | 0;
            right = Math.min(right | 0, 240) | 0;
            this.compositor.renderScanLine(left | 0, right | 0, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
        }
        else {
            left = Math.min(left | 0, 240) | 0;
            right = Math.min(right | 0, 240) | 0;
            this.compositor.renderScanLine(0, right | 0, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
            this.compositor.renderScanLine(left | 0, 240, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
        }
    }
}
GameBoyAdvanceWindowRenderer.prototype.checkYRange = function (line) {
    line = line | 0;
    var bottom = this.WINYCoordBottom | 0;
    var top = this.WINYCoordTop | 0;
    if ((top | 0) <= (bottom | 0)) {
        return ((line | 0) >= (top | 0) && (line | 0) < (bottom | 0));
    }
    else {
        return ((line | 0) < (top | 0) || (line | 0) >= (bottom | 0));
    }
}
GameBoyAdvanceWindowRenderer.prototype.preprocess = function () {
    this.compositor.preprocess(this.WINEffects);
}
GameBoyAdvanceWindowRenderer.prototype.writeWINH0 = function (data) {
    this.WINXCoordRight = data | 0;        //Window x-coord goes up to this minus 1.
}
GameBoyAdvanceWindowRenderer.prototype.writeWINH1 = function (data) {
    this.WINXCoordLeft = data | 0;
}
GameBoyAdvanceWindowRenderer.prototype.writeWINV0 = function (data) {
    this.WINYCoordBottom = data | 0;    //Window y-coord goes up to this minus 1.
}
GameBoyAdvanceWindowRenderer.prototype.writeWINV1 = function (data) {
    this.WINYCoordTop = data | 0;
}
GameBoyAdvanceWindowRenderer.prototype.writeWININ = function (data) {
    data = data | 0;
    this.WINBG0 = ((data & 0x01) == 0x01);
    this.WINBG1 = ((data & 0x02) == 0x02);
    this.WINBG2 = ((data & 0x04) == 0x04);
    this.WINBG3 = ((data & 0x08) == 0x08);
    this.WINOBJ = ((data & 0x10) == 0x10);
    this.WINEffects = ((data & 0x20) == 0x20);
    this.preprocess();
}
GameBoyAdvanceWindowRenderer.prototype.readWININ = function () {
    return ((this.WINBG0 ? 0x1 : 0) |
            (this.WINBG1 ? 0x2 : 0) |
            (this.WINBG2 ? 0x4 : 0) |
            (this.WINBG3 ? 0x8 : 0) |
            (this.WINOBJ ? 0x10 : 0) |
            (this.WINEffects ? 0x20 : 0));
}