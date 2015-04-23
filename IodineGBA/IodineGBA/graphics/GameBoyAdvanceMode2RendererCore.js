"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2013 Grant Galitz
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
function GameBoyAdvanceMode2Renderer(gfx) {
    this.gfx = gfx;
}
GameBoyAdvanceMode2Renderer.prototype.renderScanLine = function (line) {
    line = line | 0;
    var BG2Buffer = ((this.gfx.display & 0x4) == 0x4) ? this.gfx.bg2MatrixRenderer.renderScanLine(line | 0) : null;
    var BG3Buffer = ((this.gfx.display & 0x8) == 0x8) ? this.gfx.bg3MatrixRenderer.renderScanLine(line | 0) : null;
    var OBJBuffer = ((this.gfx.display & 0x10) == 0x10) ? this.gfx.objRenderer.renderScanLine(line | 0) : null;
    this.gfx.compositeLayers(OBJBuffer, null, null, BG2Buffer, BG3Buffer);
    if ((this.gfx.display & 0x80) == 0x80) {
        this.gfx.objWindowRenderer.renderScanLine(line | 0, this.gfx.lineBuffer, OBJBuffer, null, null, BG2Buffer, BG3Buffer);
    }
    if ((this.gfx.display & 0x40) == 0x40) {
        this.gfx.window1Renderer.renderScanLine(line | 0, this.gfx.lineBuffer, OBJBuffer, null, null, BG2Buffer, BG3Buffer);
    }
    if ((this.gfx.display & 0x20) == 0x20) {
        this.gfx.window0Renderer.renderScanLine(line | 0, this.gfx.lineBuffer, OBJBuffer, null, null, BG2Buffer, BG3Buffer);
    }
    this.gfx.copyLineToFrameBuffer(line | 0);
}