"use strict";
/*
 Copyright (C) 2012-2015 Grant Galitz
 
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function GameBoyAdvanceOBJWindowRenderer(compositor) {
    //Get a layer compositor that we'll send our parameters for windowing to:
    this.compositor = compositor;
}
GameBoyAdvanceOBJWindowRenderer.prototype.initialize = function () {
    //Initialize the compositor:
    this.compositor.initialize();
    //Layer masking & color effects control:
    this.WINOBJOutside = 0;
    //Need to update the color effects status in the compositor:
    this.preprocess();
}
GameBoyAdvanceOBJWindowRenderer.prototype.renderScanLine = function (line, OBJBuffer, BG0Buffer, BG1Buffer, BG2Buffer, BG3Buffer) {
    line = line | 0;
    OBJBuffer = OBJBuffer | 0;
    BG0Buffer = BG0Buffer | 0;
    BG1Buffer = BG1Buffer | 0;
    BG2Buffer = BG2Buffer | 0;
    BG3Buffer = BG3Buffer | 0;
    if ((this.WINOBJOutside & 0x1) == 0) {
        //BG Layer 0 Disabled:
        BG0Buffer = 0;
    }
    if ((this.WINOBJOutside & 0x2) == 0) {
        //BG Layer 1 Disabled:
        BG1Buffer = 0;
    }
    if ((this.WINOBJOutside & 0x4) == 0) {
        //BG Layer 2 Disabled:
        BG2Buffer = 0;
    }
    if ((this.WINOBJOutside & 0x8) == 0) {
        //BG Layer 3 Disabled:
        BG3Buffer = 0;
    }
    if ((this.WINOBJOutside & 0x10) == 0) {
        //Sprite Layer Disabled:
        OBJBuffer = 0;
    }
    //Windowing occurs where there is a non-transparent "obj-win" sprite:
    this.compositor.renderScanLine(OBJBuffer | 0, BG0Buffer | 0, BG1Buffer | 0, BG2Buffer | 0, BG3Buffer | 0);
}
GameBoyAdvanceOBJWindowRenderer.prototype.writeWINOBJIN8 = function (data) {
    data = data | 0;
    //Layer masking & color effects control:
    this.WINOBJOutside = data | 0;
    //Need to update the color effects status in the compositor:
    this.preprocess();
}
GameBoyAdvanceOBJWindowRenderer.prototype.preprocess = function () {
    //Update the color effects status in the compositor:
    this.compositor.preprocess(this.WINOBJOutside & 0x20);
}