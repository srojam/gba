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
function GlueCodeMixer() {
    var parentObj = this;
    this.audio = new XAudioServer(2, this.sampleRate, 0, this.bufferAmount, null, 1, function () {
                     //Disable audio in the callback here:
                     parentObj.disableAudio();
    });
    this.outputUnits = [];
    this.outputUnitsValid = [];
    setInterval(function(){parentObj.checkAudio();}, 16);
    this.initializeBuffer();
}
GlueCodeMixer.prototype.sampleRate = 44100;
GlueCodeMixer.prototype.bufferAmount = 44100;
GlueCodeMixer.prototype.channelCount = 2;
GlueCodeMixer.prototype.initializeBuffer = function () {
    this.buffer = new AudioSimpleBuffer(this.channelCount,
                                         this.bufferAmount);
}
GlueCodeMixer.prototype.appendInput = function (inUnit) {
    if (this.audio) {
        this.outputUnits.push(inUnit);
        this.outputUnitsValid.push(inUnit);
        inUnit.registerStackPosition(this.outputUnits.length - 1);
    }
    else if (typeof inUnit.errorCallback == "function") {
        inUnit.errorCallback();
    }
}
GlueCodeMixer.prototype.unregister = function (stackPosition) {
    this.outputUnits[stackPosition] = null;
    this.outputUnitsValid = [];
    for (var index = 0, length = this.outputUnits.length; index < length; ++index) {
        if (this.outputUnits[index]) {
            this.outputUnitsValid.push(this.outputUnits);
        }
    }
}
GlueCodeMixer.prototype.checkAudio = function () {
    if (this.audio) {
        var inputCount = this.outputUnitsValid.length;
        for (var inputIndex = 0, output = 0; inputIndex < inputCount; ++inputIndex) {
            this.outputUnitsValid[inputIndex].prepareShift();
        }
        for (var count = 0, requested = this.findLowestBufferCount(); count < requested; ++count) {
            for (var inputIndex = 0, output = 0; inputIndex < inputCount; ++inputIndex) {
                output += this.outputUnitsValid[inputIndex].shift();
            }
            this.buffer.push(output);
        }
        this.audio.writeAudioNoCallback(this.buffer.getSlice());
    }
}
GlueCodeMixer.prototype.findLowestBufferCount = function () {
    var count = 0;
    for (var inputIndex = 0, inputCount = this.outputUnitsValid.length; inputIndex < inputCount; ++inputIndex) {
        var tempCount = this.outputUnitsValid[inputIndex].buffer.remainingBuffer();
        if (tempCount > 0) {
            if (count > 0) {
                count = Math.min(count, tempCount);
            }
            else {
                count = tempCount;
            }
        }
    }
    return count;
}
GlueCodeMixer.prototype.disableAudio = function () {
    this.audio = null;
}
function GlueCodeMixerInput(mixer) {
    this.mixer = mixer;
}
GlueCodeMixerInput.prototype.initialize = function (channelCount, sampleRate, bufferAmount, startingVolume, errorCallback) {
    this.channelCount = channelCount;
    this.sampleRate = sampleRate;
    this.bufferAmount = bufferAmount;
    this.volume = startingVolume;
    this.errorCallback = errorCallback;
    this.buffer = new AudioBufferWrapper(this.channelCount,
                                         this.mixer.channelCount,
                                         this.bufferAmount,
                                         this.mixer.bufferAmount,
                                         this.sampleRate,
                                         this.mixer.sampleRate);
    
}
GlueCodeMixerInput.prototype.register = function (volume) {
    this.mixer.appendInput(this);
}
GlueCodeMixerInput.prototype.changeVolume = function (volume) {
    this.volume = volume;
}
GlueCodeMixerInput.prototype.prepareShift = function () {
    this.buffer.resampleRefill();
}
GlueCodeMixerInput.prototype.shift = function () {
    return this.buffer.shift() * this.volume;
}
GlueCodeMixerInput.prototype.push = function (buffer) {
    this.buffer.push(buffer);
    this.mixer.checkAudio();
}
GlueCodeMixerInput.prototype.remainingBuffer = function () {
    return this.buffer.remainingBuffer() + (Math.floor((this.mixer.audio.remainingBuffer() * this.sampleRate / this.mixer.sampleRate) / this.mixer.channelCount) * this.mixer.channelCount);
}
GlueCodeMixerInput.prototype.registerStackPosition = function (stackPosition) {
    this.stackPosition = stackPosition;
}
GlueCodeMixerInput.prototype.unregister = function () {
    this.mixer.unregister(this.stackPosition);
}
function AudioBufferWrapper(channelCount,
                            mixerChannelCount,
                            bufferAmount,
                            mixerBufferAmount,
                            sampleRate,
                            mixerSampleRate) {
    this.channelCount = channelCount;
    this.mixerChannelCount = mixerChannelCount;
    this.bufferAmount = bufferAmount;
    this.mixerBufferAmount = mixerBufferAmount;
    this.sampleRate = sampleRate;
    this.mixerSampleRate = mixerSampleRate;
    this.initialize();
}
AudioBufferWrapper.prototype.initialize = function () {
    this.inBufferSize = this.bufferAmount * this.mixerChannelCount;
    this.inBuffer = getFloat32Array(this.inBufferSize);
    this.outBufferSize = (this.inBufferSize * Math.ceil(this.mixerSampleRate / this.sampleRate)) + this.mixerChannelCount;
    this.outBuffer = getFloat32Array(this.outBufferSize);
    this.resampler = new Resampler(this.sampleRate, this.mixerSampleRate, this.mixerChannelCount, this.outBufferSize, true);
    this.inputOffset = 0;
    this.resampleBufferStart = 0;
    this.resampleBufferEnd = 0;
}
AudioBufferWrapper.prototype.push = function (buffer) {
    var length  = buffer.length;
    if (this.channelCount < this.mixerChannelCount) {
        for (var bufferCounter = 0; bufferCounter < length && this.inputOffset < this.inBufferSize;) {
            for (var index = this.channelCount; index < this.mixerChannelCount; ++index) {
                this.inBuffer[this.inputOffset++] = buffer[bufferCounter];
            }
            for (index = 0; index < this.channelCount && bufferCounter < length; ++index) {
                this.inBuffer[this.inputOffset++] = buffer[bufferCounter++];
            }
        }
    }
    else if (this.channelCount == this.mixerChannelCount) {
        for (var bufferCounter = 0; bufferCounter < length && this.inputOffset < this.inBufferSize;) {
            this.inBuffer[this.inputOffset++] = buffer[bufferCounter++];
        }
    }
    else {
        for (var bufferCounter = 0; bufferCounter < length && this.inputOffset < this.inBufferSize;) {
            for (index = 0; index < this.mixerChannelCount && bufferCounter < length; ++index) {
                this.inBuffer[this.inputOffset++] = buffer[bufferCounter++];
            }
            bufferCounter += this.channelCount - this.mixerChannelCount;
        }
    }
}
AudioBufferWrapper.prototype.shift = function () {
    var output = 0;
    if (this.resampleBufferStart != this.resampleBufferEnd) {
        output = this.outBuffer[this.resampleBufferStart++];
        if (this.resampleBufferStart == this.outBufferSize) {
			this.resampleBufferStart = 0;
		}
    }
    return output;
}
AudioBufferWrapper.prototype.resampleRefill = function () {
	if (this.inputOffset > 0) {
		//Resample a chunk of audio:
		var resampleLength = this.resampler.resampler(this.getSlice(this.inBuffer, this.inputOffset));
		var resampledResult = this.resampler.outputBuffer;
		for (var index2 = 0; index2 < resampleLength;) {
			this.outBuffer[this.resampleBufferEnd++] = resampledResult[index2++];
			if (this.resampleBufferEnd == this.outBufferSize) {
				this.resampleBufferEnd = 0;
			}
			if (this.resampleBufferStart == this.resampleBufferEnd) {
				this.resampleBufferStart += this.mixerChannelCount;
				if (this.resampleBufferStart == this.outBufferSize) {
					this.resampleBufferStart = 0;
				}
			}
		}
		this.inputOffset = 0;
	}
}
AudioBufferWrapper.prototype.remainingBuffer = function () {
    return (Math.floor((this.resampledSamplesLeft() * this.resampler.ratioWeight) / this.mixerChannelCount) * this.mixerChannelCount) + this.inputOffset;
}
AudioBufferWrapper.prototype.resampledSamplesLeft = function () {
	return ((this.resampleBufferStart <= this.resampleBufferEnd) ? 0 : this.outBufferSize) + this.resampleBufferEnd - this.resampleBufferStart;
}
AudioBufferWrapper.prototype.getSlice = function (buffer, lengthOf) {
	//Typed array and normal array buffer section referencing:
	try {
		return buffer.subarray(0, lengthOf);
	}
	catch (error) {
		try {
			//Regular array pass:
			buffer.length = lengthOf;
			return buffer;
		}
		catch (error) {
			//Nightly Firefox 4 used to have the subarray function named as slice:
			return buffer.slice(0, lengthOf);
		}
	}
}
function AudioSimpleBuffer(channelCount, bufferAmount) {
    this.channelCount = channelCount;
    this.bufferAmount = bufferAmount;
    this.outBufferSize = this.channelCount * this.bufferAmount;
    this.stackLength = 0;
    this.buffer = getFloat32Array(this.outBufferSize);
}
AudioSimpleBuffer.prototype.push = function (data) {
    if (this.stackLength < this.outBufferSize) {
        this.buffer[this.stackLength++] = data;
    }
}
AudioSimpleBuffer.prototype.getSlice = function () {
	var lengthOf = this.stackLength;
    this.stackLength = 0;
    //Typed array and normal array buffer section referencing:
	try {
		return this.buffer.subarray(0, lengthOf);
	}
	catch (error) {
		try {
			//Regular array pass:
			this.buffer.length = lengthOf;
			return this.buffer;
		}
		catch (error) {
			//Nightly Firefox 4 used to have the subarray function named as slice:
			return this.buffer.slice(0, lengthOf);
		}
	}
}