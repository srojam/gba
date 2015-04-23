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
function GameBoyAdvanceGraphicsRenderer(gfx, coreExposed, skippingBIOS) {
    this.gfx = gfx;
    this.coreExposed = coreExposed;
    this.initializeIO(skippingBIOS);
    this.initializeRenderer();
}
GameBoyAdvanceGraphicsRenderer.prototype.initializeIO = function (skippingBIOS) {
    //Initialize Pre-Boot:
    this.BGMode = 0;
    this.HBlankIntervalFree = false;
    this.VRAMOneDimensional = false;
    this.forcedBlank = true;
    this.display = 0;
    this.greenSwap = false;
    this.BGPriority = getUint8Array(0x4);
    this.BGCharacterBaseBlock = getUint8Array(0x4);
    this.BGMosaic = [false, false, false, false];
    this.BGPalette256 = [false, false, false, false];
    this.BGScreenBaseBlock = getUint8Array(0x4);
    this.BGDisplayOverflow = [false, false];
    this.BGScreenSize = getUint8Array(0x4);
    this.WINOutside = 0;
    this.paletteRAM = getUint8Array(0x400);
    this.VRAM = getUint8Array(0x18000);
    this.VRAM16 = getUint16View(this.VRAM);
    this.VRAM32 = getInt32View(this.VRAM);
    this.paletteRAM16 = getUint16View(this.paletteRAM);
    this.paletteRAM32 = getInt32View(this.paletteRAM);
    this.lineBuffer = getInt32Array(240);
    this.frameBuffer = this.coreExposed.frameBuffer;
    this.totalLinesPassed = 0;
    this.queuedScanLines = 0;
    this.lastUnrenderedLine = 0;
    if (skippingBIOS) {
        //BIOS entered the ROM at line 0x7C:
        this.lastUnrenderedLine = 0x7C;
    }
    this.backdrop = 0x3A00000;
}
GameBoyAdvanceGraphicsRenderer.prototype.initializeRenderer = function () {
    this.initializePaletteStorage();
    this.compositor = new GameBoyAdvanceCompositor(this);
    this.bg0Renderer = new GameBoyAdvanceBGTEXTRenderer(this, 0);
    this.bg1Renderer = new GameBoyAdvanceBGTEXTRenderer(this, 1);
    this.bg2TextRenderer = new GameBoyAdvanceBGTEXTRenderer(this, 2);
    this.bg3TextRenderer = new GameBoyAdvanceBGTEXTRenderer(this, 3);
    this.bgAffineRenderer = [
                             new GameBoyAdvanceAffineBGRenderer(this, 2),
                             new GameBoyAdvanceAffineBGRenderer(this, 3)
                             ];
    this.bg2MatrixRenderer = new GameBoyAdvanceBGMatrixRenderer(this, 2);
    this.bg3MatrixRenderer = new GameBoyAdvanceBGMatrixRenderer(this, 3);
    this.bg2FrameBufferRenderer = new GameBoyAdvanceBG2FrameBufferRenderer(this);
    this.objRenderer = new GameBoyAdvanceOBJRenderer(this);
    this.window0Renderer = new GameBoyAdvanceWindowRenderer(this);
    this.window1Renderer = new GameBoyAdvanceWindowRenderer(this);
    this.objWindowRenderer = new GameBoyAdvanceOBJWindowRenderer(this);
    this.mosaicRenderer = new GameBoyAdvanceMosaicRenderer(this);
    this.colorEffectsRenderer = new GameBoyAdvanceColorEffectsRenderer();
    this.mode0Renderer = new GameBoyAdvanceMode0Renderer(this);
    this.mode1Renderer = new GameBoyAdvanceMode1Renderer(this);
    this.mode2Renderer = new GameBoyAdvanceMode2Renderer(this);
    this.modeFrameBufferRenderer = new GameBoyAdvanceModeFrameBufferRenderer(this);
    
    this.compositorPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.initializePaletteStorage = function () {
    //Both BG and OAM in unified storage:
    this.palette256 = getInt32Array(0x100);
    this.palette256[0] = 0x3800000;
    this.paletteOBJ256 = getInt32Array(0x100);
    this.paletteOBJ256[0] = 0x3800000;
    this.palette16 = getInt32Array(0x100);
    this.paletteOBJ16 = getInt32Array(0x100);
    for (var index = 0; index < 0x10; ++index) {
        this.palette16[index << 4] = 0x3800000;
        this.paletteOBJ16[index << 4] = 0x3800000;
    }
}
GameBoyAdvanceGraphicsRenderer.prototype.ensureFraming = function () {
    //Ensure JIT framing alignment:
    if ((this.totalLinesPassed | 0) < 160) {
        //Make sure our gfx are up-to-date:
        this.graphicsJITVBlank();
        //Draw the frame:
        this.coreExposed.prepareFrame();
    }
}
GameBoyAdvanceGraphicsRenderer.prototype.graphicsJIT = function () {
    this.totalLinesPassed = 0;            //Mark frame for ensuring a JIT pass for the next framebuffer output.
    this.graphicsJITScanlineGroup();
}
GameBoyAdvanceGraphicsRenderer.prototype.graphicsJITVBlank = function () {
    //JIT the graphics to v-blank framing:
    this.totalLinesPassed = ((this.totalLinesPassed | 0) + (this.queuedScanLines | 0)) | 0;
    this.graphicsJITScanlineGroup();
}
GameBoyAdvanceGraphicsRenderer.prototype.renderScanLine = function () {
    switch (this.BGMode | 0) {
        case 0:
            this.mode0Renderer.renderScanLine(this.lastUnrenderedLine | 0);
            break;
        case 1:
            this.mode1Renderer.renderScanLine(this.lastUnrenderedLine | 0);
            break;
        case 2:
            this.mode2Renderer.renderScanLine(this.lastUnrenderedLine | 0);
            break;
        default:
            this.modeFrameBufferRenderer.renderScanLine(this.lastUnrenderedLine | 0);
    }
    //Update the affine bg counters:
    this.updateReferenceCounters();
}
GameBoyAdvanceGraphicsRenderer.prototype.updateReferenceCounters = function () {
    if ((this.lastUnrenderedLine | 0) == 159) {
        //Reset some affine bg counters on roll-over to line 0:
        this.bgAffineRenderer[0].resetReferenceCounters();
        this.bgAffineRenderer[1].resetReferenceCounters();
    }
    else {
        //Increment the affine bg counters:
        this.bgAffineRenderer[0].incrementReferenceCounters();
        this.bgAffineRenderer[1].incrementReferenceCounters();
    }
}
GameBoyAdvanceGraphicsRenderer.prototype.graphicsJITScanlineGroup = function () {
    //Normal rendering JIT, where we try to do groups of scanlines at once:
    while ((this.queuedScanLines | 0) > 0) {
        this.renderScanLine();
        if ((this.lastUnrenderedLine | 0) < 159) {
            this.lastUnrenderedLine = ((this.lastUnrenderedLine | 0) + 1) | 0;
        }
        else {
            this.lastUnrenderedLine = 0;
        }
        this.queuedScanLines = ((this.queuedScanLines | 0) - 1) | 0;
    }
}
GameBoyAdvanceGraphicsRenderer.prototype.incrementScanLineQueue = function () {
    if ((this.queuedScanLines | 0) < 160) {
        this.queuedScanLines = ((this.queuedScanLines | 0) + 1) | 0;
    }
    else {
        if ((this.lastUnrenderedLine | 0) < 159) {
            this.lastUnrenderedLine = ((this.lastUnrenderedLine | 0) + 1) | 0;
        }
        else {
            this.lastUnrenderedLine = 0;
        }
    }
}
GameBoyAdvanceGraphicsRenderer.prototype.compositorPreprocess = function () {
    this.compositor.preprocess((this.WINOutside & 0x20) == 0x20 || (this.display & 0xE0) == 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.compositeLayers = function (OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    //Arrange our layer stack so we can remove disabled and order for correct edge case priority:
    if ((this.display & 0xE0) > 0) {
        //Window registers can further disable background layers if one or more window layers enabled:
        OBJBuffer = ((this.WINOutside & 0x10) == 0x10) ? OBJBuffer : null;
        BG0Buffer = ((this.WINOutside & 0x1) == 0x1) ? BG0Buffer : null;
        BG1Buffer = ((this.WINOutside & 0x2) == 0x2) ? BG1Buffer : null;
        BG2Buffer = ((this.WINOutside & 0x4) == 0x4) ? BG2Buffer : null;
        BG3Buffer = ((this.WINOutside & 0x8) == 0x8) ? BG3Buffer : null;
    }
    this.compositor.renderScanLine(0, 240, this.lineBuffer, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer);
}
GameBoyAdvanceGraphicsRenderer.prototype.copyLineToFrameBuffer = function (line) {
    line = line | 0;
    var offsetStart = ((line | 0) * 240) | 0;
    var position = 0;
    if (this.forcedBlank) {
        for (; (position | 0) < 240; offsetStart = ((offsetStart | 0) + 1) | 0, position = ((position | 0) + 1) | 0) {
            this.frameBuffer[offsetStart | 0] = 0x7FFF;
        }
    }
    else {
        if (!this.greenSwap) {
            if (!!this.frameBuffer.set) {
                this.frameBuffer.set(this.lineBuffer, offsetStart | 0);
            }
            else {
                for (; (position | 0) < 240; offsetStart = ((offsetStart | 0) + 1) | 0, position = ((position | 0) + 1) | 0) {
                    this.frameBuffer[offsetStart | 0] = this.lineBuffer[position | 0] | 0;
                }
            }
        }
        else {
            var pixel0 = 0;
            var pixel1 = 0;
            while (position < 240) {
                pixel0 = this.lineBuffer[position | 0] | 0;
                position = ((position | 0) + 1) | 0;
                pixel1 = this.lineBuffer[position | 0] | 0;
                position = ((position | 0) + 1) | 0;
                this.frameBuffer[offsetStart | 0] = (pixel0 & 0x7C1F) | (pixel1 & 0x3E0);
                offsetStart = ((offsetStart | 0) + 1) | 0;
                this.frameBuffer[offsetStart | 0] = (pixel1 & 0x7C1F) | (pixel0 & 0x3E0);
                offsetStart = ((offsetStart | 0) + 1) | 0;
            }
        }
    }
}
GameBoyAdvanceGraphicsRenderer.prototype.writeDISPCNT0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.BGMode = data & 0x07;
    this.bg2FrameBufferRenderer.writeFrameSelect((data & 0x10) << 27);
    this.HBlankIntervalFree = ((data & 0x20) == 0x20);
    this.VRAMOneDimensional = ((data & 0x40) == 0x40);
    this.forcedBlank = ((data & 0x80) == 0x80);
    this.gfx.isRenderingCheckPreprocess();
    if ((this.BGMode | 0) > 2) {
        this.modeFrameBufferRenderer.preprocess(Math.min(this.BGMode | 0, 5) | 0);
    }
}
GameBoyAdvanceGraphicsRenderer.prototype.readDISPCNT0 = function () {
    return (this.BGMode |
            ((this.bg2FrameBufferRenderer.frameSelect > 0) ? 0x10 : 0) |
            (this.HBlankIntervalFree ? 0x20 : 0) |
            (this.VRAMOneDimensional ? 0x40 : 0) |
            (this.forcedBlank ? 0x80 : 0));
}
GameBoyAdvanceGraphicsRenderer.prototype.writeDISPCNT1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.display = data & 0xFF;
    this.compositorPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.readDISPCNT1 = function () {
    return this.display | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writeGreenSwap = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.greenSwap = ((data & 0x01) == 0x01);
}
GameBoyAdvanceGraphicsRenderer.prototype.readGreenSwap = function () {
    return (this.greenSwap ? 0x1 : 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG0CNT0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.BGPriority[0] = data & 0x3;
    this.BGCharacterBaseBlock[0] = (data & 0xC) >> 2;
    //Bits 5-6 always 0.
    this.BGMosaic[0] = ((data & 0x40) == 0x40);
    this.BGPalette256[0] = ((data & 0x80) == 0x80);
    this.bg0Renderer.palettePreprocess();
    this.bg0Renderer.priorityPreprocess();
    this.bg0Renderer.characterBaseBlockPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.readBG0CNT0 = function () {
    return (this.BGPriority[0] |
            (this.BGCharacterBaseBlock[0] << 2) |
            (this.BGMosaic[0] ? 0x40 : 0) |
            (this.BGPalette256[0] ? 0x80 : 0));
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG0CNT1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.BGScreenBaseBlock[0] = data & 0x1F;
    this.BGScreenSize[0] = (data & 0xC0) >> 6;
    this.bg0Renderer.screenSizePreprocess();
    this.bg0Renderer.screenBaseBlockPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.readBG0CNT1 = function () {
    return (this.BGScreenBaseBlock[0] |
            (this.BGScreenSize[0] << 6));
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG1CNT0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.BGPriority[1] = data & 0x3;
    this.BGCharacterBaseBlock[1] = (data & 0xC) >> 2;
    //Bits 5-6 always 0.
    this.BGMosaic[1] = ((data & 0x40) == 0x40);
    this.BGPalette256[1] = ((data & 0x80) == 0x80);
    this.bg1Renderer.palettePreprocess();
    this.bg1Renderer.priorityPreprocess();
    this.bg1Renderer.characterBaseBlockPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.readBG1CNT0 = function () {
    return (this.BGPriority[1] |
            (this.BGCharacterBaseBlock[1] << 2) |
            (this.BGMosaic[1] ? 0x40 : 0) |
            (this.BGPalette256[1] ? 0x80 : 0));
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG1CNT1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.BGScreenBaseBlock[1] = data & 0x1F;
    this.BGScreenSize[1] = (data & 0xC0) >> 6;
    this.bg1Renderer.screenSizePreprocess();
    this.bg1Renderer.screenBaseBlockPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.readBG1CNT1 = function () {
    return (this.BGScreenBaseBlock[1] |
            (this.BGScreenSize[1] << 6));
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2CNT0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.BGPriority[2] = data & 0x3;
    this.BGCharacterBaseBlock[2] = (data & 0xC) >> 2;
    //Bits 5-6 always 0.
    this.BGMosaic[2] = ((data & 0x40) == 0x40);
    this.BGPalette256[2] = ((data & 0x80) == 0x80);
    this.bg2TextRenderer.palettePreprocess();
    this.bg2TextRenderer.priorityPreprocess();
    this.bgAffineRenderer[0].priorityPreprocess();
    this.bg2TextRenderer.characterBaseBlockPreprocess();
    this.bg2MatrixRenderer.characterBaseBlockPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.readBG2CNT0 = function () {
    return (this.BGPriority[2] |
            (this.BGCharacterBaseBlock[2] << 2) |
            (this.BGMosaic[2] ? 0x40 : 0) |
            (this.BGPalette256[2] ? 0x80 : 0));
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2CNT1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.BGScreenBaseBlock[2] = data & 0x1F;
    this.BGDisplayOverflow[0] = ((data & 0x20) == 0x20);
    this.BGScreenSize[2] = (data & 0xC0) >> 6;
    this.bg2TextRenderer.screenSizePreprocess();
    this.bg2MatrixRenderer.screenSizePreprocess();
    this.bg2TextRenderer.screenBaseBlockPreprocess();
    this.bg2MatrixRenderer.screenBaseBlockPreprocess();
    this.bg2MatrixRenderer.displayOverflowPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.readBG2CNT1 = function () {
    return (this.BGScreenBaseBlock[2] |
            (this.BGDisplayOverflow[0] ? 0x20 : 0) |
            (this.BGScreenSize[2] << 6));
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3CNT0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.BGPriority[3] = data & 0x3;
    this.BGCharacterBaseBlock[3] = (data & 0xC) >> 2;
    //Bits 5-6 always 0.
    this.BGMosaic[3] = ((data & 0x40) == 0x40);
    this.BGPalette256[3] = ((data & 0x80) == 0x80);
    this.bg3TextRenderer.palettePreprocess();
    this.bg3TextRenderer.priorityPreprocess();
    this.bgAffineRenderer[1].priorityPreprocess();
    this.bg3TextRenderer.characterBaseBlockPreprocess();
    this.bg3MatrixRenderer.characterBaseBlockPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.readBG3CNT0 = function () {
    return (this.BGPriority[3] |
            (this.BGCharacterBaseBlock[3] << 2) |
            (this.BGMosaic[3] ? 0x40 : 0) |
            (this.BGPalette256[3] ? 0x80 : 0));
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3CNT1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.BGScreenBaseBlock[3] = data & 0x1F;
    this.BGDisplayOverflow[1] = ((data & 0x20) == 0x20);
    this.BGScreenSize[3] = (data & 0xC0) >> 6;
    this.bg3TextRenderer.screenSizePreprocess();
    this.bg3MatrixRenderer.screenSizePreprocess();
    this.bg3TextRenderer.screenBaseBlockPreprocess();
    this.bg3MatrixRenderer.screenBaseBlockPreprocess();
    this.bg3MatrixRenderer.displayOverflowPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.readBG3CNT1 = function () {
    return (this.BGScreenBaseBlock[3] |
            (this.BGDisplayOverflow[1] ? 0x20 : 0) |
            (this.BGScreenSize[3] << 6));
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG0HOFS0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg0Renderer.writeBGHOFS0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG0HOFS1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg0Renderer.writeBGHOFS1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG0VOFS0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg0Renderer.writeBGVOFS0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG0VOFS1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg0Renderer.writeBGVOFS1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG1HOFS0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg1Renderer.writeBGHOFS0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG1HOFS1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg1Renderer.writeBGHOFS1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG1VOFS0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg1Renderer.writeBGVOFS0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG1VOFS1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg1Renderer.writeBGVOFS1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2HOFS0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg2TextRenderer.writeBGHOFS0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2HOFS1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg2TextRenderer.writeBGHOFS1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2VOFS0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg2TextRenderer.writeBGVOFS0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2VOFS1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg2TextRenderer.writeBGVOFS1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3HOFS0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg3TextRenderer.writeBGHOFS0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3HOFS1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg3TextRenderer.writeBGHOFS1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3VOFS0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg3TextRenderer.writeBGVOFS0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3VOFS1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bg3TextRenderer.writeBGVOFS1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2PA0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGPA0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2PA1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGPA1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2PB0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGPB0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2PB1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGPB1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2PC0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGPC0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2PC1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGPC1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2PD0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGPD0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2PD1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGPD1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3PA0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGPA0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3PA1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGPA1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3PB0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGPB0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3PB1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGPB1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3PC0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGPC0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3PC1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGPC1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3PD0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGPD0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3PD1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGPD1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2X_L0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGX_L0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2X_L1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGX_L1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2X_H0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGX_H0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2X_H1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGX_H1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2Y_L0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGY_L0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2Y_L1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGY_L1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2Y_H0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGY_H0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG2Y_H1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[0].writeBGY_H1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3X_L0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGX_L0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3X_L1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGX_L1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3X_H0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGX_H0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3X_H1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGX_H1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3Y_L0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGY_L0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3Y_L1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGY_L1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3Y_H0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGY_H0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBG3Y_H1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.bgAffineRenderer[1].writeBGY_H1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWIN0H0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.window0Renderer.writeWINH0(data | 0);        //Window x-coord goes up to this minus 1.
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWIN0H1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.window0Renderer.writeWINH1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWIN1H0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.window1Renderer.writeWINH0(data | 0);        //Window x-coord goes up to this minus 1.
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWIN1H1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.window1Renderer.writeWINH1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWIN0V0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.window0Renderer.writeWINV0(data | 0);        //Window y-coord goes up to this minus 1.
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWIN0V1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.window0Renderer.writeWINV1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWIN1V0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.window1Renderer.writeWINV0(data | 0);        //Window y-coord goes up to this minus 1.
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWIN1V1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.window1Renderer.writeWINV1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWININ0 = function (data) {
    data = data | 0;
    //Window 0:
    this.graphicsJIT();
    this.window0Renderer.writeWININ(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.readWININ0 = function () {
    //Window 0:
    return this.window0Renderer.readWININ() | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWININ1 = function (data) {
    data = data | 0;
    //Window 1:
    this.graphicsJIT();
    this.window1Renderer.writeWININ(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.readWININ1 = function () {
    //Window 1:
    return this.window1Renderer.readWININ() | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWINOUT0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.WINOutside = data & 0x3F;
    this.compositorPreprocess();
}
GameBoyAdvanceGraphicsRenderer.prototype.readWINOUT0 = function () {
    return this.WINOutside | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writeWINOUT1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.objWindowRenderer.writeWINOUT1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.readWINOUT1 = function () {
    return this.objWindowRenderer.readWINOUT1() | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writeMOSAIC0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.mosaicRenderer.writeMOSAIC0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeMOSAIC1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.mosaicRenderer.writeMOSAIC1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBLDCNT0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.colorEffectsRenderer.writeBLDCNT0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.readBLDCNT0 = function () {
    return this.colorEffectsRenderer.readBLDCNT0() | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBLDCNT1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.colorEffectsRenderer.writeBLDCNT1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.readBLDCNT1 = function () {
    return this.colorEffectsRenderer.readBLDCNT1() | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBLDALPHA0 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.colorEffectsRenderer.writeBLDALPHA0(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.readBLDALPHA0 = function () {
    return this.colorEffectsRenderer.readBLDALPHA0() | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBLDALPHA1 = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.colorEffectsRenderer.writeBLDALPHA1(data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.readBLDALPHA1 = function () {
    return this.colorEffectsRenderer.readBLDALPHA1() | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writeBLDY = function (data) {
    data = data | 0;
    this.graphicsJIT();
    this.colorEffectsRenderer.writeBLDY(data | 0);
}
if (__LITTLE_ENDIAN__) {
    GameBoyAdvanceGraphicsRenderer.prototype.writeVRAM8 = function (address, data) {
        address = address | 0;
        data = data | 0;
        if ((address & 0x10000) == 0 || ((address & 0x17FFF) < 0x14000 && (this.BGMode | 0) >= 3)) {
            this.graphicsJIT();
            address = address & (((address & 0x10000) >> 1) ^ address);
            this.VRAM16[(address >> 1) & 0xFFFF] = Math.imul(data & 0xFF, 0x101) | 0;
        }
    }
    GameBoyAdvanceGraphicsRenderer.prototype.writeVRAM16 = function (address, data) {
        address = address | 0;
        data = data | 0;
        this.graphicsJIT();
        address = address & (((address & 0x10000) >> 1) ^ address);
        this.VRAM16[(address >> 1) & 0xFFFF] = data & 0xFFFF;
    }
    GameBoyAdvanceGraphicsRenderer.prototype.writeVRAM32 = function (address, data) {
        address = address | 0;
        data = data | 0;
        this.graphicsJIT();
        address = address & (((address & 0x10000) >> 1) ^ address);
        this.VRAM32[(address >> 2) & 0x7FFF] = data | 0;
    }
    GameBoyAdvanceGraphicsRenderer.prototype.readVRAM16 = function (address) {
        address = address | 0;
        address = address & (((address & 0x10000) >> 1) ^ address);
        return this.VRAM16[(address >> 1) & 0xFFFF] | 0;
    }
    GameBoyAdvanceGraphicsRenderer.prototype.readVRAM32 = function (address) {
        address = address | 0;
        address = address & (((address & 0x10000) >> 1) ^ address);
        return this.VRAM32[(address >> 2) & 0x7FFF] | 0;
    }
    GameBoyAdvanceGraphicsRenderer.prototype.writePalette16 = function (address, data) {
        data = data | 0;
        address = address >> 1;
        this.graphicsJIT();
        this.paletteRAM16[address & 0x1FF] = data | 0;
        data = data & 0x7FFF;
        this.writePalette256Color(address | 0, data | 0);
        this.writePalette16Color(address | 0, data | 0);
    }
    GameBoyAdvanceGraphicsRenderer.prototype.writePalette32 = function (address, data) {
        data = data | 0;
        address = address >> 1;
        this.graphicsJIT();
        this.paletteRAM32[(address >> 1) & 0xFF] = data | 0;
        var palette = data & 0x7FFF;
        this.writePalette256Color(address | 0, palette | 0);
        this.writePalette16Color(address | 0, palette | 0);
        palette = (data >> 16) & 0x7FFF;
        this.writePalette256Color(address | 1, palette | 0);
        this.writePalette16Color(address | 1, palette | 0);
    }
    GameBoyAdvanceGraphicsRenderer.prototype.readPalette16 = function (address) {
        address = address | 0;
        return this.paletteRAM16[(address >> 1) & 0x1FF] | 0;
    }
    GameBoyAdvanceGraphicsRenderer.prototype.readPalette32 = function (address) {
        address = address | 0;
        return this.paletteRAM32[(address >> 2) & 0xFF] | 0;
    }
}
else {
    GameBoyAdvanceGraphicsRenderer.prototype.writeVRAM8 = function (address, data) {
        address &= 0x1FFFE & (((address & 0x10000) >> 1) ^ address);
        if (address < 0x10000 || ((address & 0x17FFF) < 0x14000 && this.BGMode >= 3)) {
            this.graphicsJIT();
            this.VRAM[address++] = data & 0xFF;
            this.VRAM[address] = data & 0xFF;
        }
    }
    GameBoyAdvanceGraphicsRenderer.prototype.writeVRAM16 = function (address, data) {
        address &= 0x1FFFE & (((address & 0x10000) >> 1) ^ address);
        this.graphicsJIT();
        this.VRAM[address++] = data & 0xFF;
        this.VRAM[address] = (data >> 8) & 0xFF;
    }
    GameBoyAdvanceGraphicsRenderer.prototype.writeVRAM32 = function (address, data) {
        address &= 0x1FFFC & (((address & 0x10000) >> 1) ^ address);
        this.graphicsJIT();
        this.VRAM[address++] = data & 0xFF;
        this.VRAM[address++] = (data >> 8) & 0xFF;
        this.VRAM[address++] = (data >> 16) & 0xFF;
        this.VRAM[address] = data >>> 24;
    }
    GameBoyAdvanceGraphicsRenderer.prototype.readVRAM16 = function (address) {
        address &= 0x1FFFE & (((address & 0x10000) >> 1) ^ address);
        return this.VRAM[address] | (this.VRAM[address + 1] << 8);
    }
    GameBoyAdvanceGraphicsRenderer.prototype.readVRAM32 = function (address) {
        address &= 0x1FFFC & (((address & 0x10000) >> 1) ^ address);
        return this.VRAM[address] | (this.VRAM[address + 1] << 8) | (this.VRAM[address + 2] << 16) | (this.VRAM[address + 3] << 24);
    }
    GameBoyAdvanceGraphicsRenderer.prototype.writePalette16 = function (address, data) {
        this.graphicsJIT();
        this.paletteRAM[address] = data & 0xFF;
        this.paletteRAM[address | 1] = data >> 8;
        data &= 0x7FFF;
        address >>= 1;
        this.writePalette256Color(address, data);
        this.writePalette16Color(address, data);
    }
    GameBoyAdvanceGraphicsRenderer.prototype.writePalette32 = function (address, data) {
        this.graphicsJIT();
        this.paletteRAM[address] = data & 0xFF;
        this.paletteRAM[address | 1] = (data >> 8) & 0xFF;
        this.paletteRAM[address | 2] = (data >> 16) & 0xFF;
        this.paletteRAM[address | 3] = data >>> 24;
        address >>= 1;
        var palette = data & 0x7FFF;
        this.writePalette256Color(address, palette);
        this.writePalette16Color(address, palette);
        palette = (data >> 16) & 0x7FFF;
        address |= 1;
        this.writePalette256Color(address, palette);
        this.writePalette16Color(address, palette);
    }
    GameBoyAdvanceGraphicsRenderer.prototype.readPalette16 = function (address) {
        address &= 0x3FE;
        return this.paletteRAM[address] | (this.paletteRAM[address | 1] << 8);
    }
    GameBoyAdvanceGraphicsRenderer.prototype.readPalette32 = function (address) {
        address &= 0x3FC;
        return this.paletteRAM[address] | (this.paletteRAM[address | 1] << 8) | (this.paletteRAM[address | 2] << 16)  | (this.paletteRAM[address | 3] << 24);
    }
}
GameBoyAdvanceGraphicsRenderer.prototype.readVRAM8 = function (address) {
    address = address | 0;
    address = address & (((address & 0x10000) >> 1) ^ address);
    return this.VRAM[address & 0x1FFFF] | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writeOAM16 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.graphicsJIT();
    this.objRenderer.writeOAM16(address >> 1, data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.writeOAM32 = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.graphicsJIT();
    this.objRenderer.writeOAM32(address >> 2, data | 0);
}
GameBoyAdvanceGraphicsRenderer.prototype.readOAM = function (address) {
    return this.objRenderer.readOAM(address | 0) | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.readOAM16 = function (address) {
    return this.objRenderer.readOAM16(address | 0) | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.readOAM32 = function (address) {
    return this.objRenderer.readOAM32(address | 0) | 0;
}
GameBoyAdvanceGraphicsRenderer.prototype.writePalette256Color = function (address, palette) {
    address = address | 0;
    palette = palette | 0;
    if ((address & 0xFF) == 0) {
        palette = 0x3800000 | palette;
        if (address == 0) {
            this.backdrop = palette | 0x200000;
        }
    }
    if ((address | 0) < 0x100) {
        this.palette256[address & 0xFF] = palette | 0;
    }
    else {
        this.paletteOBJ256[address & 0xFF] = palette | 0;
    }
}
GameBoyAdvanceGraphicsRenderer.prototype.writePalette16Color = function (address, palette) {
    address = address | 0;
    palette = palette | 0;
    if ((address & 0xF) == 0) {
        palette = 0x3800000 | palette;
    }
    if ((address | 0) < 0x100) {
        //BG Layer Palette:
        this.palette16[address & 0xFF] = palette | 0;
    }
    else {
        //OBJ Layer Palette:
        this.paletteOBJ16[address & 0xFF] = palette | 0;
    }
}
GameBoyAdvanceGraphicsRenderer.prototype.readPalette = function (address) {
    return this.paletteRAM[address & 0x3FF] | 0;
}