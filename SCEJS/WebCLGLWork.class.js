/**
* WebCLGLWork Object
* @class
* @constructor
*/
WebCLGLWork = function(webCLGL, offset) {
    "use strict";

	this.webCLGL = webCLGL;
	this.offset = (offset != undefined) ? offset : 100.0;

	this.kernels = {};
	this.vertexFragmentPrograms = {};
	this.buffers = {};
	this.buffers_TEMP = {};

    this.arrAllowKernelWriting = {};


	var kernelPr;
	var vPr;
	var fPr;
	var type; // FLOAT or FLOAT4
	var isBuffer;
	var usedInVertex;
	var usedInFragment;



    /**
     * setAllowKernelWriting
     * @param {String} argument
     */
    this.setAllowKernelWriting = function(argument) {
        this.arrAllowKernelWriting[argument] = true;
    };

    /**
     * Add one WebCLGLKernel to the work
     * @param {WebCLGLKernel} kernel
     * @param {String|Array<String>} output - Used for to write and update ARG name with the result in out_float4/out_float
     */
    this.addKernel = function(kernel, output) {
        kernel.output = output;

        if(output instanceof Array) {
            this.kernels[output[0]] = kernel;
        } else {
            this.kernels[output] = kernel;
        }
        this.arrAllowKernelWriting[output] = true;
    };

    /**
     * Get one added WebCLGLKernel
     * @param {String} name Get assigned kernel for this argument
     */
    this.getKernel = function(name) {
        for(var key in this.kernels) {
            if(key == name) {
                return this.kernels[key];
            }
        }
    };

    /**
     * Add one WebCLGLVertexFragmentProgram to the work
     * @param {WebCLGLVertexFragmentProgram} vertexFragmentProgram
     * @param {String} name Name for identify this vertexFragmentProgram
     */
    this.addVertexFragmentProgram = function(vertexFragmentProgram, name) {
        var exists = false;
        for(var key in this.vertexFragmentPrograms) {
            if(this.vertexFragmentPrograms[key] == vertexFragmentProgram) {
                this.vertexFragmentPrograms[key] = vertexFragmentProgram;
                exists = true;
                break;
            }
        }
        if(exists == false) {
            this.vertexFragmentPrograms[name] = vertexFragmentProgram;
        }
    };

    /**
     * @private
     */
    this.checkArg = function(argument, value) {
        kernelPr = [];
        vPr = [];
        fPr = [];
        isBuffer = false;
        usedInVertex = false;
        usedInFragment = false;

        for(var key in this.kernels) {
            for(var keyB in this.kernels[key].in_values) {
                var inValues = this.kernels[key].in_values[keyB];
                if(keyB == argument) {
                    if(inValues.type == "float4_fromSampler") {
                        type = "FLOAT4";
                        isBuffer = true;
                    } else if(inValues.type == "float_fromSampler") {
                        type = "FLOAT";
                        isBuffer = true;
                    }

                    kernelPr.push(this.kernels[key]);
                    break;
                }
            }

        }


        for(var key in this.vertexFragmentPrograms) {
            for(var keyB in this.vertexFragmentPrograms[key].in_vertex_values) {
                var inValues = this.vertexFragmentPrograms[key].in_vertex_values[keyB];
                if(keyB == argument) {
                    if(inValues.type == "float4_fromSampler" || inValues.type == "float4_fromAttr") {
                        type = "FLOAT4";
                        isBuffer = true;
                    } else if(inValues.type == "float_fromSampler" || inValues.type == "float_fromAttr") {
                        type = "FLOAT";
                        isBuffer = true;
                    }

                    vPr.push(this.vertexFragmentPrograms[key]);
                    usedInVertex = true;
                    break;
                }
            }

            for(var keyB in this.vertexFragmentPrograms[key].in_fragment_values) {
                var inValues = this.vertexFragmentPrograms[key].in_fragment_values[keyB];
                if(keyB == argument) {
                    if(inValues.type == "float4_fromSampler") {
                        type = "FLOAT4";
                        isBuffer = true;
                    } else if(inValues.type == "float_fromSampler") {
                        type = "FLOAT";
                        isBuffer = true;
                    }

                    fPr.push(this.vertexFragmentPrograms[key]);
                    usedInFragment = true;
                    break;
                }
            }
        }

        if(kernelPr.length == 0 && usedInVertex == false && usedInFragment == false &&
            (value instanceof Array || value instanceof Float32Array || value instanceof Uint8Array || value instanceof HTMLImageElement))
            isBuffer = true;
    };

    /**
     * Assign value of a argument for all added Kernels and vertexFragmentPrograms
     * @param {String} argument Argument to set
     * @param {Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
     * @param {Array<Float>} [splits=[value.length]]
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @param {String} [overrideType="FLOAT4"] - force "FLOAT4" or "FLOAT"
     * @returns {WebCLGLBuffer}
     */
    this.setArg = function(argument, value, splits, overrideDimensions, overrideType) {
        if(argument == "indices") {
            this.setIndices(value, splits);
        } else {
            this.checkArg(argument, value);

            if(overrideType != undefined)
                type = overrideType;

            if(isBuffer == true) {
                var mode = "SAMPLER"; // "ATTRIBUTE", "SAMPLER", "UNIFORM"
                if(usedInVertex == true) {
                    if(kernelPr.length == 0 && usedInFragment == false) {
                        mode = "ATTRIBUTE";
                    }
                }

                if(value != undefined && value != null) {
                    var length;
                    if(overrideDimensions == undefined) {
                        length = (value instanceof HTMLImageElement) ? (value.width*value.height) : ((type == "FLOAT4") ? value.length/4 : value.length);
                    } else {
                        length = [overrideDimensions[0], overrideDimensions[1]];
                    }
                    var spl = (splits != undefined) ? splits : [length];

                    var buff = this.webCLGL.createBuffer(length, type, this.offset, false, mode, spl);
                    this.webCLGL.enqueueWriteBuffer(buff, value);
                    this.buffers[argument] = buff;
                    if(this.arrAllowKernelWriting.hasOwnProperty(argument) == true) {
                        var buffTMP = this.webCLGL.createBuffer(length, type, this.offset, false, mode, spl);
                        this.webCLGL.enqueueWriteBuffer(buffTMP, value);
                        this.buffers_TEMP[argument] = buffTMP;
                    }


                    for(var n=0; n < kernelPr.length; n++)
                        kernelPr[n].setKernelArg(argument, this.buffers[argument]);

                    for(var n=0; n < vPr.length; n++)
                        vPr[n].setVertexArg(argument, this.buffers[argument]);

                    for(var n=0; n < fPr.length; n++)
                        fPr[n].setFragmentArg(argument, this.buffers[argument]);
                } else {
                    for(var n=0; n < kernelPr.length; n++)
                        kernelPr[n].setKernelArg(argument, null);

                    for(var n=0; n < vPr.length; n++)
                        vPr[n].setVertexArg(argument, null);

                    for(var n=0; n < fPr.length; n++)
                        fPr[n].setFragmentArg(argument, null);
                }
            } else {
                for(var n=0; n < kernelPr.length; n++)
                    kernelPr[n].setKernelArg(argument, value);

                for(var n=0; n < vPr.length; n++)
                    vPr[n].setVertexArg(argument, value);

                for(var n=0; n < fPr.length; n++)
                    fPr[n].setFragmentArg(argument, value);

                return value;
            }
        }
    };

    /**
     * fillPointerArg
     * @param {String} argName
     * @param {Array<Float>} clearColor
     */
    this.fillPointerArg = function(argName, clearColor) {
        if(this.buffers.hasOwnProperty(argName))
            this.webCLGL.fillBuffer(this.buffers[argName], clearColor);

        if(this.buffers_TEMP.hasOwnProperty(argName))
            this.webCLGL.fillBuffer(this.buffers_TEMP[argName], clearColor);
    };

    /**
     * Set shared argument from other work
     * @param {String} argument Argument to set
     * @param {WebCLGLWork} clglWork
     */
    this.setSharedBufferArg = function(argument, clglWork) {
        this.checkArg(argument);


        this.buffers[argument] = clglWork.buffers[argument];
        this.buffers_TEMP[argument] = clglWork.buffers_TEMP[argument];

        for(var n=0; n < kernelPr.length; n++)
            kernelPr[n].setKernelArg(argument, this.buffers[argument]);

        for(var n=0; n < vPr.length; n++)
            vPr[n].setVertexArg(argument, this.buffers[argument]);

        for(var n=0; n < fPr.length; n++)
            fPr[n].setFragmentArg(argument, this.buffers[argument]);
    };

    /**
     * Get all arguments existing in passed kernels & vertexFragmentPrograms
     * @returns {Object}
     */
    this.getAllArgs = function() {
        var args = {};
        for(var key in this.kernels) {
            for(var keyB in this.kernels[key].in_values) {
                var inValues = this.kernels[key].in_values[keyB];
                args[keyB] = inValues;
            }
        }


        for(var key in this.vertexFragmentPrograms) {
            for(var keyB in this.vertexFragmentPrograms[key].in_vertex_values) {
                var inValues = this.vertexFragmentPrograms[key].in_vertex_values[keyB];
                args[keyB] = inValues;
            }

            for(var keyB in this.vertexFragmentPrograms[key].in_fragment_values) {
                var inValues = this.vertexFragmentPrograms[key].in_fragment_values[keyB];
                args[keyB] = inValues;
            }
        }

        return args;
    };

    /**
     * Set indices for the geometry passed in vertexFragmentProgram
     * @param {Array<Float>} array
     * @param {Array<Float>} [splits=[array.length]]
     */
    this.setIndices = function(arr, splits) {
        var spl = (splits != undefined) ? splits : [arr.length];
        this.CLGL_bufferIndices = this.webCLGL.createBuffer(arr.length, "FLOAT", this.offset, false, "VERTEX_INDEX", spl);
        this.webCLGL.enqueueWriteBuffer(this.CLGL_bufferIndices, arr);
    };

    /**
     * Process kernels
     * @param {Int} [buffDest=undefined] - if 0 then output to null screen
     */
    this.enqueueNDRangeKernel = function(buffDest) {
        for(var key in this.kernels) {
            var kernel = this.kernels[key];

            if(kernel.output != undefined) {
                var outputBuff;
                if(kernel.output instanceof Array) {
                    outputBuff = [];
                    for(var n=0; n < kernel.output.length; n++)
                        outputBuff[n] = this.buffers_TEMP[kernel.output[n]];
                } else {
                    outputBuff = this.buffers_TEMP[kernel.output];
                }

                if(buffDest != null && buffDest === 0)
                    outputBuff = null;
                this.webCLGL.enqueueNDRangeKernel(kernel, outputBuff);
            } else {
                this.webCLGL.enqueueNDRangeKernel(kernel);
            }
        }

        for(var key in this.kernels) {
            var kernel = this.kernels[key];

            if(kernel.output != undefined) {
                if(kernel.output instanceof Array) {
                    for(var n=0; n < kernel.output.length; n++)
                        this.webCLGL.copy(this.buffers_TEMP[kernel.output[n]], this.buffers[kernel.output[n]]);
                } else {
                    this.webCLGL.copy(this.buffers_TEMP[kernel.output], this.buffers[kernel.output]);
                }
            }
        }
    };

    /**
     * Process VertexFragmentProgram
     * @param {String} [argument=undefined] Argument for vertices count or undefined if indices exist
     * @param {String} Name (vertexFragmentProgramName) of vertexFragmentProgram to execute
     * @param {Int} drawMode 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
     * @param {WebCLGLBuffer} [buffDest=undefined]
     */
    this.enqueueVertexFragmentProgram = function(argument, vertexFragmentProgramName, drawMode, buffDest) {
        var buff = (this.CLGL_bufferIndices != undefined) ? this.CLGL_bufferIndices : this.buffers[argument];
        if(buff != undefined && buff.length > 0) this.webCLGL.enqueueVertexFragmentProgram(this.vertexFragmentPrograms[vertexFragmentProgramName], buff, drawMode, buffDest);
    };
};


