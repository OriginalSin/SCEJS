/**
 * WebCLGLFor
 * @class
 */
var WebCLGLFor = function() {
    "use strict";

    this.kernels = {};
    this.vertexFragmentPrograms = {};
    this._args = {};
    this._argsValues = {};
    this.calledArgs = {};

    this._webCLGL = null;
    this._gl = null;

    /**
     * defineOutputTempModes
     * @returns {Array<boolean>}
     */
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

    /**
     * prepareReturnCode
     * @returns {String}
     */
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


        var kernel = this._webCLGL.createKernel();

        var strArgs = [];
        for(var key in this._args) {
            var expl = key.split(" ");
            var argName = expl[1];

            // search arguments in use
            var matches = (kH+kS).match(new RegExp(argName, "gm"));
            if(key != "indices" && matches != null && matches.length > 0) {
                strArgs.push(key.replace("*attr ", "* ")); // make replace for ensure no *attr in KERNEL
                kernel.in_values[argName] = {};
            }
        }

        kS = 'void main('+strArgs.toString()+') {'+
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


        var vfprogram = this._webCLGL.createVertexFragmentProgram();

        var strArgs_v = [], strArgs_f = [];
        for(var key in this._args) {
            var expl = key.split(" ");
            var argName = expl[1];

            // search arguments in use
            var matches = (VFP_vertexH+VFP_vertexS).match(new RegExp(argName, "gm"));
            if(key != "indices" && matches != null && matches.length > 0) {
                strArgs_v.push(key);
                vfprogram.in_vertex_values[argName] = {};
            }
        }
        for(var key in this._args) {
            var expl = key.split(" ");
            var argName = expl[1];

            // search arguments in use
            var matches = (VFP_fragmentH+VFP_fragmentS).match(new RegExp(argName, "gm"));
            if(key != "indices" && matches != null && matches.length > 0) {
                strArgs_f.push(key);
                vfprogram.in_fragment_values[argName] = {};
            }
        }


        VFP_vertexS = 'void main('+strArgs_v.toString()+') {'+
            VFP_vertexS+
            '}';
        VFP_fragmentS = 'void main('+strArgs_f.toString()+') {'+
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

    /**
     * checkArg
     * @param {String} argument
     * @param {Array<WebCLGLKernel>} kernels
     * @param {Array<WebCLGLVertexFragmentProgram>} vfps
     * @returns {Object}
     */
    var checkArg = (function(argument, kernels, vfps) {
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
     * fillArg
     * @param {String} argName
     * @param {Array<float>} clearColor
     */
    this.fillArg = function(argName, clearColor) {
        this._webCLGL.fillBuffer(this._argsValues[argName].textureData, clearColor, this._argsValues[argName].fBuffer),
        this._webCLGL.fillBuffer(this._argsValues[argName].textureDataTemp, clearColor, this._argsValues[argName].fBufferTemp);
    };

    /**
     * Get all arguments existing in passed kernels & vertexFragmentPrograms
     * @returns {Object}
     */
    this.getAllArgs = function() {
        return this._argsValues;
    };

    /**
     * addArg
     * @param {String} arg
     */
    this.addArg = function(arg) {
        this._args[arg] = null;
    };

    /**
     * Get argument from other gpufor (instead of addArg & setArg)
     * @param {String} argument Argument to set
     * @param {WebCLGLFor} gpufor
     */
    this.getGPUForArg = function(argument, gpufor) {
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
     * @param {float|Array<float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
     * @param {Array<float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @param {String} [overrideType="FLOAT4"] - force "FLOAT4" or "FLOAT" (for no graphic program)
     * @returns {float|Array<float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement}
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
                        var checkResult = checkArg(argument, this.kernels, this.vertexFragmentPrograms);

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
                                this._argsValues[argument] = this._webCLGL.createBuffer(type, false, mode);
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
     * Get Float32Array array from a argument
     * @param {String} argument
     * @returns {Float32Array}
     */
    this.readArg = function(argument) {
        return this._webCLGL.readBuffer(this._argsValues[argument]);
    };

    /**
     * Set indices for the geometry passed in vertexFragmentProgram
     * @param {Array<float>} arr
     */
    this.setIndices = function(arr) {
        this.CLGL_bufferIndices = this._webCLGL.createBuffer("FLOAT", false, "VERTEX_INDEX");
        this.CLGL_bufferIndices.writeBuffer(arr);
    };

    /**
     * getCtx
     * returns {WebGLRenderingContext}
     */
    this.getCtx = function() {
        return this._webCLGL.getContext();
    };

    /**
     * setCtx
     * @param {WebGLRenderingContext} gl
     */
    this.setCtx = function(gl) {
        this._gl = gl;
    };

    /**
     * getWebCLGL
     * returns {WebCLGL}
     */
    this.getWebCLGL = function() {
        return this._webCLGL;
    };

    /**
     * onPreProcessKernel
     * @param {int} [kernelNum=0]
     * @param {Function} fn
     */
    this.onPreProcessKernel = function(kernelNum, fn) {
        this.kernels[kernelNum].onpre = fn;
    };

    /**
     * onPostProcessKernel
     * @param {int} [kernelNum=0]
     * @param {Function} fn
     */
    this.onPostProcessKernel = function(kernelNum, fn) {
        this.kernels[kernelNum].onpost = fn;
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
        this.vertexFragmentPrograms[graphicNum].onpre = fn;
    };

    /**
     * onPostProcessGraphic
     * @param {int} [graphicNum=0]
     * @param {Function} fn
     */
    this.onPostProcessGraphic = function(graphicNum, fn) {
        this.vertexFragmentPrograms[graphicNum].onpost = fn;
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
     * @param {boolean} [outputToTemp=null]
     */
    this.processKernels = function(outputToTemp) {
        var arrMakeCopy = [];
        for(var key in this.kernels) {
            var kernel = this.kernels[key];

            if(kernel.enabled == true) {
                //kernel.drawMode
                if(kernel.depthTest == true)
                    this._gl.enable(this._gl.DEPTH_TEST);
                else
                    this._gl.disable(this._gl.DEPTH_TEST);


                if(kernel.blend == true)
                    this._gl.enable(this._gl.BLEND);
                else
                    this._gl.disable(this._gl.BLEND);

                this._gl.blendFunc(this._gl[kernel.blendSrcMode], this._gl[kernel.blendDstMode]);
                this._gl.blendEquation(this._gl[kernel.blendEquation]);

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
                        this._webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this._argsValues), true, this._argsValues);
                        arrMakeCopy.push(kernel);
                    } else {
                        this._webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this._argsValues), false, this._argsValues);
                    }
                } else
                    this._webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this._argsValues), false, this._argsValues);

                if(kernel.onpost != undefined)
                    kernel.onpost();
            }
        }

        for(var n=0; n < arrMakeCopy.length; n++)
            this._webCLGL.copy(arrMakeCopy[n], new WebCLGLUtils().getOutputBuffers(arrMakeCopy[n], this._argsValues));
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
                    if(vfp.depthTest == true)
                        this._gl.enable(this._gl.DEPTH_TEST);
                    else
                        this._gl.disable(this._gl.DEPTH_TEST);


                    if(vfp.blend == true)
                        this._gl.enable(this._gl.BLEND);
                    else
                        this._gl.disable(this._gl.BLEND);

                    this._gl.blendFunc(this._gl[vfp.blendSrcMode], this._gl[vfp.blendDstMode]);
                    this._gl.blendEquation(this._gl[vfp.blendEquation]);

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
                        this._webCLGL.enqueueVertexFragmentProgram(vfp, buff, vfp.drawMode, new WebCLGLUtils().getOutputBuffers(vfp, this._argsValues), true, this._argsValues);
                        arrMakeCopy.push(vfp);
                    } else {
                        this._webCLGL.enqueueVertexFragmentProgram(vfp, buff, vfp.drawMode, new WebCLGLUtils().getOutputBuffers(vfp, this._argsValues), false, this._argsValues);
                    }

                    if(vfp.onpost != undefined)
                        vfp.onpost();
                }
            }
        }

        for(var n=0; n < arrMakeCopy.length; n++)
            this._webCLGL.copy(arrMakeCopy[n], new WebCLGLUtils().getOutputBuffers(arrMakeCopy[n], this._argsValues));
    };

    /**
     * initialize numeric
     */
    this.ini = function() {
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

        // args
        var buffLength = 0;
        for(var key in this._args) {
            var argVal = this._args[key];

            this.setArg(key.split(" ")[1], argVal);

            if(buffLength == 0 &&
                (argVal instanceof Array || argVal instanceof Float32Array || argVal instanceof Uint8Array || argVal instanceof HTMLImageElement))
                buffLength = argVal.length;
        }
        if(typOut=="FLOAT")
            this.addArg("float* result");
        else
            this.addArg("float4* result");
        this.setArg("result", new Float32Array(buffLength), null, typOut);

        // kernel
        this.addKernel({
            "type": "KERNEL",
            "name": "SIMPLE_KERNEL",
            "viewSource": false,
            "config": [idx, ["result"],
                '',
                code]});

        // proccess
        this.processKernels();

        return this._webCLGL.readBuffer(this._argsValues["result"]);
    };

    /**
     * initialize Graphic
     */
    this.iniG = function() {
        this._webCLGL.getContext().depthFunc(this._webCLGL.getContext().LEQUAL);
        this._webCLGL.getContext().clearDepth(1.0);

        var argumentss = arguments[0]; // override
        this._args = argumentss[1]; // first is context or canvas

        // kernel & graphics
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
    };

};