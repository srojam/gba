"use strict";
/*
 Copyright (C) 2012-2015 Grant Galitz
 
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function GameBoyAdvanceOBJWindowRenderer(gfx) {
    this.gfx = gfx;
}
GameBoyAdvanceOBJWindowRenderer.prototype.initialize = function () {
    this.colorEffectsRenderer = this.gfx.colorEffectsRenderer;
    this.WINOBJOutside = 0;
    this.preprocess();
}
GameBoyAdvanceOBJWindowRenderer.prototype.renderNormalScanLine = function (line, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    line = line | 0;
    if ((this.WINOBJOutside & 0x1) == 0) {
        //BG Layer 0 Disabled:
        BG0Buffer = null;
    }
    if ((this.WINOBJOutside & 0x2) == 0) {
        //BG Layer 1 Disabled:
        BG1Buffer = null;
    }
    if ((this.WINOBJOutside & 0x4) == 0) {
        //BG Layer 2 Disabled:
        BG2Buffer = null;
    }
    if ((this.WINOBJOutside & 0x8) == 0) {
        //BG Layer 3 Disabled:
        BG3Buffer = null;
    }
    if ((this.WINOBJOutside & 0x10) == 0) {
        //Sprite Layer Disabled:
        OBJBuffer = null;
    }
    //Arrange our layer stack so we can remove disabled and order for correct edge case priority:
    var layerStack = GameBoyAdvanceCompositor.prototype.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
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
                lineBuffer[pixelPosition | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[pixelPosition | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowRenderer.prototype.renderScanLineWithEffects = function (line, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    line = line | 0;
    if ((this.WINOBJOutside & 0x1) == 0) {
        //BG Layer 0 Disabled:
        BG0Buffer = null;
    }
    if ((this.WINOBJOutside & 0x2) == 0) {
        //BG Layer 1 Disabled:
        BG1Buffer = null;
    }
    if ((this.WINOBJOutside & 0x4) == 0) {
        //BG Layer 2 Disabled:
        BG2Buffer = null;
    }
    if ((this.WINOBJOutside & 0x8) == 0) {
        //BG Layer 3 Disabled:
        BG3Buffer = null;
    }
    if ((this.WINOBJOutside & 0x10) == 0) {
        //Sprite Layer Disabled:
        OBJBuffer = null;
    }
    //Arrange our layer stack so we can remove disabled and order for correct edge case priority:
    var layerStack = GameBoyAdvanceCompositor.prototype.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
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
                lineBuffer[pixelPosition | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                lineBuffer[pixelPosition | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowRenderer.prototype.writeWINOBJIN8 = function (data) {
    data = data | 0;
    this.WINOBJOutside = data | 0;
    this.preprocess();
}
GameBoyAdvanceOBJWindowRenderer.prototype.preprocess = function () {
    this.renderScanLine = ((this.WINOBJOutside & 0x20) != 0) ? this.renderScanLineWithEffects : this.renderNormalScanLine;
}