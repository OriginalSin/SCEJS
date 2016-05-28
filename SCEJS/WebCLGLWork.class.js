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
    this.calledArgs = {};

	var kernelPr;
	var vPr;
	var fPr;
	var type; // FLOAT or FLOAT4
	var isBuffer;
	var usedInVertex;
	var usedInFragment;

    var _alerted = false;

    /** @private */
    var defineOutputTempModes = function(output, args) {
        var searchInArgs = function(outputName, args) {
            var found = false;
            for(var key in args) {
                if(key != "indices") {
                    var expl = key.split(" ");
                    if(expl.length > 0) {
                        var argName = expl[1];
                        if(argName == outputName) {
                            found = true;
                            break;
                        }
                    }
                }
            }
            return found;
        };

        var outputTempModes;
        if(output instanceof Array) {
            outputTempModes = [];
            for(var n=0; n < output.length; n++) {
                if(output[n] != null) {
                    outputTempModes[n] = searchInArgs(output[n], args);
                } else {
                    outputTempModes[n] = false;
                }
            }
        } else {
            if(output != null) {
                outputTempModes = searchInArgs(output, args);
            }
        }
        return outputTempModes;
    };

    /**
     * Add one WebCLGLKernel to the work
     * @param {WebCLGLKernel} kernel
     * @param {String|Array<String>} output - Used for to write and update ARG name with the result in out_float4/out_float
     * @param {Object} args
     */
    this.addKernel = function(kernel, output, args) {
        kernel.output = output;
        kernel.outputTempModes = defineOutputTempModes(output, args);

        var name = Object.keys(this.kernels).length.toString();

        this.kernels[name] = kernel;
        this.kernels[name].enabled = true;
    };

    /**
     * onPreProcessKernel
     * @param {String} kernelName
     * @param {Callback} fn
     */
    this.onPreProcessKernel = function(kernelName, fn) {
        this.kernels[kernelName].onpre = fn;
    };

    /**
     * onPostProcessKernel
     * @param {String} kernelName
     * @param {Callback} fn
     */
    this.onPostProcessKernel = function(kernelName, fn) {
        this.kernels[kernelName].onpost = fn;
    };

    /**
     * enableKernel
     * @param {String} kernelName
     */
    this.enableKernel = function(kernelName) {
        this.kernels[kernelName].enabled = true;
    };

    /**
     * disableKernel
     * @param {String} kernelName
     */
    this.disableKernel = function(kernelName) {
        this.kernels[kernelName].enabled = false;
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
     * @param {String|Array<String>} output - Used for to write and update ARG name with the result in out_float4/out_float
     * @param {Object} args
     */
    this.addVertexFragmentProgram = function(vertexFragmentProgram, output, args) {
        vertexFragmentProgram.output = output;
        vertexFragmentProgram.outputTempModes = defineOutputTempModes(output, args);

        var name = Object.keys(this.vertexFragmentPrograms).length.toString();

        this.vertexFragmentPrograms[name] = vertexFragmentProgram;
        this.vertexFragmentPrograms[name].enabled = true;
    };

    /**
     * onPreProcessVertexFragmentProgram
     * @param {String} vfpName
     * @param {Callback} fn
     */
    this.onPreProcessVertexFragmentProgram = function(vfpName, fn) {
        this.vertexFragmentPrograms[vfpName].onpre = fn;
    };

    /**
     * onPostProcessVertexFragmentProgram
     * @param {String} vfpName
     * @param {Callback} fn
     */
    this.onPostProcessVertexFragmentProgram = function(vfpName, fn) {
        this.vertexFragmentPrograms[vfpName].onpost = fn;
    };

    /**
     * enableVertexFragmentProgram
     * @param {String} vfpName
     */
    this.enableVertexFragmentProgram = function(vfpName) {
        this.vertexFragmentPrograms[vfpName].enabled = true;
    };

    /**
     * disableVertexFragmentProgram
     * @param {String} vfpName
     */
    this.disableVertexFragmentProgram = function(vfpName) {
        this.vertexFragmentPrograms[vfpName].enabled = false;
    };

    /** @private  */
    var checkArg = (function(argument, value) {
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
    }).bind(this);

    /**
     * Assign value of a argument for all added Kernels and vertexFragmentPrograms
     * @param {String} argument Argument to set
     * @param {Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
     * @param {Array<Float>} [splits=[value.length]]
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @returns {WebCLGLBuffer}
     */
    this.setArg = function(argument, value, splits, overrideDimensions) {
        if(argument == "indices") {
            this.setIndices(value, splits);
        } else {
            checkArg(argument, value);

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

                    var buffTMP = this.webCLGL.createBuffer(length, type, this.offset, false, mode, spl);
                    this.webCLGL.enqueueWriteBuffer(buffTMP, value);


                    this.buffers[argument] = buff;
                    this.buffers_TEMP[argument] = buffTMP;

                    for(var n=0; n < kernelPr.length; n++)
                        kernelPr[n].setKernelArg(argument, this.buffers[argument]);

                    for(var n=0; n < vPr.length; n++)
                        vPr[n].setVertexArg(argument, this.buffers[argument]);

                    for(var n=0; n < fPr.length; n++)
                        fPr[n].setFragmentArg(argument, this.buffers[argument]);
                } else {
                    this.buffers[argument] = null;
                    this.buffers_TEMP[argument] = null;

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

        if(this.calledArgs.hasOwnProperty(argument) == true) {
            for(var n=0; n < this.calledArgs[argument].length; n++) {
                var work = this.calledArgs[argument][n];
                work.getWorkBufferArg(argument, this, false);
            }
        }
    };

    /**
     * Get argument from other work
     * @param {String} argument Argument to set
     * @param {WebCLGLWork} clglWork
     * @param {Bool} [makeAdd=true]
     */
    this.getWorkBufferArg = function(argument, clglWork, makeAdd) {
        checkArg(argument);


        this.buffers[argument] = clglWork.buffers[argument];
        this.buffers_TEMP[argument] = clglWork.buffers_TEMP[argument];

        for(var n=0; n < kernelPr.length; n++)
            kernelPr[n].setKernelArg(argument, this.buffers[argument]);

        for(var n=0; n < vPr.length; n++)
            vPr[n].setVertexArg(argument, this.buffers[argument]);

        for(var n=0; n < fPr.length; n++)
            fPr[n].setFragmentArg(argument, this.buffers[argument]);


        if(clglWork.calledArgs.hasOwnProperty(argument) == false) {
            clglWork.calledArgs[argument] = []
        }

        if(makeAdd == undefined || makeAdd == true)
            clglWork.calledArgs[argument].push(this);
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

    /** @private **/
    var getOutputBuffers = (function(prog) {
        var outputBuff = null;
        if(prog.output != undefined) {
            if(prog.output instanceof Array) {
                outputBuff = [];
                if(prog.output[0] != null) {
                    for(var n=0; n < prog.output.length; n++) {
                        if(this.buffers.hasOwnProperty(prog.output[n]) == false && _alerted == false)
                            _alerted = true, alert("output argument "+prog.output[n]+" not found in buffers. add desired argument as shared");

                        if(prog.outputTempModes[n] == true)
                            outputBuff[n] = this.buffers_TEMP[prog.output[n]];
                        else
                            outputBuff[n] = this.buffers[prog.output[n]];
                    }
                } else
                    outputBuff = null;
            } else {
                if(prog.outputTempModes == true)
                    outputBuff = this.buffers_TEMP[prog.output];
                else
                    outputBuff = this.buffers[prog.output];
            }

            //if(buffDest != null && buffDest === 0)
            //    outputBuff = null;
        }
        return outputBuff;
    }).bind(this);

    /** @private **/
    var updateOutputBuffers = (function(progGroup) {
        for(var key in progGroup) {
            var prog = progGroup[key];

            if(prog.output != undefined) {
                if(prog.output instanceof Array) {
                    for(var n=0; n < prog.output.length; n++) {
                        if(prog.output[n] != null && prog.outputTempModes[n] == true)
                            this.webCLGL.copy(this.buffers_TEMP[prog.output[n]], this.buffers[prog.output[n]]);
                    }
                } else {
                    if(prog.output != null && prog.outputTempModes == true)
                        this.webCLGL.copy(this.buffers_TEMP[prog.output], this.buffers[prog.output]);
                }
            }
        }
    }).bind(this);

    /**
     * Process kernels
     */
    this.enqueueNDRangeKernel = function() {
        for(var key in this.kernels) {
            var kernel = this.kernels[key];

            if(kernel.enabled == true) {
                if(kernel.onpre != undefined)
                    kernel.onpre();

                this.webCLGL.enqueueNDRangeKernel(kernel, getOutputBuffers(kernel));

                if(kernel.onpost != undefined)
                    kernel.onpost();
            }
        }

        updateOutputBuffers(this.kernels);
    };

    /**
     * Process VertexFragmentProgram
     * @param {String} [argumentInd=undefined] Argument for vertices count or undefined if indices exist
     * @param {Int} drawMode 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
     */
    this.enqueueVertexFragmentProgram = function(argumentInd, drawMode) {
        for(var key in this.vertexFragmentPrograms) {
            var vfp = this.vertexFragmentPrograms[key];

            if(vfp.enabled == true) {
                var buff = (this.CLGL_bufferIndices != undefined) ? this.CLGL_bufferIndices : this.buffers[argumentInd];

                if(buff != undefined && buff.length > 0) {
                    if(vfp.onpre != undefined)
                        vfp.onpre();

                    this.webCLGL.enqueueVertexFragmentProgram(vfp, buff, drawMode, getOutputBuffers(vfp));

                    if(vfp.onpost != undefined)
                        vfp.onpost();
                }
            }
        }

        updateOutputBuffers(this.vertexFragmentPrograms);
    };
};


