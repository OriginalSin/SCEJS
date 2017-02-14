/**
 * gpufor
 * @class
 * @constructor
 */
var gpufor = function() {
    "use strict";

	this.offset = null;

	this.kernels = {};
	this.vertexFragmentPrograms = {};
	this.buffers = {};

	var kernelPr;
	var vPr;
	var fPr;
	var type; // FLOAT or FLOAT4
	var isBuffer;
	var usedInVertex;
	var usedInFragment;

    var _alerted = false;


    var _webCLGL;
    var _args;

    /** @private  */
    var checkArg = (function(argument, value, kernels, vfps) {
        kernelPr = [];
        vPr = [];
        fPr = [];
        isBuffer = false;
        usedInVertex = false;
        usedInFragment = false;

        for(var key in kernels) {
            for(var keyB in kernels[key].in_values) {
                var inValues = kernels[key].in_values[keyB];
                if(keyB == argument) {
                    if(inValues.type == "float4_fromSampler") {
                        type = "FLOAT4";
                        isBuffer = true;
                    } else if(inValues.type == "float_fromSampler") {
                        type = "FLOAT";
                        isBuffer = true;
                    }

                    kernelPr.push(kernels[key]);
                    break;
                }
            }

        }


        for(var key in vfps) {
            for(var keyB in vfps[key].in_vertex_values) {
                var inValues = vfps[key].in_vertex_values[keyB];
                if(keyB == argument) {
                    if(inValues.type == "float4_fromSampler" || inValues.type == "float4_fromAttr") {
                        type = "FLOAT4";
                        isBuffer = true;
                    } else if(inValues.type == "float_fromSampler" || inValues.type == "float_fromAttr") {
                        type = "FLOAT";
                        isBuffer = true;
                    }

                    vPr.push(vfps[key]);
                    usedInVertex = true;
                    break;
                }
            }

            for(var keyB in vfps[key].in_fragment_values) {
                var inValues = vfps[key].in_fragment_values[keyB];
                if(keyB == argument) {
                    if(inValues.type == "float4_fromSampler") {
                        type = "FLOAT4";
                        isBuffer = true;
                    } else if(inValues.type == "float_fromSampler") {
                        type = "FLOAT";
                        isBuffer = true;
                    }

                    fPr.push(vfps[key]);
                    usedInFragment = true;
                    break;
                }
            }
        }

        if(kernelPr.length == 0 && usedInVertex == false && usedInFragment == false &&
            (value instanceof Array || value instanceof Float32Array || value instanceof Uint8Array || value instanceof HTMLImageElement))
            isBuffer = true;

            return {
                "isBuffer": isBuffer,
                "type": type,
                "kernelPr": kernelPr,
                "vPr": vPr,
                "fPr": fPr};
    }).bind(this);

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
            for(var key in _args) {
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
     * addKernel
     * @param {Object} kernelJson
     */
    this.addKernel = function(kernelJson) {
        var conf = kernelJson.config;
        var idx = conf[0];
        var outArg = (conf[1] instanceof Array) ? conf[1] : [conf[1]];
        var kH = conf[2];
        var kS = conf[3];

        var argsInThisKernel = [];



        for(var key in _args) {
            var expl = key.split(" ");
            var argName = expl[1];

            // search arguments in use
            var matches = (kH+kS).match(new RegExp(argName, "gm"));
            if(key != "indices" && matches != null && matches.length > 0)
                argsInThisKernel.push(key.replace("*attr ", "* ")); // make replace for ensure no *attr in KERNEL
        }


        var strArgs = "", sep="";
        for(var n=0; n < argsInThisKernel.length; n++)
            strArgs += sep+argsInThisKernel[n], sep=",";


        kS = 'void main('+strArgs+') {'+
            'vec2 '+idx+' = get_global_id();'+
            kS.replace(/return.*$/gm, prepareReturnCode(kS, outArg))+
            '}';
        var kernel = _webCLGL.createKernel();
        kernel.setKernelSource(kS, kH);
        addK(kernel, outArg, _args, kernelJson.drawMode, kernelJson.depthTest, kernelJson.blend, kernelJson.blendEquation, kernelJson.blendSrcMode, kernelJson.blendDstMode);
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


        var argsInThisVFP_v = [];
        var strArgs_v = "", sep="";
        for(var key in _args) {
            // search arguments in use
            var matches = (VFP_vertexH+VFP_vertexS).match(new RegExp(key.split(" ")[1], "gm"));
            if(key != "indices" && matches != null && matches.length > 0)
                argsInThisVFP_v.push(key);
        }
        for(var n=0; n < argsInThisVFP_v.length; n++)
            strArgs_v += sep+argsInThisVFP_v[n], sep=",";


        var argsInThisVFP_f = [];
        var strArgs_f = "", sep="";
        for(var key in _args) {
            // search arguments in use
            matches = (VFP_fragmentH+VFP_fragmentS).match(new RegExp(key.split(" ")[1], "gm"));
            if(key != "indices" && matches != null && matches.length > 0)
                argsInThisVFP_f.push(key);
        }
        for(var n=0; n < argsInThisVFP_f.length; n++)
            strArgs_f += sep+argsInThisVFP_f[n], sep=",";


        VFP_vertexS = 'void main('+strArgs_v+') {'+
            VFP_vertexS+
            '}';
        VFP_fragmentS = 'void main('+strArgs_f+') {'+
            VFP_fragmentS.replace(/return.*$/gm, prepareReturnCode(VFP_fragmentS, outArg))+
            '}';
        var vfprogram = _webCLGL.createVertexFragmentProgram();
        vfprogram.setVertexSource(VFP_vertexS, VFP_vertexH);
        vfprogram.setFragmentSource(VFP_fragmentS, VFP_fragmentH);
        addVertexFragmentProgram(vfprogram, outArg, _args, graphicJson.drawMode, graphicJson.depthTest, graphicJson.blend, graphicJson.blendEquation, graphicJson.blendSrcMode, graphicJson.blendDstMode);
    };

    /**
     * addArgument
     * @param {String} arg
     * @param {Float|Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
     */
    this.addArgument = function(arg, value) {
        var key = arg;

        _args[key] = value;

        var argVal = _args[key];
        this.setArg(key.split(" ")[1], argVal);
    };

    /**
     * Add one WebCLGLKernel to the work
     * @param {WebCLGLKernel} kernel
     * @param {String|Array<String>} output - Used for to write and update ARG name with the result in out_float4/out_float
     * @param {Object} args
     * @param {Object} [drawMode=4] 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
     * @param {Bool} [depthTest=true]
     * @param {Bool} [blend=false]
     * @param {String} [blendEquation="FUNC_ADD"]
     * @param {String} [blendSrcMode="SRC_ALPHA"]
     * @param {String} [blendDstMode="ONE_MINUS_SRC_ALPHA"]
     */
    var addK = (function(kernel, output, args, drawMode, depthTest, blend, blendEquation, blendSrcMode, blendDstMode) {
        kernel.output = output;
        kernel.outputTempModes = defineOutputTempModes(output, args);

        var name = Object.keys(this.kernels).length.toString();

        this.kernels[name] = kernel;
        this.kernels[name].enabled = true;
        this.kernels[name].drawMode = (drawMode != null) ? drawMode : 4;
        this.kernels[name].depthTest = (depthTest != null) ? depthTest : true;
        this.kernels[name].blend = (blend != null) ? blend : false;
        this.kernels[name].blendEquation = (blendEquation != null) ? blendEquation : "FUNC_ADD";
        this.kernels[name].blendSrcMode = (blendSrcMode != null) ? blendSrcMode : "SRC_ALPHA";
        this.kernels[name].blendDstMode = (blendDstMode != null) ? blendDstMode : "ONE_MINUS_SRC_ALPHA";
    }).bind(this);

    /**
     * Add one WebCLGLVertexFragmentProgram to the work
     * @param {WebCLGLVertexFragmentProgram} vertexFragmentProgram
     * @param {String|Array<String>} output - Used for to write and update ARG name with the result in out_float4/out_float
     * @param {Object} args
     * @param {Object} [drawMode=4] 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
     * @param {Bool} [depthTest=true]
     * @param {Bool} [blend=true]
     * @param {String} [blendEquation="FUNC_ADD"]
     * @param {String} [blendSrcMode="SRC_ALPHA"]
     * @param {String} [blendDstMode="ONE_MINUS_SRC_ALPHA"]
     */
    var addVertexFragmentProgram = (function(vertexFragmentProgram, output, args, drawMode, depthTest, blend, blendEquation, blendSrcMode, blendDstMode) {
        vertexFragmentProgram.output = output;
        vertexFragmentProgram.outputTempModes = defineOutputTempModes(output, args);

        var name = Object.keys(this.vertexFragmentPrograms).length.toString();

        this.vertexFragmentPrograms[name] = vertexFragmentProgram;
        this.vertexFragmentPrograms[name].enabled = true;
        this.vertexFragmentPrograms[name].drawMode = (drawMode != null) ? drawMode : 4;
        this.vertexFragmentPrograms[name].depthTest = (depthTest != null) ? depthTest : true;
        this.vertexFragmentPrograms[name].blend = (blend != null) ? blend : true;
        this.vertexFragmentPrograms[name].blendEquation = (blendEquation != null) ? blendEquation : "FUNC_ADD";
        this.vertexFragmentPrograms[name].blendSrcMode = (blendSrcMode != null) ? blendSrcMode : "SRC_ALPHA";
        this.vertexFragmentPrograms[name].blendDstMode = (blendDstMode != null) ? blendDstMode : "ONE_MINUS_SRC_ALPHA";
    }).bind(this);

    /**
     * Assign value of a argument for all added Kernels and vertexFragmentPrograms
     * @param {String} argument Argument to set
     * @param {Float|Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @param {String} [overrideType="FLOAT4"] - force "FLOAT4" or "FLOAT" (for no graphic program)
     * @returns {WebCLGLBuffer}
     */
    this.setArg = function(argument, value, overrideDimensions, overrideType) {
        if(argument == "indices") {
            this.setIndices(value);
        } else {
            var checkResult = checkArg(argument, value, this.kernels, this.vertexFragmentPrograms);

            if(overrideType != undefined)
                checkResult.type = overrideType;

            if(checkResult.isBuffer == true) {
                var mode = "SAMPLER"; // "ATTRIBUTE", "SAMPLER", "UNIFORM"
                if(usedInVertex == true) {
                    if(checkResult.kernelPr.length == 0 && usedInFragment == false) {
                        mode = "ATTRIBUTE";
                    }
                }

                if(value != undefined && value != null) {
                    if(this.buffers.hasOwnProperty(argument) == false ||
                        (this.buffers.hasOwnProperty(argument) == true && this.buffers[argument] == null)) {
                        this.buffers[argument] = _webCLGL.createBuffer(checkResult.type, this.offset, false, mode);
                    }
                    this.buffers[argument].writeBuffer(value, false, overrideDimensions);

                    for(var n=0; n < checkResult.kernelPr.length; n++)
                        checkResult.kernelPr[n].setKernelArg(argument, this.buffers[argument], this.buffers);

                    for(var n=0; n < checkResult.vPr.length; n++)
                        checkResult.vPr[n].setVertexArg(argument, this.buffers[argument], this.buffers);

                    for(var n=0; n < checkResult.fPr.length; n++)
                        checkResult.fPr[n].setFragmentArg(argument, this.buffers[argument], this.buffers);
                } else {
                    //this.buffers[argument] = null;
                    if(this.buffers.hasOwnProperty(argument) == false ||
                        (this.buffers.hasOwnProperty(argument) == true && this.buffers[argument] == null)) {
                        this.buffers[argument] = _webCLGL.createBuffer(checkResult.type, this.offset, false, mode);
                    }
                    this.buffers[argument].writeBuffer(new Float32Array(512*512*4), false, overrideDimensions);

                    for(var n=0; n < checkResult.kernelPr.length; n++)
                        checkResult.kernelPr[n].setKernelArg(argument, this.buffers[argument], this.buffers);

                    for(var n=0; n < checkResult.vPr.length; n++)
                        checkResult.vPr[n].setVertexArg(argument, this.buffers[argument], this.buffers);

                    for(var n=0; n < checkResult.fPr.length; n++)
                        checkResult.fPr[n].setFragmentArg(argument, this.buffers[argument], this.buffers);
                }
            } else {
                for(var n=0; n < checkResult.kernelPr.length; n++)
                    checkResult.kernelPr[n].setKernelArg(argument, value);

                for(var n=0; n < checkResult.vPr.length; n++)
                    checkResult.vPr[n].setVertexArg(argument, value);

                for(var n=0; n < checkResult.fPr.length; n++)
                    checkResult.fPr[n].setFragmentArg(argument, value);

                return value;
            }
        }

        /*if(this.calledArgs.hasOwnProperty(argument) == true) {
            for(var n=0; n < this.calledArgs[argument].length; n++) {
                var work = this.calledArgs[argument][n];
                work.getGPUForPointerArg(argument, this, false);
            }
        }*/
    };

    this.getOriginalArgs = function() {
        return _args;
    };

    /**
     * Get argument from other gpufor
     * @param {String} argument Argument to set
     * @param {gpufor} gpufor
     * @param {Bool} [makeAdd=true]
     */
    this.getGPUForPointerArg = function(argument, gpufor, makeAdd) {
        var gpufGArgs = gpufor.getOriginalArgs();
        var argValue = null;
        for(var key in gpufGArgs) {
            if(key.split(" ")[1] == argument) {
                argValue = gpufGArgs[key];
                _args[key] = argValue;
                break;
            }
        }
        var checkResult = checkArg(argument, argValue, this.kernels, this.vertexFragmentPrograms);
        var checkResultOther = checkArg(argument, argValue, gpufor.kernels, gpufor.vertexFragmentPrograms);

        if(checkResultOther.isBuffer == true) {
            this.buffers[argument] = gpufor.buffers[argument];

            for(var n=0; n < checkResult.kernelPr.length; n++)
                checkResult.kernelPr[n].setKernelArg(argument, this.buffers[argument], this.buffers);

            for(var n=0; n < checkResult.vPr.length; n++)
                checkResult.vPr[n].setVertexArg(argument, this.buffers[argument], this.buffers);

            for(var n=0; n < checkResult.fPr.length; n++)
                checkResult.fPr[n].setFragmentArg(argument, this.buffers[argument], this.buffers);
        } else {
            for(var n=0; n < checkResult.kernelPr.length; n++)
                checkResult.kernelPr[n].setKernelArg(argument, argValue);

            for(var n=0; n < checkResult.vPr.length; n++)
                checkResult.vPr[n].setVertexArg(argument, argValue);

            for(var n=0; n < checkResult.fPr.length; n++)
                checkResult.fPr[n].setFragmentArg(argument, argValue);
        }

        /*if(gpufor.calledArgs.hasOwnProperty(argument) == false)
            gpufor.calledArgs[argument] = [];

        if(makeAdd == undefined || makeAdd == true)
            gpufor.calledArgs[argument].push(this);*/
    };

    /**
     * Set indices for the geometry passed in vertexFragmentProgram
     * @param {Array<Float>} array
     */
    this.setIndices = function(arr) {
        this.CLGL_bufferIndices = _webCLGL.createBuffer("FLOAT", this.offset, false, "VERTEX_INDEX");
        this.CLGL_bufferIndices.writeBuffer(arr);
    };

    /** @private  */
    var ini = (function() {
        var argumentss = arguments[0];
        var args;
        var idx;
        var typOut;
        var code;
        if(argumentss.length > 3) {
            args = argumentss[0];
            idx = argumentss[1];
            typOut = argumentss[2];
            code = argumentss[3];
        } else {
            args = argumentss[0];
            idx = argumentss[1];
            typOut = "FLOAT";
            code = argumentss[2];
        }

        var strArgs = "", sep="";
        for(var key in args)
            strArgs += sep+key, sep=",";

        var ksrc =   'void main('+strArgs+') {'+
            'vec2 '+idx+' = get_global_id();'+
            code.replace("return", ((typOut=="FLOAT")?"out0_float":"out0_float4")+" = ")+
            '}';
        var kernel = _webCLGL.createKernel();
        kernel.setKernelSource(ksrc);
        addK(kernel, ["result"]);


        var buffLength = 0;
        for(var key in args) {
            var argVal = args[key];

            this.setArg(key.split(" ")[1], argVal);

            if(buffLength == 0 &&
                (argVal instanceof Array || argVal instanceof Float32Array || argVal instanceof Uint8Array || argVal instanceof HTMLImageElement))
                buffLength = argVal.length;
        }

        this.setArg("result", new Float32Array(buffLength), null, typOut);


        //this.processKernels("result", this.buffers_TEMP["result"]);
        //_webCLGL.copy(this.buffers_TEMP["result"], this.buffers["result"]);

        var fbs = new WebCLGLUtils().createFBs(_webCLGL.getContext(), _webCLGL.getDrawBufferExt(), _webCLGL.getMaxDrawBuffers(), this.getKernel("0"), this.buffers, this.buffers[Object.keys(this.buffers)[0]].W, this.buffers[Object.keys(this.buffers)[0]].H);

        this.processKernels(false);

        if(typOut=="FLOAT")
            return _webCLGL.enqueueReadBuffer_Float(this.buffers["result"]);
        else
            return _webCLGL.enqueueReadBuffer_Float4(this.buffers["result"]);
    }).bind(this);

    /** @private  */
    var iniG = (function() {
        var argumentss = arguments[0]; // override
        _args = argumentss[1]; // first is context or canvas

        for(var i = 2; i < argumentss.length; i++) {
            if(argumentss[i].type == "KERNEL")
                this.addKernel(argumentss[i]);
            else if(argumentss[i].type == "GRAPHIC") // VFP
                this.addGraphic(argumentss[i]);
        }

        // args
        for(var key in _args) {
            var argVal = _args[key];

            if(key == "indices") {
                if(argVal != null)
                    this.setIndices(argVal);
            } else
                this.setArg(key.split(" ")[1], argVal);
        }
    }).bind(this);
    if(arguments[0] instanceof HTMLCanvasElement) {
        var _gl = new WebCLGLUtils().getWebGLContextFromCanvas(arguments[0]);
        _webCLGL = new WebCLGL(_gl);
        this.offset = window.gpufor_precision|1000;
        iniG(arguments);
    } else if(arguments[0] instanceof WebGL2RenderingContext) {
        var _gl = arguments[0];
        _webCLGL = new WebCLGL(_gl);
        this.offset = window.gpufor_precision|1000;
        iniG(arguments);
    } else {
        _webCLGL = new WebCLGL();
        this.offset = window.gpufor_precision|0;
        return ini(arguments);
    }

    /**
     * getCtx
     */
    this.getCtx = function() {
        return _gl;
    };

    /**
     * getWebCLGL
     */
    this.getWebCLGL = function() {
        return _webCLGL;
    };

    /**
     * onPreProcessKernel
     * @param {Int} [kernelNum=0]
     * @param {Callback} fn
     */
    this.onPreProcessKernel = function(kernelNum, fn) {
        var fnc = (kernelNum instanceof Function) ? kernelNum : fn;
        var kernelName = (kernelNum instanceof Function) ? Object.keys(this.kernels)[0] : Object.keys(this.kernels)[kernelNum];
        this.kernels[kernelName].onpre = fnc;
    };

    /**
     * onPostProcessKernel
     * @param {Int} [kernelNum=0]
     * @param {Callback} fn
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
     * @param {Int} [kernelNum=0]
     */
    this.enableKernel = function(kernelNum) {
        this.kernels[kernelNum.toString()|"0"].enabled = true;
    };

    /**
     * disableKernel
     * @param {Int} [kernelNum=0]
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
            if(key == name) {
                return this.kernels[key];
                break;
            }
        }
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
     * @param {Int} [graphicNum=0]
     * @param {Callback} fn
     */
    this.onPreProcessGraphic = function(graphicNum, fn) {
        var fnc = (graphicNum instanceof Function) ? graphicNum : fn;
        var vfpName = (graphicNum instanceof Function) ? "0" : graphicNum.toString();
        this.vertexFragmentPrograms[vfpName].onpre = fnc;
    };

    /**
     * onPostProcessGraphic
     * @param {Int} [graphicNum=0]
     * @param {Callback} fn
     */
    this.onPostProcessGraphic = function(graphicNum, fn) {
        var fnc = (graphicNum instanceof Function) ? graphicNum : fn;
        var vfpName = (graphicNum instanceof Function) ? "0" : graphicNum.toString();
        this.vertexFragmentPrograms[vfpName].onpost = fnc;
    };

    /**
     * enableGraphic
     * @param {Int} [graphicNum=0]
     */
    this.enableGraphic = function(graphicNum) {
        this.vertexFragmentPrograms[graphicNum.toString()|"0"].enabled = true;
    };

    /**
     * disableGraphic
     * @param {Int} [graphicNum=0]
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
            if(key == name) {
                return this.vertexFragmentPrograms[key];
                break;
            }
        }
    };

    /**
     * Get all added WebCLGLVertexFragmentPrograms
     * @returns {Object}
     */
    this.getAllVertexFragmentProgram = function() {
        return this.vertexFragmentPrograms;
    };



    /**
     * fillPointerArg
     * @param {String} argName
     * @param {Array<Float>} clearColor
     */
    this.fillPointerArg = function(argName, clearColor) {
        _webCLGL.fillBuffer(this.buffers[argName].textureData, clearColor, this.buffers[argName].fBuffer),
        _webCLGL.fillBuffer(this.buffers[argName].textureDataTemp, clearColor, this.buffers[argName].fBufferTemp);
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
     * Process kernels
     * @param {Bool} outputToTemp - (when no graphic mode)
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
                        _webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this.buffers), true, this.buffers);
                        arrMakeCopy.push(kernel);
                    } else {
                        _webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this.buffers), false, this.buffers);
                    }
                } else
                    _webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this.buffers), false, this.buffers);

                if(kernel.onpost != undefined)
                    kernel.onpost();

                if(kernel.depthTest == true)
                    _gl.clear(_gl.DEPTH_BUFFER_BIT);
            }
        }

        for(var n=0; n < arrMakeCopy.length; n++)
            _webCLGL.copy(arrMakeCopy[n], new WebCLGLUtils().getOutputBuffers(arrMakeCopy[n], this.buffers));
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
                var buff = (this.CLGL_bufferIndices != undefined) ? this.CLGL_bufferIndices : this.buffers[argumentInd];

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
                        _webCLGL.enqueueVertexFragmentProgram(vfp, buff, vfp.drawMode, new WebCLGLUtils().getOutputBuffers(vfp, this.buffers), true, this.buffers);
                        arrMakeCopy.push(vfp);
                    } else {
                        _webCLGL.enqueueVertexFragmentProgram(vfp, buff, vfp.drawMode, new WebCLGLUtils().getOutputBuffers(vfp, this.buffers), false, this.buffers);
                    }

                    if(vfp.onpost != undefined)
                        vfp.onpost();

                    if(vfp.depthTest == true)
                        _gl.clear(_gl.DEPTH_BUFFER_BIT);
                }
            }
        }

        for(var n=0; n < arrMakeCopy.length; n++)
            _webCLGL.copy(arrMakeCopy[n], new WebCLGLUtils().getOutputBuffers(arrMakeCopy[n], this.buffers));
    };
};


