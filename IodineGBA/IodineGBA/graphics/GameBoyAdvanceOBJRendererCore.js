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
function GameBoyAdvanceOBJRenderer(gfx) {
    this.gfx = gfx;
    this.paletteOBJ256 = this.gfx.paletteOBJ256;
    this.paletteOBJ16 = this.gfx.paletteOBJ16;
    this.VRAM = this.gfx.VRAM;
    this.initialize();
}
GameBoyAdvanceOBJRenderer.prototype.lookupXSize = [
    //Square:
    8,  16, 32, 64,
    //Vertical Rectangle:
    16, 32, 32, 64,
    //Horizontal Rectangle:
    8,   8, 16, 32
];
GameBoyAdvanceOBJRenderer.prototype.lookupYSize = [
    //Square:
    8,  16, 32, 64,
    //Vertical Rectangle:
    8,   8, 16, 32,
    //Horizontal Rectangle:
    16, 32, 32, 64
];
if (__VIEWS_SUPPORTED__) {
    if (typeof getUint8Array(1).fill == "function") {
        GameBoyAdvanceOBJRenderer.prototype.initialize = function () {
            this.VRAM32 = this.gfx.VRAM32;
            this.OAMRAM = getUint8Array(0x400);
            this.OAMRAM16 = getUint16View(this.OAMRAM);
            this.OAMRAM32 = getInt32View(this.OAMRAM);
            this.scratchBuffer = getInt32Array(240);
            this.scratchWindowBuffer = getInt32Array(240);
            this.scratchOBJBuffer = getInt32Array(128);
            this.targetBuffer = null;
            this.OBJMatrixParameters = getInt32Array(0x80);
            this.initializeOAMTable();
        }
        GameBoyAdvanceOBJRenderer.prototype.clearScratch = function () {
            this.targetBuffer.fill(0x3800000);
        }
    }
    else {
        GameBoyAdvanceOBJRenderer.prototype.initialize = function () {
            this.VRAM32 = this.gfx.VRAM32;
            this.OAMRAM = getUint8Array(0x400);
            this.OAMRAM16 = getUint16View(this.OAMRAM);
            this.OAMRAM32 = getInt32View(this.OAMRAM);
            this.scratchBuffer = getInt32Array(240);
            this.scratchWindowBuffer = getInt32Array(240);
            this.scratchOBJBuffer = getInt32Array(128);
            this.clearingBuffer = getInt32Array(240);
            this.targetBuffer = null;
            this.initializeClearingBuffer();
            this.OBJMatrixParameters = getInt32Array(0x80);
            this.initializeOAMTable();
        }
        GameBoyAdvanceOBJRenderer.prototype.clearScratch = function () {
            this.targetBuffer.set(this.clearingBuffer);
        }
        GameBoyAdvanceOBJRenderer.prototype.initializeClearingBuffer = function () {
            for (var position = 0; position < 240; ++position) {
                this.clearingBuffer[position] = 0x3800000;
            }
        }
    }
}
else {
    GameBoyAdvanceOBJRenderer.prototype.initialize = function () {
        this.OAMRAM = getUint8Array(0x400);
        this.scratchBuffer = getInt32Array(240);
        this.scratchWindowBuffer = getInt32Array(240);
        this.scratchOBJBuffer = getInt32Array(128);
        this.targetBuffer = null;
        this.OBJMatrixParameters = getInt32Array(0x80);
        this.initializeOAMTable();
    }
    GameBoyAdvanceOBJRenderer.prototype.clearScratch = function () {
        for (var position = 0; position < 240; ++position) {
            this.targetBuffer[position] = 0x3800000;
        }
    }
}
GameBoyAdvanceOBJRenderer.prototype.initializeOAMTable = function () {
    this.OAMTable = [];
    for (var spriteNumber = 0; (spriteNumber | 0) < 128; spriteNumber = ((spriteNumber | 0) + 1) | 0) {
        this.OAMTable[spriteNumber | 0] = this.makeOAMAttributeTable();
    }
}
if (typeof TypedObject == "object" && typeof TypedObject.StructType == "object") {
    GameBoyAdvanceOBJRenderer.prototype.makeOAMAttributeTable = function () {
        return new TypedObject.StructType({
                                          ycoord:TypedObject.int32,
                                          matrix2D:TypedObject.int32,
                                          doubleSizeOrDisabled:TypedObject.int32,
                                          mode:TypedObject.int32,
                                          mosaic:TypedObject.int32,
                                          monolithicPalette:TypedObject.int32,
                                          shape:TypedObject.int32,
                                          xcoord:TypedObject.int32,
                                          matrixParameters:TypedObject.int32,
                                          horizontalFlip:TypedObject.int32,
                                          verticalFlip:TypedObject.int32,
                                          size:TypedObject.int32,
                                          tileNumber:TypedObject.int32,
                                          priority:TypedObject.int32,
                                          paletteNumber:TypedObject.int32
                                          });
    }
}
else {
    GameBoyAdvanceOBJRenderer.prototype.makeOAMAttributeTable = function () {
        return {
        ycoord:0,
        matrix2D:0,
        doubleSizeOrDisabled:0,
        mode:0,
        mosaic:0,
        monolithicPalette:0,
        shape:0,
        xcoord:0,
        matrixParameters:0,
        horizontalFlip:0,
        verticalFlip:0,
        size:0,
        tileNumber:0,
        priority:0,
        paletteNumber:0
        };
    }
}
GameBoyAdvanceOBJRenderer.prototype.renderScanLine = function (line) {
    this.targetBuffer = this.scratchBuffer;
    this.performRenderLoop(line | 0, false);
    return this.scratchBuffer;
}
GameBoyAdvanceOBJRenderer.prototype.renderWindowScanLine = function (line) {
    this.targetBuffer = this.scratchWindowBuffer;
    this.performRenderLoop(line | 0, true);
    return this.scratchWindowBuffer;
}
GameBoyAdvanceOBJRenderer.prototype.performRenderLoop = function (line, isOBJWindow) {
    this.clearScratch();
    for (var objNumber = 0; objNumber < 0x80; ++objNumber) {
        this.renderSprite(line | 0, this.OAMTable[objNumber], isOBJWindow);
    }
}
GameBoyAdvanceOBJRenderer.prototype.renderSprite = function (line, sprite, isOBJWindow) {
    line = line | 0;
    if (this.isDrawable(sprite, isOBJWindow)) {
        if ((sprite.mosaic | 0) != 0) {
            //Correct line number for mosaic:
            line = ((line | 0) - (this.gfx.mosaicRenderer.getOBJMosaicYOffset(line | 0) | 0)) | 0;
        }
        //Obtain horizontal size info:
        var xSize = this.lookupXSize[(sprite.shape << 2) | sprite.size] << (sprite.doubleSizeOrDisabled | 0);
        //Obtain vertical size info:
        var ySize = this.lookupYSize[(sprite.shape << 2) | sprite.size] << (sprite.doubleSizeOrDisabled | 0);
        //Obtain some offsets:
        var ycoord = sprite.ycoord | 0;
        var yOffset = ((line | 0) - (ycoord | 0)) | 0;
        //Overflow Correction:
        if ((yOffset | 0) < 0 || (((ycoord | 0) + (ySize | 0)) | 0) > 0x100) {
            /*
             HW re-offsets any "negative" y-coord values to on-screen unsigned.
             Also a bug triggers this on 8-bit ending coordinate overflow from large sprites.
             */
            yOffset = ((yOffset | 0) + 0x100) | 0;
        }
        //Make a sprite line:
        ySize = ((ySize | 0) - 1) | 0;
        if ((yOffset & ySize) == (yOffset | 0)) {
            if ((sprite.matrix2D | 0) != 0) {
                //Scale & Rotation:
                this.renderMatrixSprite(sprite, xSize | 0, ((ySize | 0) + 1) | 0, yOffset | 0);
            }
            else {
                //Regular Scrolling:
                this.renderNormalSprite(sprite, xSize | 0, ySize | 0, yOffset | 0);
            }
            //Mark for semi-transparent:
            if ((sprite.mode | 0) == 1) {
                this.markSemiTransparent(xSize | 0);
            }
            //Copy OBJ scratch buffer to scratch line buffer:
            this.outputSpriteToScratch(sprite, xSize | 0);
        }
    }
}
if (typeof Math.imul == "function") {
    //Math.imul found, insert the optimized path in:
    GameBoyAdvanceOBJRenderer.prototype.renderMatrixSprite = function (sprite, xSize, ySize, yOffset) {
        xSize = xSize | 0;
        ySize = ySize | 0;
        yOffset = yOffset | 0;
        var xDiff = (-(xSize >> 1)) | 0;
        var yDiff = ((yOffset | 0) - (ySize >> 1)) | 0;
        var xSizeOriginal = xSize >> (sprite.doubleSizeOrDisabled | 0);
        var xSizeFixed = xSizeOriginal << 8;
        var ySizeOriginal = ySize >> (sprite.doubleSizeOrDisabled | 0);
        var ySizeFixed = ySizeOriginal << 8;
        var dx = this.OBJMatrixParameters[sprite.matrixParameters | 0] | 0;
        var dmx = this.OBJMatrixParameters[sprite.matrixParameters | 1] | 0;
        var dy = this.OBJMatrixParameters[sprite.matrixParameters | 2] | 0;
        var dmy = this.OBJMatrixParameters[sprite.matrixParameters | 3] | 0;
        var pa = Math.imul(dx | 0, xDiff | 0) | 0;
        var pb = Math.imul(dmx | 0, yDiff | 0) | 0;
        var pc = Math.imul(dy | 0, xDiff | 0) | 0;
        var pd = Math.imul(dmy | 0, yDiff | 0) | 0;
        var x = ((pa | 0) + (pb | 0)) | 0;
        x = ((x | 0) + (xSizeFixed >> 1)) | 0;
        var y = ((pc | 0) + (pd | 0)) | 0;
        y = ((y | 0) + (ySizeFixed >> 1)) | 0;
        for (var position = 0; (position | 0) < (xSize | 0); position = (position + 1) | 0, x = ((x | 0) + (dx | 0)) | 0, y = ((y | 0) + (dy | 0)) | 0) {
            if ((x | 0) >= 0 && (y | 0) >= 0 && (x | 0) < (xSizeFixed | 0) && (y | 0) < (ySizeFixed | 0)) {
                //Coordinates in range, fetch pixel:
                this.scratchOBJBuffer[position | 0] = this.fetchMatrixPixel(sprite, x >> 8, y >> 8, xSizeOriginal | 0) | 0;
            }
            else {
                //Coordinates outside of range, transparency defaulted:
                this.scratchOBJBuffer[position | 0] = 0x3800000;
            }
        }
    }
}
else {
    //Math.imul not found, use the compatibility method:
    GameBoyAdvanceOBJRenderer.prototype.renderMatrixSprite = function (sprite, xSize, ySize, yOffset) {
        var xDiff = -(xSize >> 1);
        var yDiff = yOffset - (ySize >> 1);
        var xSizeOriginal = xSize >> sprite.doubleSizeOrDisabled;
        var xSizeFixed = xSizeOriginal << 8;
        var ySizeOriginal = ySize >> sprite.doubleSizeOrDisabled;
        var ySizeFixed = ySizeOriginal << 8;
        var dx = this.OBJMatrixParameters[sprite.matrixParameters];
        var dmx = this.OBJMatrixParameters[sprite.matrixParameters | 1];
        var dy = this.OBJMatrixParameters[sprite.matrixParameters | 2];
        var dmy = this.OBJMatrixParameters[sprite.matrixParameters | 3];
        var pa = dx * xDiff;
        var pb = dmx * yDiff;
        var pc = dy * xDiff;
        var pd = dmy * yDiff;
        var x = pa + pb + (xSizeFixed >> 1);
        var y = pc + pd + (ySizeFixed >> 1);
        for (var position = 0; position < xSize; ++position, x += dx, y += dy) {
            if (x >= 0 && y >= 0 && x < xSizeFixed && y < ySizeFixed) {
                //Coordinates in range, fetch pixel:
                this.scratchOBJBuffer[position] = this.fetchMatrixPixel(sprite, x >> 8, y >> 8, xSizeOriginal);
            }
            else {
                //Coordinates outside of range, transparency defaulted:
                this.scratchOBJBuffer[position] = 0x3800000;
            }
        }
        
    }
}
GameBoyAdvanceOBJRenderer.prototype.fetchMatrixPixel = function (sprite, x, y, xSize) {
    x = x | 0;
    y = y | 0;
    xSize = xSize | 0;
    if ((sprite.monolithicPalette | 0) != 0) {
        //256 Colors / 1 Palette:
        var address = this.tileNumberToAddress256(sprite.tileNumber | 0, xSize | 0, y | 0) | 0;
        address = ((address | 0) + (this.tileRelativeAddressOffset(x | 0, y | 0) | 0)) | 0;
        return this.paletteOBJ256[this.VRAM[address | 0] | 0] | 0;
    }
    else {
        //16 Colors / 16 palettes:
        var address = this.tileNumberToAddress16(sprite.tileNumber | 0, xSize | 0, y | 0) | 0;
        address = ((address | 0) + ((this.tileRelativeAddressOffset(x | 0, y | 0) >> 1) | 0)) | 0;
        if ((x & 0x1) == 0) {
            return this.paletteOBJ16[sprite.paletteNumber | this.VRAM[address | 0] & 0xF] | 0;
        }
        else {
            return this.paletteOBJ16[sprite.paletteNumber | this.VRAM[address | 0] >> 4] | 0;
        }
    }
}
GameBoyAdvanceOBJRenderer.prototype.tileRelativeAddressOffset = function (x, y) {
    x = x | 0;
    y = y | 0;
    return ((((y & 7) + (x & -8)) << 3) + (x & 0x7)) | 0;
}
GameBoyAdvanceOBJRenderer.prototype.renderNormalSprite = function (sprite, xSize, ySize, yOffset) {
    xSize = xSize | 0;
    ySize = ySize | 0;
    yOffset = yOffset | 0;
    if ((sprite.verticalFlip | 0) != 0) {
        //Flip y-coordinate offset:
        yOffset = ((ySize | 0) - (yOffset | 0)) | 0;
    }
    if ((sprite.monolithicPalette | 0) != 0) {
        //256 Colors / 1 Palette:
        var address = this.tileNumberToAddress256(sprite.tileNumber | 0, xSize | 0, yOffset | 0) | 0;
        address = ((address | 0) + ((yOffset & 7) << 3)) | 0;
        this.render256ColorPaletteSprite(address | 0, xSize | 0);
    }
    else {
        //16 Colors / 16 palettes:
        var address = this.tileNumberToAddress16(sprite.tileNumber | 0, xSize | 0, yOffset | 0) | 0;
        address = ((address | 0) + ((yOffset & 7) << 2)) | 0;
        this.render16ColorPaletteSprite(address | 0, xSize | 0, sprite.paletteNumber | 0);
    }
}
if (__LITTLE_ENDIAN__) {
    GameBoyAdvanceOBJRenderer.prototype.render256ColorPaletteSprite = function (address, xSize) {
        address = address >> 2;
        xSize = xSize | 0;
        var data = 0;
        for (var objBufferPos = 0; (objBufferPos | 0) < (xSize | 0); objBufferPos = ((objBufferPos | 0) + 8) | 0) {
            data = this.VRAM32[address | 0] | 0;
            this.scratchOBJBuffer[objBufferPos | 0] = this.paletteOBJ256[data & 0xFF] | 0;
            this.scratchOBJBuffer[objBufferPos | 1] = this.paletteOBJ256[(data >> 8) & 0xFF] | 0;
            this.scratchOBJBuffer[objBufferPos | 2] = this.paletteOBJ256[(data >> 16) & 0xFF] | 0;
            this.scratchOBJBuffer[objBufferPos | 3] = this.paletteOBJ256[data >>> 24] | 0;
            data = this.VRAM32[address | 1] | 0;
            this.scratchOBJBuffer[objBufferPos | 4] = this.paletteOBJ256[data & 0xFF] | 0;
            this.scratchOBJBuffer[objBufferPos | 5] = this.paletteOBJ256[(data >> 8) & 0xFF] | 0;
            this.scratchOBJBuffer[objBufferPos | 6] = this.paletteOBJ256[(data >> 16) & 0xFF] | 0;
            this.scratchOBJBuffer[objBufferPos | 7] = this.paletteOBJ256[data >>> 24] | 0;
            address = ((address | 0) + 0x10) | 0;
        }
    }
    GameBoyAdvanceOBJRenderer.prototype.render16ColorPaletteSprite = function (address, xSize, paletteOffset) {
        address = address >> 2;
        xSize = xSize | 0;
        paletteOffset = paletteOffset | 0;
        var data = 0;
        for (var objBufferPos = 0; (objBufferPos | 0) < (xSize | 0); objBufferPos = ((objBufferPos | 0) + 8) | 0) {
            data = this.VRAM32[address | 0] | 0;
            this.scratchOBJBuffer[objBufferPos | 0] = this.paletteOBJ16[paletteOffset | (data & 0xF)] | 0;
            this.scratchOBJBuffer[objBufferPos | 1] = this.paletteOBJ16[paletteOffset | ((data >> 4) & 0xF)] | 0;
            this.scratchOBJBuffer[objBufferPos | 2] = this.paletteOBJ16[paletteOffset | ((data >> 8) & 0xF)] | 0;
            this.scratchOBJBuffer[objBufferPos | 3] = this.paletteOBJ16[paletteOffset | ((data >> 12) & 0xF)] | 0;
            this.scratchOBJBuffer[objBufferPos | 4] = this.paletteOBJ16[paletteOffset | ((data >> 16) & 0xF)] | 0;
            this.scratchOBJBuffer[objBufferPos | 5] = this.paletteOBJ16[paletteOffset | ((data >> 20) & 0xF)] | 0;
            this.scratchOBJBuffer[objBufferPos | 6] = this.paletteOBJ16[paletteOffset | ((data >> 24) & 0xF)] | 0;
            this.scratchOBJBuffer[objBufferPos | 7] = this.paletteOBJ16[paletteOffset | (data >>> 28)] | 0;
            address = ((address | 0) + 0x8) | 0;
        }
    }
}
else {
    GameBoyAdvanceOBJRenderer.prototype.render256ColorPaletteSprite = function (address, xSize) {
        for (var objBufferPos = 0; objBufferPos < xSize;) {
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ256[this.VRAM[address++]];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ256[this.VRAM[address++]];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ256[this.VRAM[address++]];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ256[this.VRAM[address++]];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ256[this.VRAM[address++]];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ256[this.VRAM[address++]];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ256[this.VRAM[address++]];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ256[this.VRAM[address]];
            address += 0x39;
        }
    }
    GameBoyAdvanceOBJRenderer.prototype.render16ColorPaletteSprite = function (address, xSize, paletteOffset) {
        var data = 0;
        for (var objBufferPos = 0; objBufferPos < xSize;) {
            data = this.VRAM[address++];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ16[paletteOffset | (data & 0xF)];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ16[paletteOffset | (data >> 4)];
            data = this.VRAM[address++];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ16[paletteOffset | (data & 0xF)];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ16[paletteOffset | (data >> 4)];
            data = this.VRAM[address++];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ16[paletteOffset | (data & 0xF)];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ16[paletteOffset | (data >> 4)];
            data = this.VRAM[address];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ16[paletteOffset | (data & 0xF)];
            this.scratchOBJBuffer[objBufferPos++] = this.paletteOBJ16[paletteOffset | (data >> 4)];
            address += 0x1D;
        }
    }
}
if (typeof Math.imul == "function") {
    //Math.imul found, insert the optimized path in:
    GameBoyAdvanceOBJRenderer.prototype.tileNumberToAddress256 = function (tileNumber, xSize, yOffset) {
        tileNumber = tileNumber | 0;
        xSize = xSize | 0;
        yOffset = yOffset | 0;
        if (!this.gfx.VRAMOneDimensional) {
            //2D Mapping (32 8x8 tiles by 32 8x8 tiles):
            //Hardware ignores the LSB in this case:
            tileNumber = ((tileNumber & -2) + (Math.imul(yOffset >> 3, 0x20) | 0)) | 0;
        }
        else {
            //1D Mapping:
            //256 Color Palette:
            tileNumber = ((tileNumber | 0) + (Math.imul(yOffset >> 3, xSize >> 2) | 0)) | 0;
        }
        //Starting address of currently drawing sprite line:
        return ((tileNumber << 5) + 0x10000) | 0;
    }
    GameBoyAdvanceOBJRenderer.prototype.tileNumberToAddress16 = function (tileNumber, xSize, yOffset) {
        tileNumber = tileNumber | 0;
        xSize = xSize | 0;
        yOffset = yOffset | 0;
        if (!this.gfx.VRAMOneDimensional) {
            //2D Mapping (32 8x8 tiles by 32 8x8 tiles):
            tileNumber = ((tileNumber | 0) + (Math.imul(yOffset >> 3, 0x20) | 0)) | 0;
        }
        else {
            //1D Mapping:
            //16 Color Palette:
            tileNumber = ((tileNumber | 0) + (Math.imul(yOffset >> 3, xSize >> 3) | 0)) | 0;
        }
        //Starting address of currently drawing sprite line:
        return ((tileNumber << 5) + 0x10000) | 0;
    }
}
else {
    //Math.imul not found, use the compatibility method:
    GameBoyAdvanceOBJRenderer.prototype.tileNumberToAddress256 = function (tileNumber, xSize, yOffset) {
        if (!this.gfx.VRAMOneDimensional) {
            //2D Mapping (32 8x8 tiles by 32 8x8 tiles):
            //Hardware ignores the LSB in this case:
            tileNumber &= -2;
            tileNumber += (yOffset >> 3) * 0x20;
        }
        else {
            //1D Mapping:
            tileNumber += (yOffset >> 3) * (xSize >> 2);
        }
        //Starting address of currently drawing sprite line:
        return (tileNumber << 5) + 0x10000;
    }
    GameBoyAdvanceOBJRenderer.prototype.tileNumberToAddress16 = function (tileNumber, xSize, yOffset) {
        if (!this.gfx.VRAMOneDimensional) {
            //2D Mapping (32 8x8 tiles by 32 8x8 tiles):
            tileNumber += (yOffset >> 3) * 0x20;
        }
        else {
            //1D Mapping:
            tileNumber += (yOffset >> 3) * (xSize >> 3);
        }
        //Starting address of currently drawing sprite line:
        return (tileNumber << 5) + 0x10000;
    }
}
GameBoyAdvanceOBJRenderer.prototype.markSemiTransparent = function (xSize) {
    //Mark sprite pixels as semi-transparent:
    while (--xSize > -1) {
        this.scratchOBJBuffer[xSize | 0] |= 0x400000;
    }
}
GameBoyAdvanceOBJRenderer.prototype.outputSpriteToScratch = function (sprite, xSize) {
    xSize = xSize | 0;
    //Simulate x-coord wrap around logic:
    var xcoord = sprite.xcoord | 0;
    if ((xcoord | 0) > ((0x200 - (xSize | 0)) | 0)) {
        xcoord = ((xcoord | 0) - 0x200) | 0;
    }
    //Perform the mosaic transform:
    if ((sprite.mosaic | 0) != 0) {
        this.gfx.mosaicRenderer.renderOBJMosaicHorizontal(this.scratchOBJBuffer, xcoord | 0, xSize | 0);
    }
    //Resolve end point:
    var xcoordEnd = Math.min(((xcoord | 0) + (xSize | 0)) | 0, 240) | 0;
    //Flag for compositor to ID the pixels as OBJ:
    var bitFlags = (sprite.priority << 23) | 0x100000;
    if ((sprite.horizontalFlip | 0) == 0 || (sprite.matrix2D | 0) != 0) {
        //Normal:
        for (var xSource = 0; (xcoord | 0) < (xcoordEnd | 0); xcoord = ((xcoord | 0) + 1) | 0, xSource = ((xSource | 0) + 1) | 0) {
            var pixel = bitFlags | this.scratchOBJBuffer[xSource | 0];
            //Overwrite by priority:
            if ((xcoord | 0) > -1 && (pixel & 0x3800000) < (this.targetBuffer[xcoord | 0] & 0x3800000)) {
                this.targetBuffer[xcoord | 0] = pixel | 0;
            }
        }
    }
    else {
        //Flipped Horizontally:
        for (var xSource = ((xSize | 0) - 1) | 0; (xcoord | 0) < (xcoordEnd | 0); xcoord = ((xcoord | 0) + 1) | 0, xSource = ((xSource | 0) - 1) | 0) {
            var pixel = bitFlags | this.scratchOBJBuffer[xSource | 0];
            //Overwrite by priority:
            if ((xcoord | 0) > -1 && (pixel & 0x3800000) < (this.targetBuffer[xcoord | 0] & 0x3800000)) {
                this.targetBuffer[xcoord | 0] = pixel | 0;
            }
        }
    }
}
GameBoyAdvanceOBJRenderer.prototype.isDrawable = function (sprite, doWindowOBJ) {
    //Make sure we pass some checks that real hardware does:
    if (((sprite.mode | 0) < 2 && !doWindowOBJ) || (doWindowOBJ && (sprite.mode | 0) == 2)) {
        if ((sprite.doubleSizeOrDisabled | 0) == 0 || (sprite.matrix2D | 0) != 0) {
            if ((sprite.shape | 0) < 3) {
                if ((this.gfx.BGMode | 0) < 3 || (sprite.tileNumber | 0) >= 0x200) {
                    return true;
                }
            }
        }
    }
    return false;
}
GameBoyAdvanceOBJRenderer.prototype.readOAM = function (address) {
    return this.OAMRAM[address & 0x3FF] | 0;
}
if (__LITTLE_ENDIAN__) {
    GameBoyAdvanceOBJRenderer.prototype.writeOAM16 = function (address, data) {
        address = address | 0;
        data = data | 0;
        var OAMTable = this.OAMTable[address >> 2];
        switch (address & 0x3) {
                //Attrib 0:
            case 0:
                OAMTable.ycoord = data & 0xFF;
                OAMTable.matrix2D = data & 0x100;
                OAMTable.doubleSizeOrDisabled = (data & 0x200) >> 9;
                OAMTable.mode = (data >> 10) & 0x3;
                OAMTable.mosaic = data & 0x1000;
                OAMTable.monolithicPalette = data & 0x2000;
                OAMTable.shape = data >> 14;
                break;
                //Attrib 1:
            case 1:
                OAMTable.xcoord = data & 0x1FF;
                OAMTable.matrixParameters = (data >> 7) & 0x7C;
                OAMTable.horizontalFlip = data & 0x1000;
                OAMTable.verticalFlip = data & 0x2000;
                OAMTable.size = data >> 14;
                break;
                //Attrib 2:
            case 2:
                OAMTable.tileNumber = data & 0x3FF;
                OAMTable.priority = (data >> 10) & 0x3;
                OAMTable.paletteNumber = (data >> 8) & 0xF0;
                break;
                //Scaling/Rotation Parameter:
            default:
                this.OBJMatrixParameters[address >> 2] = (data << 16) >> 16;
        }
        this.OAMRAM16[address | 0] = data | 0;
    }
    GameBoyAdvanceOBJRenderer.prototype.writeOAM32 = function (address, data) {
        address = address | 0;
        data = data | 0;
        var OAMTable = this.OAMTable[address >> 1];
        if ((address & 0x1) == 0) {
            //Attrib 0:
            OAMTable.ycoord = data & 0xFF;
            OAMTable.matrix2D = data & 0x100;
            OAMTable.doubleSizeOrDisabled = (data & 0x200) >> 9;
            OAMTable.mode = (data >> 10) & 0x3;
            OAMTable.mosaic = data & 0x1000;
            OAMTable.monolithicPalette = data & 0x2000;
            OAMTable.shape = (data >> 14) & 0x3;
            //Attrib 1:
            OAMTable.xcoord = (data >> 16) & 0x1FF;
            OAMTable.matrixParameters = (data >> 23) & 0x7C;
            OAMTable.horizontalFlip = data & 0x10000000;
            OAMTable.verticalFlip = data & 0x20000000;
            OAMTable.size = (data >> 30) & 0x3;
        }
        else {
            //Attrib 2:
            OAMTable.tileNumber = data & 0x3FF;
            OAMTable.priority = (data >> 10) & 0x3;
            OAMTable.paletteNumber = (data >> 8) & 0xF0;
            //Scaling/Rotation Parameter:
            this.OBJMatrixParameters[address >> 1] = data >> 16;
        }
        this.OAMRAM32[address | 0] = data | 0;
    }
    GameBoyAdvanceOBJRenderer.prototype.readOAM16 = function (address) {
        address = address | 0;
        return this.OAMRAM16[(address >> 1) & 0x1FF] | 0;
    }
    GameBoyAdvanceOBJRenderer.prototype.readOAM32 = function (address) {
        address = address | 0;
        return this.OAMRAM32[(address >> 2) & 0xFF] | 0;
    }
}
else {
    GameBoyAdvanceOBJRenderer.prototype.writeOAM16 = function (address, data) {
        address = address | 0;
        data = data | 0;
        var OAMTable = this.OAMTable[address >> 2];
        switch (address & 0x3) {
                //Attrib 0:
            case 0:
                OAMTable.ycoord = data & 0xFF;
                OAMTable.matrix2D = data & 0x100;
                OAMTable.doubleSizeOrDisabled = (data & 0x200) >> 9;
                OAMTable.mode = (data >> 10) & 0x3;
                OAMTable.mosaic = data & 0x1000;
                OAMTable.monolithicPalette = data & 0x2000;
                OAMTable.shape = data >> 14;
                break;
                //Attrib 1:
            case 1:
                OAMTable.xcoord = data & 0x1FF;
                OAMTable.matrixParameters = (data >> 7) & 0x7C;
                OAMTable.horizontalFlip = data & 0x1000;
                OAMTable.verticalFlip = data & 0x2000;
                OAMTable.size = data >> 14;
                break;
                //Attrib 2:
            case 2:
                OAMTable.tileNumber = data & 0x3FF;
                OAMTable.priority = (data >> 10) & 0x3;
                OAMTable.paletteNumber = (data >> 8) & 0xF0;
                break;
                //Scaling/Rotation Parameter:
            default:
                this.OBJMatrixParameters[address >> 2] = (data << 16) >> 16;
        }
        address = address << 1;
        this.OAMRAM[address | 0] = data & 0xFF;
        this.OAMRAM[address | 1] = data >> 8;
    }
    GameBoyAdvanceOBJRenderer.prototype.writeOAM32 = function (address, data) {
        address = address | 0;
        data = data | 0;
        var OAMTable = this.OAMTable[address >> 1];
        if ((address & 0x1) == 0) {
            //Attrib 0:
            OAMTable.ycoord = data & 0xFF;
            OAMTable.matrix2D = data & 0x100;
            OAMTable.doubleSizeOrDisabled = (data & 0x200) >> 9;
            OAMTable.mode = (data >> 10) & 0x3;
            OAMTable.mosaic = data & 0x1000;
            OAMTable.monolithicPalette = data & 0x2000;
            OAMTable.shape = (data >> 14) & 0x3;
            //Attrib 1:
            OAMTable.xcoord = (data >> 16) & 0x1FF;
            OAMTable.matrixParameters = (data >> 23) & 0x7C;
            OAMTable.horizontalFlip = data & 0x10000000;
            OAMTable.verticalFlip = data & 0x20000000;
            OAMTable.size = (data >> 30) & 0x3;
        }
        else {
            //Attrib 2:
            OAMTable.tileNumber = data & 0x3FF;
            OAMTable.priority = (data >> 10) & 0x3;
            OAMTable.paletteNumber = (data >> 8) & 0xF0;
            //Scaling/Rotation Parameter:
            this.OBJMatrixParameters[address >> 1] = data >> 16;
        }
        address = address << 2;
        this.OAMRAM[address | 0] = data & 0xFF;
        this.OAMRAM[address | 1] = (data >> 8) & 0xFF;
        this.OAMRAM[address | 2] = (data >> 16) & 0xFF;
        this.OAMRAM[address | 3] = data >>> 24;
    }
    GameBoyAdvanceOBJRenderer.prototype.readOAM16 = function (address) {
        address &= 0x3FE;
        return this.OAMRAM[address] | (this.OAMRAM[address | 1] << 8);
    }
    GameBoyAdvanceOBJRenderer.prototype.readOAM32 = function (address) {
        address &= 0x3FC;
        return this.OAMRAM[address] | (this.OAMRAM[address | 1] << 8) | (this.OAMRAM[address | 2] << 16)  | (this.OAMRAM[address | 3] << 24);
    }
}