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
function GameBoyAdvanceCompositor(gfx) {
    this.gfx = gfx;
    this.preprocess(false);
}
GameBoyAdvanceCompositor.prototype.preprocess = function (doEffects) {
    this.renderScanLine = (doEffects) ? this.renderScanLineWithEffects : this.renderNormalScanLine;
}
GameBoyAdvanceCompositor.prototype.cleanLayerStack = function (OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    //Clear out disabled layers from our stack:
    var layerStack = [];
    if (BG3Buffer) {
        layerStack.push(BG3Buffer);
    }
    if (BG2Buffer) {
        layerStack.push(BG2Buffer);
    }
    if (BG1Buffer) {
        layerStack.push(BG1Buffer);
    }
    if (BG0Buffer) {
        layerStack.push(BG0Buffer);
    }
    if (OBJBuffer) {
        layerStack.push(OBJBuffer);
    }
    return layerStack;
}
GameBoyAdvanceCompositor.prototype.renderNormalScanLine = function (xStart, xEnd, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var layerStack = this.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
    switch (layerStack.length) {
        case 0:
            this.fillWithBackdrop(xStart | 0, xEnd | 0, lineBuffer);
            break;
        case 1:
            this.composite1Layer(xStart | 0, xEnd | 0, lineBuffer, layerStack[0]);
            break;
        case 2:
            this.composite2Layer(xStart | 0, xEnd | 0, lineBuffer, layerStack[0], layerStack[1]);
            break;
        case 3:
            this.composite3Layer(xStart | 0, xEnd | 0, lineBuffer, layerStack[0], layerStack[1], layerStack[2]);
            break;
        case 4:
            this.composite4Layer(xStart | 0, xEnd | 0, lineBuffer, layerStack[0], layerStack[1], layerStack[2], layerStack[3]);
            break;
        case 5:
            this.composite5Layer(xStart | 0, xEnd | 0, lineBuffer, layerStack[0], layerStack[1], layerStack[2], layerStack[3], layerStack[4]);
    }
}
GameBoyAdvanceCompositor.prototype.renderScanLineWithEffects = function (xStart, xEnd, lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var layerStack = this.cleanLayerStack(OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
    switch (layerStack.length) {
        case 0:
            this.fillWithBackdropSpecial(xStart | 0, xEnd | 0, lineBuffer);
            break;
        case 1:
            this.composite1LayerSpecial(xStart | 0, xEnd | 0, lineBuffer, layerStack[0]);
            break;
        case 2:
            this.composite2LayerSpecial(xStart | 0, xEnd | 0, lineBuffer, layerStack[0], layerStack[1]);
            break;
        case 3:
            this.composite3LayerSpecial(xStart | 0, xEnd | 0, lineBuffer, layerStack[0], layerStack[1], layerStack[2]);
            break;
        case 4:
            this.composite4LayerSpecial(xStart | 0, xEnd | 0, lineBuffer, layerStack[0], layerStack[1], layerStack[2], layerStack[3]);
            break;
        case 5:
            this.composite5LayerSpecial(xStart | 0, xEnd | 0, lineBuffer, layerStack[0], layerStack[1], layerStack[2], layerStack[3], layerStack[4]);
    }
}
GameBoyAdvanceCompositor.prototype.fillWithBackdrop = function (xStart, xEnd, lineBuffer) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lineBuffer[xStart | 0] = this.gfx.backdrop | 0;
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.fillWithBackdropSpecial = function (xStart, xEnd, lineBuffer) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.process(0, this.gfx.backdrop | 0) | 0;
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.composite1Layer = function (xStart, xEnd, lineBuffer, layer0) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lowerPixel = currentPixel = this.gfx.backdrop | 0;
        workingPixel = layer0[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        if ((currentPixel & 0x400000) == 0) {
            //Normal Pixel:
            lineBuffer[xStart | 0] = currentPixel | 0;
        }
        else {
            //OAM Pixel Processing:
            //Pass the highest two pixels to be arbitrated in the color effects processing:
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
        }
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.composite2Layer = function (xStart, xEnd, lineBuffer, layer0, layer1) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lowerPixel = currentPixel = this.gfx.backdrop | 0;
        workingPixel = layer0[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer1[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        if ((currentPixel & 0x400000) == 0) {
            //Normal Pixel:
            lineBuffer[xStart | 0] = currentPixel | 0;
        }
        else {
            //OAM Pixel Processing:
            //Pass the highest two pixels to be arbitrated in the color effects processing:
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
        }
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.composite3Layer = function (xStart, xEnd, lineBuffer, layer0, layer1, layer2) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lowerPixel = currentPixel = this.gfx.backdrop | 0;
        workingPixel = layer0[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer1[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer2[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        if ((currentPixel & 0x400000) == 0) {
            //Normal Pixel:
            lineBuffer[xStart | 0] = currentPixel | 0;
        }
        else {
            //OAM Pixel Processing:
            //Pass the highest two pixels to be arbitrated in the color effects processing:
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
        }
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.composite4Layer = function (xStart, xEnd, lineBuffer, layer0, layer1, layer2, layer3) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lowerPixel = currentPixel = this.gfx.backdrop | 0;
        workingPixel = layer0[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer1[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer2[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer3[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        if ((currentPixel & 0x400000) == 0) {
            //Normal Pixel:
            lineBuffer[xStart | 0] = currentPixel | 0;
        }
        else {
            //OAM Pixel Processing:
            //Pass the highest two pixels to be arbitrated in the color effects processing:
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
        }
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.composite5Layer = function (xStart, xEnd, lineBuffer, layer0, layer1, layer2, layer3, layer4) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lowerPixel = currentPixel = this.gfx.backdrop | 0;
        workingPixel = layer0[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer1[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer2[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer3[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer4[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        if ((currentPixel & 0x400000) == 0) {
            //Normal Pixel:
            lineBuffer[xStart | 0] = currentPixel | 0;
        }
        else {
            //OAM Pixel Processing:
            //Pass the highest two pixels to be arbitrated in the color effects processing:
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
        }
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.composite1LayerSpecial = function (xStart, xEnd, lineBuffer, layer0) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lowerPixel = currentPixel = this.gfx.backdrop | 0;
        workingPixel = layer0[xStart | 0] | 0;
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
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
        }
        else {
            //OAM Pixel Processing:
            //Pass the highest two pixels to be arbitrated in the color effects processing:
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
        }
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.composite2LayerSpecial = function (xStart, xEnd, lineBuffer, layer0, layer1) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lowerPixel = currentPixel = this.gfx.backdrop | 0;
        workingPixel = layer0[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer1[xStart | 0] | 0;
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
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
        }
        else {
            //OAM Pixel Processing:
            //Pass the highest two pixels to be arbitrated in the color effects processing:
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
        }
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.composite3LayerSpecial = function (xStart, xEnd, lineBuffer, layer0, layer1, layer2) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lowerPixel = currentPixel = this.gfx.backdrop | 0;
        workingPixel = layer0[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer1[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer2[xStart | 0] | 0;
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
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
        }
        else {
            //OAM Pixel Processing:
            //Pass the highest two pixels to be arbitrated in the color effects processing:
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
        }
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.composite4LayerSpecial = function (xStart, xEnd, lineBuffer, layer0, layer1, layer2, layer3) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lowerPixel = currentPixel = this.gfx.backdrop | 0;
        workingPixel = layer0[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer1[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer2[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer3[xStart | 0] | 0;
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
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
        }
        else {
            //OAM Pixel Processing:
            //Pass the highest two pixels to be arbitrated in the color effects processing:
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
        }
        xStart = ((xStart | 0) + 1) | 0;
    }
}
GameBoyAdvanceCompositor.prototype.composite5LayerSpecial = function (xStart, xEnd, lineBuffer, layer0, layer1, layer2, layer3, layer4) {
    xStart = xStart | 0;
    xEnd = xEnd | 0;
    var currentPixel = 0;
    var lowerPixel = 0;
    var workingPixel = 0;
    while ((xStart | 0) < (xEnd | 0)) {
        lowerPixel = currentPixel = this.gfx.backdrop | 0;
        workingPixel = layer0[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer1[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer2[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer3[xStart | 0] | 0;
        if ((workingPixel & 0x3800000) <= (currentPixel & 0x1800000)) {
            lowerPixel = currentPixel | 0;
            currentPixel = workingPixel | 0;
        }
        else if ((workingPixel & 0x3800000) <= (lowerPixel & 0x1800000)) {
            lowerPixel = workingPixel | 0;
        }
        workingPixel = layer4[xStart | 0] | 0;
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
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.process(lowerPixel | 0, currentPixel | 0) | 0;
        }
        else {
            //OAM Pixel Processing:
            //Pass the highest two pixels to be arbitrated in the color effects processing:
            lineBuffer[xStart | 0] = this.gfx.colorEffectsRenderer.processOAMSemiTransparent(lowerPixel | 0, currentPixel | 0) | 0;
        }
        xStart = ((xStart | 0) + 1) | 0;
    }
}