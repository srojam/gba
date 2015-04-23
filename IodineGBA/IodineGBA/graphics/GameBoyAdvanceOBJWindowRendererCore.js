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
function GameBoyAdvanceOBJWindowRenderer(gfx) {
    this.gfx = gfx;
    this.WINOBJOutside = 0;
    this.preprocess();
}
GameBoyAdvanceOBJWindowRenderer.prototype.renderNormalScanLine = function (line, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    //Arrange our layer stack so we can remove disabled and order for correct edge case priority:
    OBJBuffer = ((this.WINOBJOutside & 0x10) == 0x10) ? OBJBuffer : null;
    BG0Buffer = ((this.WINOBJOutside & 0x1) == 0x1) ? BG0Buffer: null;
    BG1Buffer = ((this.WINOBJOutside & 0x2) == 0x2) ? BG1Buffer: null;
    BG2Buffer = ((this.WINOBJOutside & 0x4) == 0x4) ? BG2Buffer: null;
    BG3Buffer = ((this.WINOBJOutside & 0x8) == 0x8) ? BG3Buffer: null;
    var layerStack = this.gfx.compositor.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
    var stackDepth = layerStack.length | 0;
    var stackIndex = 0;
    var OBJWindowBuffer = this.gfx.objRenderer.renderWindowScanLine(line | 0);
    //Loop through each pixel on the line:
    for (var pixelPosition = 0, currentPixel = 0, workingPixel = 0, lowerPixel = 0; (pixelPosition | 0) < 240; pixelPosition = ((pixelPosition | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((OBJWindowBuffer[pixelPosition] | 0) < 0x3800000) {
            //Start with backdrop color:
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            //Loop through all layers each pixel to resolve priority:
            for (stackIndex = 0; (stackIndex | 0) < (stackDepth | 0); stackIndex = ((stackIndex | 0) + 1) | 0) {
                workingPixel = layerStack[stackIndex | 0][pixelPosition | 0] | 0;
                if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                    /*
                        If higher priority than last pixel and not transparent.
                        Also clear any plane layer bits other than backplane for
                        transparency.
                        
                        Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
                    */
                    lowerPixel = currentPixel | 0;
                    currentPixel = workingPixel | 0;
                }
                else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                    /*
                     If higher priority than last pixel and not transparent.
                     Also clear any plane layer bits other than backplane for
                     transparency.
                     
                     Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
                     */
                    lowerPixel = workingPixel | 0;
                }
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                lineBuffer[pixelPosition | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[pixelPosition | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowRenderer.prototype.renderScanLineWithEffects = function (line, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    //Arrange our layer stack so we can remove disabled and order for correct edge case priority:
    if ((this.gfx.display & 0xE0) > 0) {
        //Window registers can further disable background layers if one or more window layers enabled:
        OBJBuffer = ((this.WINOBJOutside & 0x10) == 0x10) ? OBJBuffer : null;
        BG0Buffer = ((this.WINOBJOutside & 0x1) == 0x1) ? BG0Buffer: null;
        BG1Buffer = ((this.WINOBJOutside & 0x2) == 0x2) ? BG1Buffer: null;
        BG2Buffer = ((this.WINOBJOutside & 0x4) == 0x4) ? BG2Buffer: null;
        BG3Buffer = ((this.WINOBJOutside & 0x8) == 0x8) ? BG3Buffer: null;
    }
    var layerStack = this.gfx.compositor.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
    var stackDepth = layerStack.length | 0;
    var stackIndex = 0;
    var OBJWindowBuffer = this.gfx.objRenderer.renderWindowScanLine(line | 0);
    //Loop through each pixel on the line:
    for (var pixelPosition = 0, currentPixel = 0, workingPixel = 0, lowerPixel = 0; (pixelPosition | 0) < 240; pixelPosition = ((pixelPosition | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((OBJWindowBuffer[pixelPosition | 0] | 0) < 0x3800000) {
            //Start with backdrop color:
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            //Loop through all layers each pixel to resolve priority:
            for (stackIndex = 0; (stackIndex | 0) < (stackDepth | 0); stackIndex = ((stackIndex | 0) + 1) | 0) {
                workingPixel = layerStack[stackIndex | 0][pixelPosition | 0] | 0;
                if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                    /*
                        If higher priority than last pixel and not transparent.
                        Also clear any plane layer bits other than backplane for
                        transparency.
                        
                        Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
                    */
                    lowerPixel = currentPixel | 0;
                    currentPixel = workingPixel | 0;
                }
                else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                    /*
                     If higher priority than last pixel and not transparent.
                     Also clear any plane layer bits other than backplane for
                     transparency.
                     
                     Keep a copy of the previous pixel (backdrop or non-transparent) for the color effects:
                     */
                    lowerPixel = workingPixel | 0;
                }
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[pixelPosition | 0] = this.gfx.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[pixelPosition | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowRenderer.prototype.writeWINOUT1 = function (data) {
    data = data | 0;
    this.WINOBJOutside = data & 0x3F;
    this.preprocess();
}
GameBoyAdvanceOBJWindowRenderer.prototype.readWINOUT1 = function () {
    return this.WINOBJOutside | 0;
}
GameBoyAdvanceOBJWindowRenderer.prototype.preprocess = function () {
    this.renderScanLine = ((this.WINOBJOutside & 0x20) == 0x20) ? this.renderScanLineWithEffects : this.renderNormalScanLine;
}