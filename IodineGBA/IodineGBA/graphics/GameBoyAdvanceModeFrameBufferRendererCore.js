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
function GameBoyAdvanceModeFrameBufferRenderer(gfx) {
    this.gfx = gfx;
}
GameBoyAdvanceModeFrameBufferRenderer.prototype.renderScanLine = function (line) {
    line = line | 0;
    var BG2Buffer = ((this.gfx.display & 0x4) == 0x4) ? this.gfx.bg2FrameBufferRenderer.renderScanLine(line | 0) : null;
    var OBJBuffer = ((this.gfx.display & 0x10) == 0x10) ? this.gfx.objRenderer.renderScanLine(line | 0) : null;
    this.gfx.compositeLayers(OBJBuffer, null, null, BG2Buffer, null);
    if ((this.gfx.display & 0x80) == 0x80) {
        this.gfx.objWindowRenderer.renderScanLine(line | 0, this.gfx.lineBuffer, OBJBuffer, null, null, BG2Buffer, null);
    }
    if ((this.gfx.display & 0x40) == 0x40) {
        this.gfx.window1Renderer.renderScanLine(line | 0, this.gfx.lineBuffer, OBJBuffer, null, null, BG2Buffer, null);
    }
    if ((this.gfx.display & 0x20) == 0x20) {
        this.gfx.window0Renderer.renderScanLine(line | 0, this.gfx.lineBuffer, OBJBuffer, null, null, BG2Buffer, null);
    }
    this.gfx.copyLineToFrameBuffer(line | 0);
}
GameBoyAdvanceModeFrameBufferRenderer.prototype.preprocess = function (BGMode) {
    //Set up pixel fetcher ahead of time:
    this.gfx.bg2FrameBufferRenderer.selectMode(BGMode | 0);
}