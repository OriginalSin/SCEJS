/**
 * WebCLGLFor
 * @class
 */
var WebCLGLFor = function() {
    "use strict";

	this.offset = null;

	this.kernels = {};
	this.vertexFragmentPrograms = {};
    this._args = {};
    this._argsValues = {};
    this.calledArgs = {};

    var _webCLGL = null;
    var _gl = null;

    /** @private */
    var defineOutputTempModes = (function(output, args) {
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

        var outputTempModes = [];
        for(var n=0; n < output.length; n++)
            outputTempModes[n] = (output[n] != null) ? searchInArgs(output[n], args) : false;

        return outputTempModes;
    }).bind(this);

    var prepareReturnCode = (function(source, outArg) {
        var objOutStr = [];
        var retCode = source.match(new RegExp(/return.*$/gm));
        retCode = retCode[0].replace("return ", ""); // now "varx" or "[varx1,varx2,..]"
        var isArr = retCode.match(new RegExp(/\[/gm));
        if(isArr != null && isArr.length >= 1) { // type outputs array
            retCode = retCode.split("[")[1].split("]")[0];
            var itemStr = "", openParenth = 0;
            for(var n=0; n < retCode.length; n++) {
                if(retCode[n] == "," && openParenth == 0) {
                    objOutStr.push(itemStr);
                    itemStr = "";
                } else
                    itemStr += retCode[n];

                if(retCode[n] == "(")
                    openParenth++;
                if(retCode[n] == ")")
                    openParenth--;
            }
            objOutStr.push(itemStr); // and the last
        } else  // type one output
            objOutStr.push(retCode.replace(/;$/gm, ""));


        var returnCode = "";
        for(var n = 0; n < outArg.length; n++) {
            // set output type float|float4
            var found = false;
            for(var key in this._args) {
                if(key != "indices") {
                    var expl = key.split(" ");

                    if(expl[1] == outArg[n]) {
                        var mt = expl[0].match(new RegExp("float4", "gm"));
                        returnCode += (mt != null && mt.length > 0) ? "out"+n+"_float4 = "+objOutStr[n]+";\n" : "out"+n+"_float = "+objOutStr[n]+";\n";

                        found = true;
                        break;
                    }
                }
            }
            if(found == false)
                returnCode += "out"+n+"_float4 = "+objOutStr[n]+";\n";
        }
        return returnCode;
    }).bind(this);

    /**
     * Add one WebCLGLKernel to the work
     * @param {Object} kernelJson
     */
    this.addKernel = function(kernelJson) {
        var conf = kernelJson.config;
        var idx = conf[0];
        var outArg = (conf[1] instanceof Array) ? conf[1] : [conf[1]];
        var kH = conf[2];
        var kS = conf[3];


        var kernel = _webCLGL.createKernel();

        var strArgs = "", sep="";
        for(var key in this._args) {
            var expl = key.split(" ");
            var argName = expl[1];

            // search arguments in use
            var matches = (kH+kS).match(new RegExp(argName, "gm"));
            if(key != "indices" && matches != null && matches.length > 0) {
                strArgs += sep+key.replace("*attr ", "* "); // make replace for ensure no *attr in KERNEL
                kernel.in_values[argName] = {};

                sep=",";
            }
        }

        kS = 'void main('+strArgs+') {'+
            'vec2 '+idx+' = get_global_id();'+
            kS.replace(/return.*$/gm, prepareReturnCode(kS, outArg))+
            '}';

        kernel.name = kernelJson.name;
        kernel.viewSource = (kernelJson.viewSource != null) ? kernelJson.viewSource : false;
        kernel.setKernelSource(kS, kH);

        kernel.output = outArg;
        kernel.outputTempModes = defineOutputTempModes(outArg, this._args);
        kernel.enabled = true;
        kernel.drawMode = (kernelJson.drawMode != null) ? kernelJson.drawMode : 4;
        kernel.depthTest = (kernelJson.depthTest != null) ? kernelJson.depthTest : true;
        kernel.blend = (kernelJson.blend != null) ? kernelJson.blend : false;
        kernel.blendEquation = (kernelJson.blendEquation != null) ? kernelJson.blendEquation : "FUNC_ADD";
        kernel.blendSrcMode = (kernelJson.blendSrcMode != null) ? kernelJson.blendSrcMode : "SRC_ALPHA";
        kernel.blendDstMode = (kernelJson.blendDstMode != null) ? kernelJson.blendDstMode : "ONE_MINUS_SRC_ALPHA";

        this.kernels[Object.keys(this.kernels).length.toString()] = kernel;
    };

    /**
     * addGraphic
     * @param {Object} graphicJson
     */
    this.addGraphic = function(graphicJson) {
        var conf = graphicJson.config;
        var outArg = [null];
        var VFP_vertexH;
        var VFP_vertexS;
        var VFP_fragmentH;
        var VFP_fragmentS;
        if(conf.length == 5) {
            outArg = (conf[0] instanceof Array) ? conf[0] : [conf[0]];
            VFP_vertexH = conf[1];
            VFP_vertexS = conf[2];
            VFP_fragmentH = conf[3];
            VFP_fragmentS = conf[4];
        } else {
            VFP_vertexH = conf[0];
            VFP_vertexS = conf[1];
            VFP_fragmentH = conf[2];
            VFP_fragmentS = conf[3];
        }


        var vfprogram = _webCLGL.createVertexFragmentProgram();

        var strArgs_v = "", sep="";
        for(var key in this._args) {
            var expl = key.split(" ");
            var argName = expl[1];

            // search arguments in use
            var matches = (VFP_vertexH+VFP_vertexS).match(new RegExp(argName, "gm"));
            if(key != "indices" && matches != null && matches.length > 0) {
                strArgs_v += sep+key;
                vfprogram.in_vertex_values[argName] = {};

                sep=",";
            }
        };


        var strArgs_f = "", sep="";
        for(var key in this._args) {
            var expl = key.split(" ");
            var argName = expl[1];

            // search arguments in use
            matches = (VFP_fragmentH+VFP_fragmentS).match(new RegExp(argName, "gm"));
            if(key != "indices" && matches != null && matches.length > 0) {
                strArgs_f += sep+key;
                vfprogram.in_fragment_values[argName] = {};

                sep=",";
            }
        }


        VFP_vertexS = 'void main('+strArgs_v+') {'+
            VFP_vertexS+
            '}';
        VFP_fragmentS = 'void main('+strArgs_f+') {'+
            VFP_fragmentS.replace(/return.*$/gm, prepareReturnCode(VFP_fragmentS, outArg))+
            '}';

        vfprogram.name = graphicJson.name;
        vfprogram.viewSource = (graphicJson.viewSource != null) ? graphicJson.viewSource : false;
        vfprogram.setVertexSource(VFP_vertexS, VFP_vertexH);
        vfprogram.setFragmentSource(VFP_fragmentS, VFP_fragmentH);

        vfprogram.output = outArg;
        vfprogram.outputTempModes = defineOutputTempModes(outArg, this._args);
        vfprogram.enabled = true;
        vfprogram.drawMode = (graphicJson.drawMode != null) ? graphicJson.drawMode : 4;
        vfprogram.depthTest = (graphicJson.depthTest != null) ? graphicJson.depthTest : true;
        vfprogram.blend = (graphicJson.blend != null) ? graphicJson.blend : true;
        vfprogram.blendEquation = (graphicJson.blendEquation != null) ? graphicJson.blendEquation : "FUNC_ADD";
        vfprogram.blendSrcMode = (graphicJson.blendSrcMode != null) ? graphicJson.blendSrcMode : "SRC_ALPHA";
        vfprogram.blendDstMode = (graphicJson.blendDstMode != null) ? graphicJson.blendDstMode : "ONE_MINUS_SRC_ALPHA";

        this.vertexFragmentPrograms[Object.keys(this.vertexFragmentPrograms).length.toString()] = vfprogram;
    };

    /** @private  */
    var checkArg = (function(argument, value, kernels, vfps) {
        var kernelPr = [];
        var usedInVertex = false;
        var usedInFragment = false;

        for(var key in kernels) {
            for(var keyB in kernels[key].in_values) {
                var inValues = kernels[key].in_values[keyB];
                if(keyB == argument) {
                    kernelPr.push(kernels[key]);
                    break;
                }
            }

        }

        for(var key in vfps) {
            for(var keyB in vfps[key].in_vertex_values) {
                var inValues = vfps[key].in_vertex_values[keyB];
                if(keyB == argument) {
                    usedInVertex = true;
                    break;
                }
            }

            for(var keyB in vfps[key].in_fragment_values) {
                var inValues = vfps[key].in_fragment_values[keyB];
                if(keyB == argument) {
                    usedInFragment = true;
                    break;
                }
            }
        }

        return {
            "usedInVertex": usedInVertex,
            "usedInFragment": usedInFragment,
            "kernelPr": kernelPr};
    }).bind(this);

    /**
     * fillPointerArg
     * @param {String} argName
     * @param {Array<Float>} clearColor
     */
    this.fillPointerArg = function(argName, clearColor) {
        _webCLGL.fillBuffer(this._argsValues[argName].textureData, clearColor, this._argsValues[argName].fBuffer),
        _webCLGL.fillBuffer(this._argsValues[argName].textureDataTemp, clearColor, this._argsValues[argName].fBufferTemp);
    };

    /**
     * Get all arguments existing in passed kernels & vertexFragmentPrograms
     * @returns {Object}
     */
    this.getAllArgs = function() {
        return this._argsValues;
    };

    /**
     * addArgument
     * @param {String} arg
     */
    this.addArgument = function(arg) {
        this._args[arg] = null;
    };

    /**
     * Get argument from other gpufor (instead of addArgument & setArg)
     * @param {String} argument Argument to set
     * @param {WebCLGLFor} gpufor
     */
    this.getGPUForPointerArg = function(argument, gpufor) {
        if(this.calledArgs.hasOwnProperty(argument) == false)
            this.calledArgs[argument] = [];
        this.calledArgs[argument].push(gpufor);

        if(gpufor.calledArgs.hasOwnProperty(argument) == false)
            gpufor.calledArgs[argument] = [];
        gpufor.calledArgs[argument].push(this);


        for(var key in gpufor._args) {
            var argName = key.split(" ")[1];
            if(argName == argument) {
                this._args[key] = gpufor._args[key];
                this._argsValues[argName] = gpufor._argsValues[argName];
                break;
            }
        }
    };

    /**
     * Assign value of a argument for all added Kernels and vertexFragmentPrograms
     * @param {String} argument Argument to set
     * @param {Float|Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @param {String} [overrideType="FLOAT4"] - force "FLOAT4" or "FLOAT" (for no graphic program)
     * @returns {Float|Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement}
     */
    this.setArg = function(argument, value, overrideDimensions, overrideType) {
        if(argument == "indices") {
            this.setIndices(value);
        } else {
            for(var key in this._args) {
                if(key.split(" ")[1] == argument) {
                    var updateCalledArg = false;
                    if(key.match(/\*/gm) != null) {
                        // buffer
                        var checkResult = checkArg(argument, value, this.kernels, this.vertexFragmentPrograms);

                        var mode = "SAMPLER"; // ATTRIBUTE or SAMPLER
                        if(checkResult.usedInVertex == true) {
                            if(checkResult.kernelPr.length == 0 && checkResult.usedInFragment == false)
                                mode = "ATTRIBUTE";
                        }

                        var type = key.split("*")[0].toUpperCase();
                        if(overrideType != undefined)
                            type = overrideType;


                        if(value != undefined && value != null) {
                            if(this._argsValues.hasOwnProperty(argument) == false ||
                                (this._argsValues.hasOwnProperty(argument) == true && this._argsValues[argument] == null)) {
                                this._argsValues[argument] = _webCLGL.createBuffer(type, this.offset, false, mode);
                                this._argsValues[argument].argument = argument;

                                updateCalledArg = true;
                            }
                            this._argsValues[argument].writeBuffer(value, false, overrideDimensions);
                        } else {
                            this._argsValues[argument] = null;
                        }
                    } else {
                        // UNIFORM
                        if(value != undefined && value != null)
                            this._argsValues[argument] = value;

                        updateCalledArg = true;
                    }

                    if(updateCalledArg == true && this.calledArgs.hasOwnProperty(argument) == true) {
                        for(var n=0; n < this.calledArgs[argument].length; n++) {
                            var gpufor = this.calledArgs[argument][n];
                            gpufor._argsValues[argument] = this._argsValues[argument];
                        }
                    }
                    break;
                }
            }
        }

        return value;
    };

    /**
     * Set indices for the geometry passed in vertexFragmentProgram
     * @param {Array<Float>} arr
     */
    this.setIndices = function(arr) {
        this.CLGL_bufferIndices = _webCLGL.createBuffer("FLOAT", this.offset, false, "VERTEX_INDEX");
        this.CLGL_bufferIndices.writeBuffer(arr);
    };

    /**
     * initialize
     */
    this.ini = (function() {
        if(_gl != undefined)
            _webCLGL = new WebCLGL(_gl);
        else
            _webCLGL = new WebCLGL();

        var argumentss = arguments[0];
        var idx;
        var typOut;
        var code;
        if(argumentss.length > 3) {
            this._args = argumentss[0];
            idx = argumentss[1];
            typOut = argumentss[2];
            code = argumentss[3];
        } else {
            this._args = argumentss[0];
            idx = argumentss[1];
            typOut = "FLOAT";
            code = argumentss[2];
        }

        var strArgs = "", sep="";
        for(var key in this._args)
            strArgs += sep+key, sep=",";

        var ksrc =   'void main('+strArgs+') {'+
            'vec2 '+idx+' = get_global_id();'+
            code.replace("return", ((typOut=="FLOAT")?"out0_float":"out0_float4")+" = ")+
            '}';
        var kernel = _webCLGL.createKernel();
        kernel.setKernelSource(ksrc);

        kernel.output = ["result"];
        kernel.outputTempModes = defineOutputTempModes(["result"], this._args);
        kernel.enabled = true;
        kernel.drawMode = 4;
        kernel.depthTest = true;
        kernel.blend = false;
        kernel.blendEquation = "FUNC_ADD";
        kernel.blendSrcMode = "SRC_ALPHA";
        kernel.blendDstMode = "ONE_MINUS_SRC_ALPHA";

        this.kernels[Object.keys(this.kernels).length.toString()] = kernel;


        var buffLength = 0;
        for(var key in this._args) {
            var argVal = this._args[key];

            this.setArg(key.split(" ")[1], argVal);

            if(buffLength == 0 &&
                (argVal instanceof Array || argVal instanceof Float32Array || argVal instanceof Uint8Array || argVal instanceof HTMLImageElement))
                buffLength = argVal.length;
        }
        this.addArgument("float* result");
        this.setArg("result", new Float32Array(buffLength), null, typOut);


        //this.processKernels("result", this.buffers_TEMP["result"]);
        //_webCLGL.copy(this.buffers_TEMP["result"], this.buffers["result"]);

        //var fbs = new WebCLGLUtils().createFBs(_webCLGL.getContext(), _webCLGL.getDrawBufferExt(), _webCLGL.getMaxDrawBuffers(), this.getKernel("0"), this._argsValues, this.buffers[Object.keys(this.buffers)[0]].W, this.buffers[Object.keys(this.buffers)[0]].H);

        this.processKernels(false);

        if(typOut=="FLOAT")
            return _webCLGL.enqueueReadBuffer_Float(this._argsValues["result"]);
        else
            return _webCLGL.enqueueReadBuffer_Float4(this._argsValues["result"]);
    }).bind(this);

    /**
     * initialize Graphic
     */
    this.iniG = (function() {
        if(_gl != undefined)
            _webCLGL = new WebCLGL(_gl);
        else
            _webCLGL = new WebCLGL();

        _webCLGL.getContext().depthFunc(_webCLGL.getContext().LEQUAL);
        _webCLGL.getContext().clearDepth(1.0);

        var argumentss = arguments[0]; // override
        this._args = argumentss[1]; // first is context or canvas

        for(var i = 2; i < argumentss.length; i++) {
            if(argumentss[i].type == "KERNEL")
                this.addKernel(argumentss[i]);
            else if(argumentss[i].type == "GRAPHIC") // VFP
                this.addGraphic(argumentss[i]);
        }

        // args
        for(var key in this._args) {
            var argVal = this._args[key];

            if(key == "indices") {
                if(argVal != null)
                    this.setIndices(argVal);
            } else
                this.setArg(key.split(" ")[1], argVal);
        }
    }).bind(this);

    /**
     * getCtx
     * returns {WebGLRenderingContext}
     */
    this.getCtx = function() {
        return _webCLGL.getContext();
    };

    /**
     * setCtx
     * @param {WebGLRenderingContext} gl
     */
    this.setCtx = function(gl) {
        _gl = gl;
    };

    /**
     * getWebCLGL
     * returns {WebCLGL}
     */
    this.getWebCLGL = function() {
        return _webCLGL;
    };

    /**
     * onPreProcessKernel
     * @param {int} [kernelNum=0]
     * @param {Function} fn
     */
    this.onPreProcessKernel = function(kernelNum, fn) {
        var fnc = (kernelNum instanceof Function) ? kernelNum : fn;
        var kernelName = (kernelNum instanceof Function) ? Object.keys(this.kernels)[0] : Object.keys(this.kernels)[kernelNum];
        this.kernels[kernelName].onpre = fnc;
    };

    /**
     * onPostProcessKernel
     * @param {int} [kernelNum=0]
     * @param {Function} fn
     */
    this.onPostProcessKernel = function(kernelNum, fn) {
        var fnc = (kernelNum instanceof Function) ? kernelNum : fn;
        var kernelName = (kernelNum instanceof Function) ? Object.keys(this.kernels)[0] : Object.keys(this.kernels)[kernelNum];
        if(kernelNum instanceof Function) {
            fnc = kernelNum;
            kernelName = Object.keys(this.kernels)[0];
        } else {
            fnc = fn;
            kernelName = Object.keys(this.kernels)[kernelNum];
        }
        this.kernels[kernelName].onpost = fnc;
    };

    /**
     * enableKernel
     * @param {int} [kernelNum=0]
     */
    this.enableKernel = function(kernelNum) {
        this.kernels[kernelNum.toString()|"0"].enabled = true;
    };

    /**
     * disableKernel
     * @param {int} [kernelNum=0]
     */
    this.disableKernel = function(kernelNum) {
        this.kernels[kernelNum.toString()|"0"].enabled = false;
    };

    /**
     * Get one added WebCLGLKernel
     * @param {String} name Get assigned kernel for this argument
     * @returns {WebCLGLKernel}
     */
    this.getKernel = function(name) {
        for(var key in this.kernels) {
            if(key == name)
                return this.kernels[key];
        }

        return null;
    };

    /**
     * Get all added WebCLGLKernels
     * @returns {Object}
     */
    this.getAllKernels = function() {
        return this.kernels;
    };

    /**
     * onPreProcessGraphic
     * @param {int} [graphicNum=0]
     * @param {Function} fn
     */
    this.onPreProcessGraphic = function(graphicNum, fn) {
        var fnc = (graphicNum instanceof Function) ? graphicNum : fn;
        var vfpName = (graphicNum instanceof Function) ? "0" : graphicNum.toString();
        this.vertexFragmentPrograms[vfpName].onpre = fnc;
    };

    /**
     * onPostProcessGraphic
     * @param {int} [graphicNum=0]
     * @param {Function} fn
     */
    this.onPostProcessGraphic = function(graphicNum, fn) {
        var fnc = (graphicNum instanceof Function) ? graphicNum : fn;
        var vfpName = (graphicNum instanceof Function) ? "0" : graphicNum.toString();
        this.vertexFragmentPrograms[vfpName].onpost = fnc;
    };

    /**
     * enableGraphic
     * @param {int} [graphicNum=0]
     */
    this.enableGraphic = function(graphicNum) {
        this.vertexFragmentPrograms[graphicNum.toString()|"0"].enabled = true;
    };

    /**
     * disableGraphic
     * @param {int} [graphicNum=0]
     */
    this.disableGraphic = function(graphicNum) {
        this.vertexFragmentPrograms[graphicNum.toString()|"0"].enabled = false;
    };

    /**
     * Get one added WebCLGLVertexFragmentProgram
     * @param {String} name Get assigned vfp for this argument
     * @returns {WebCLGLVertexFragmentProgram}
     */
    this.getVertexFragmentProgram = function(name) {
        for(var key in this.vertexFragmentPrograms) {
            if(key == name)
                return this.vertexFragmentPrograms[key];
        }

        return null;
    };

    /**
     * Get all added WebCLGLVertexFragmentPrograms
     * @returns {Object}
     */
    this.getAllVertexFragmentProgram = function() {
        return this.vertexFragmentPrograms;
    };

    /**
     * Process kernels
     * @param {boolean} outputToTemp - (when no graphic mode)
     */
    this.processKernels = function(outputToTemp) {
        var arrMakeCopy = [];
        for(var key in this.kernels) {
            var kernel = this.kernels[key];

            if(kernel.enabled == true) {
                //kernel.drawMode
                if(kernel.depthTest == true) {
                    _gl.enable(_gl.DEPTH_TEST);
                    //_gl.clear(_gl.DEPTH_BUFFER_BIT | _gl.COLOR_BUFFER_BIT);
                } else {
                    _gl.disable(_gl.DEPTH_TEST);
                }


                if(kernel.blend == true)
                    _gl.enable(_gl.BLEND);
                else
                    _gl.disable(_gl.BLEND);

                _gl.blendFunc(_gl[kernel.blendSrcMode], _gl[kernel.blendDstMode]);
                _gl.blendEquation(_gl[kernel.blendEquation]);

                if(kernel.onpre != undefined)
                    kernel.onpre();

                if(outputToTemp == undefined || outputToTemp == true) {
                    var tempsFound = false;
                    for(var n=0; n < kernel.output.length; n++) {
                        if(kernel.output[n] != null && kernel.outputTempModes[n] == true) {
                            tempsFound = true;
                            break;
                        }
                    }

                    if(tempsFound == true) {
                        _webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this._argsValues), true, this._argsValues);
                        arrMakeCopy.push(kernel);
                    } else {
                        _webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this._argsValues), false, this._argsValues);
                    }
                } else
                    _webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this._argsValues), false, this._argsValues);

                if(kernel.onpost != undefined)
                    kernel.onpost();

                if(kernel.depthTest == true)
                    _gl.clear(_gl.DEPTH_BUFFER_BIT);
            }
        }

        for(var n=0; n < arrMakeCopy.length; n++)
            _webCLGL.copy(arrMakeCopy[n], new WebCLGLUtils().getOutputBuffers(arrMakeCopy[n], this._argsValues));
    };

    /**
     * processGraphic
     * @param {String} [argumentInd=undefined] Argument for vertices count or undefined if argument "indices" exist
     **/
    this.processGraphic = function(argumentInd) {
        var arrMakeCopy = [];
        for(var key in this.vertexFragmentPrograms) {
            var vfp = this.vertexFragmentPrograms[key];

            if(vfp.enabled == true) {
                var buff = (argumentInd == undefined && this.CLGL_bufferIndices != undefined) ? this.CLGL_bufferIndices : this._argsValues[argumentInd];

                if(buff != undefined && buff.length > 0) {
                    if(vfp.depthTest == true) {
                        _gl.enable(_gl.DEPTH_TEST);
                        //_gl.clear(_gl.DEPTH_BUFFER_BIT | _gl.COLOR_BUFFER_BIT);
                    } else {
                        _gl.disable(_gl.DEPTH_TEST);
                    }


                    if(vfp.blend == true)
                        _gl.enable(_gl.BLEND);
                    else
                        _gl.disable(_gl.BLEND);

                    _gl.blendFunc(_gl[vfp.blendSrcMode], _gl[vfp.blendDstMode]);
                    _gl.blendEquation(_gl[vfp.blendEquation]);

                    if(vfp.onpre != undefined)
                        vfp.onpre();

                    var tempsFound = false;
                    for(var n=0; n < vfp.output.length; n++) {
                        if(vfp.output[n] != null && vfp.outputTempModes[n] == true) {
                            tempsFound = true;
                            break;
                        }
                    }

                    if(tempsFound == true) {
                        _webCLGL.enqueueVertexFragmentProgram(vfp, buff, vfp.drawMode, new WebCLGLUtils().getOutputBuffers(vfp, this._argsValues), true, this._argsValues);
                        arrMakeCopy.push(vfp);
                    } else {
                        _webCLGL.enqueueVertexFragmentProgram(vfp, buff, vfp.drawMode, new WebCLGLUtils().getOutputBuffers(vfp, this._argsValues), false, this._argsValues);
                    }

                    if(vfp.onpost != undefined)
                        vfp.onpost();

                    if(vfp.depthTest == true)
                        _gl.clear(_gl.DEPTH_BUFFER_BIT);
                }
            }
        }

        for(var n=0; n < arrMakeCopy.length; n++)
            _webCLGL.copy(arrMakeCopy[n], new WebCLGLUtils().getOutputBuffers(arrMakeCopy[n], this._argsValues));
    };
};
/**
 * gpufor
 * @returns {WebCLGLFor|Array<Float>}
 */
var gpufor = function() {
    "use strict";
    var clglFor = new WebCLGLFor();
    var _gl;
    if(arguments[0] instanceof HTMLCanvasElement) {
        _gl = new WebCLGLUtils().getWebGLContextFromCanvas(arguments[0]);
        clglFor.setCtx(_gl);
        clglFor.offset = window.gpufor_precision|1000;
        clglFor.iniG(arguments);
        return clglFor;
    } else if(arguments[0] instanceof WebGLRenderingContext) {
        _gl = arguments[0];
        clglFor.setCtx(_gl);
        clglFor.offset = window.gpufor_precision|1000;
        clglFor.iniG(arguments);
        return clglFor;
    } else {
        var e = document.createElement('canvas');
        e.width = 32;
        e.height = 32;
        _gl = new WebCLGLUtils().getWebGLContextFromCanvas(e, {antialias: false});
        clglFor.setCtx(_gl);
        clglFor.offset = window.gpufor_precision|0;
        return clglFor.ini(arguments);
    }
};

