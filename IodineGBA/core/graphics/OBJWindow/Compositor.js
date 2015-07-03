"use strict";
/*
 Copyright (C) 2012-2015 Grant Galitz
 
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function GameBoyAdvanceOBJWindowCompositor(gfx) {
    this.gfx = gfx;
    this.doEffects = 0;
}
if (__VIEWS_SUPPORTED__) {
    GameBoyAdvanceOBJWindowCompositor.prototype.initialize = function () {
        this.buffer = this.gfx.buffer;
        this.layerStack = getInt32ViewCustom(this.gfx.buffer, 240, 245);
        this.colorEffectsRenderer = this.gfx.colorEffectsRenderer;
        this.OBJWindowBuffer = this.gfx.objRenderer.scratchWindowBuffer;
    }
}
else {
    GameBoyAdvanceOBJWindowCompositor.prototype.initialize = function () {
        this.buffer = this.gfx.buffer;
        this.layerStack = getInt32Array(5);
        this.colorEffectsRenderer = this.gfx.colorEffectsRenderer;
        this.OBJWindowBuffer = this.gfx.objRenderer.scratchWindowBuffer;
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.preprocess = function (doEffects) {
    doEffects = doEffects | 0;
    this.doEffects = doEffects | 0;
}
GameBoyAdvanceOBJWindowCompositor.prototype.cleanLayerStack = function (OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    OBJBuffer = OBJBuffer | 0;
    BG0Buffer = BG0Buffer | 0;
    BG1Buffer = BG1Buffer | 0;
    BG2Buffer = BG2Buffer | 0;
    BG3Buffer = BG3Buffer | 0;
    //Clear out disabled layers from our stack:
    var layerCount = 0;
    if ((BG3Buffer | 0) != 0) {
        this.layerStack[0] = BG3Buffer | 0;
        layerCount = 1;
    }
    if ((BG2Buffer | 0) != 0) {
        this.layerStack[layerCount | 0] = BG2Buffer | 0;
        layerCount = ((layerCount | 0) + 1) | 0;
    }
    if ((BG1Buffer | 0) != 0) {
        this.layerStack[layerCount | 0] = BG1Buffer | 0;
        layerCount = ((layerCount | 0) + 1) | 0;
    }
    if ((BG0Buffer | 0) != 0) {
        this.layerStack[layerCount | 0] = BG0Buffer | 0;
        layerCount = ((layerCount | 0) + 1) | 0;
    }
    if ((OBJBuffer | 0) != 0) {
        this.layerStack[layerCount | 0] = OBJBuffer | 0;
        layerCount = ((layerCount | 0) + 1) | 0;
    }
    return layerCount | 0;
}
GameBoyAdvanceOBJWindowCompositor.prototype.renderScanLine = function (OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    OBJBuffer = OBJBuffer | 0;
    BG0Buffer = BG0Buffer | 0;
    BG1Buffer = BG1Buffer | 0;
    BG2Buffer = BG2Buffer | 0;
    BG3Buffer = BG3Buffer | 0;
    var layerCount = this.cleanLayerStack(OBJBuffer | 0, BG0Buffer | 0, BG1Buffer | 0, BG2Buffer | 0, BG3Buffer | 0) | 0;
    if ((this.doEffects | 0) == 0) {
        this.renderNormalScanLine(layerCount | 0);
    }
    else {
        this.renderScanLineWithEffects(layerCount | 0);
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.renderNormalScanLine = function (layerCount) {
    layerCount = layerCount | 0;
    switch (layerCount | 0) {
        case 0:
            this.fillWithBackdrop();
            break;
        case 1:
            this.composite1Layer(this.layerStack[0] | 0);
            break;
        case 2:
            this.composite2Layer(this.layerStack[0] | 0, this.layerStack[1] | 0);
            break;
        case 3:
            this.composite3Layer(this.layerStack[0] | 0, this.layerStack[1] | 0, this.layerStack[2] | 0);
            break;
        case 4:
            this.composite4Layer(this.layerStack[0] | 0, this.layerStack[1] | 0, this.layerStack[2] | 0, this.layerStack[3] | 0);
            break;
        default:
            this.composite5Layer(this.layerStack[0] | 0, this.layerStack[1] | 0, this.layerStack[2] | 0, this.layerStack[3] | 0, this.layerStack[4] | 0);
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.renderScanLineWithEffects = function (layerCount) {
    layerCount = layerCount | 0;
    switch (layerCount | 0) {
        case 0:
            this.fillWithBackdropSpecial();
            break;
        case 1:
            this.composite1LayerSpecial(this.layerStack[0] | 0);
            break;
        case 2:
            this.composite2LayerSpecial(this.layerStack[0] | 0, this.layerStack[1] | 0);
            break;
        case 3:
            this.composite3LayerSpecial(this.layerStack[0] | 0, this.layerStack[1] | 0, this.layerStack[2] | 0);
            break;
        case 4:
            this.composite4LayerSpecial(this.layerStack[0] | 0, this.layerStack[1] | 0, this.layerStack[2] | 0, this.layerStack[3] | 0);
            break;
        default:
            this.composite5LayerSpecial(this.layerStack[0] | 0, this.layerStack[1] | 0, this.layerStack[2] | 0, this.layerStack[3] | 0, this.layerStack[4] | 0);
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.fillWithBackdrop = function () {
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            this.buffer[xStart | 0] = this.gfx.backdrop | 0;
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.fillWithBackdropSpecial = function () {
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            this.buffer[xStart | 0] = this.colorEffectsRenderer.process(0, this.gfx.backdrop | 0) | 0;
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite1Layer = function (layer0) {
    layer0 = layer0 | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = this.buffer[xStart | layer0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                this.buffer[xStart | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite2Layer = function (layer0, layer1) {
    layer0 = layer0 | 0;
    layer1 = layer1 | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = this.buffer[xStart | layer0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer1] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                this.buffer[xStart | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite3Layer = function (layer0, layer1, layer2) {
    layer0 = layer0 | 0;
    layer1 = layer1 | 0;
    layer2 = layer2 | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = this.buffer[xStart | layer0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer1] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer2] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                this.buffer[xStart | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite4Layer = function (layer0, layer1, layer2, layer3) {
    layer0 = layer0 | 0;
    layer1 = layer1 | 0;
    layer2 = layer2 | 0;
    layer3 = layer3 | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = this.buffer[xStart | layer0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer1] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer2] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer3] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                this.buffer[xStart | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite5Layer = function (layer0, layer1, layer2, layer3, layer4) {
    layer0 = layer0 | 0;
    layer1 = layer1 | 0;
    layer2 = layer2 | 0;
    layer3 = layer3 | 0;
    layer4 = layer4 | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = this.buffer[xStart | layer0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer1] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer2] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer3] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer4] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                this.buffer[xStart | 0] = currentPixel | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite1LayerSpecial = function (layer0) {
    layer0 = layer0 | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = this.buffer[xStart | layer0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite2LayerSpecial = function (layer0, layer1) {
    layer0 = layer0 | 0;
    layer1 = layer1 | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = this.buffer[xStart | layer0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer1] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite3LayerSpecial = function (layer0, layer1, layer2) {
    layer0 = layer0 | 0;
    layer1 = layer1 | 0;
    layer2 = layer2 | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = this.buffer[xStart | layer0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer1] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer2] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite4LayerSpecial = function (layer0, layer1, layer2, layer3) {
    layer0 = layer0 | 0;
    layer1 = layer1 | 0;
    layer2 = layer2 | 0;
    layer3 = layer3 | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = this.buffer[xStart | layer0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer1] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer2] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer3] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}
GameBoyAdvanceOBJWindowCompositor.prototype.composite5LayerSpecial = function (layer0, layer1, layer2, layer3, layer4) {
    layer0 = layer0 | 0;
    layer1 = layer1 | 0;
    layer2 = layer2 | 0;
    layer3 = layer3 | 0;
    layer4 = layer4 | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    for (var xStart = 0; (xStart | 0) < 240; xStart = ((xStart | 0) + 1) | 0) {
        //If non-transparent OBJ (Marked for OBJ WIN) pixel detected:
        if ((this.OBJWindowBuffer[xStart | 0] | 0) < 0x3800000) {
            lowerPixel = currentPixel = this.gfx.backdrop | 0;
            workingPixel = this.buffer[xStart | layer0] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer1] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer2] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer3] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            workingPixel = this.buffer[xStart | layer4] | 0;
            if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
                lowerPixel = currentPixel | 0;
                currentPixel = workingPixel | 0;
            }
            else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
                lowerPixel = workingPixel | 0;
            }
            if ((currentPixel & 0x400000) == 0) {
                //Normal Pixel:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
            }
            else {
                //OAM Pixel Processing:
                //Pass the highest two pixels to be arbitrated in the color effects processing:
                this.buffer[xStart | 0] = this.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
            }
        }
    }
}