/**
 * gpufor
 * @class
 * @constructor
 */
var gpufor = function() {
    var _webCLGL;
    var _clglWork;
    var _graphicArgDestination = null;

    /** @private  */
    var ini = (function() {
        var arguments = arguments[0];
        var args;
        var idx;
        var typOut;
        var code;
        if(arguments.length > 3) {
            args = arguments[0];
            idx = arguments[1];
            typOut = arguments[2];
            code = arguments[3];
        } else {
            args = arguments[0];
            idx = arguments[1];
            typOut = "FLOAT";
            code = arguments[2];
        }

        var strArgs = "", sep="";
        for(var key in args)
            strArgs += sep+key, sep=",";

        var ksrc =   'void main('+strArgs+') {'+
                'vec2 '+idx+' = get_global_id();'+
                code.replace("return", ((typOut=="FLOAT")?"out_float":"out_float4")+" = ")+
            '}';
        var kernel = _webCLGL.createKernel();
        kernel.setKernelSource(ksrc);
        _clglWork.addKernel(kernel, "result");


        var buffLength = 0;
        for(var key in args) {
            var argVal = args[key];

            _clglWork.setArg(key.split(" ")[1], argVal);

            if(buffLength == 0 &&
                (argVal instanceof Array || argVal instanceof Float32Array || argVal instanceof Uint8Array || argVal instanceof HTMLImageElement))
                buffLength = argVal.length;
        }

        //_clglWork.setAllowKernelWriting("result");
        _clglWork.setArg("result", new Float32Array(buffLength), null, null, typOut);


        //_clglWork.enqueueNDRangeKernel("result", _clglWork.buffers_TEMP["result"]);
        //_webCLGL.copy(_clglWork.buffers_TEMP["result"], _clglWork.buffers["result"]);

        _clglWork.enqueueNDRangeKernel("result", _clglWork.buffers["result"]);

        if(typOut=="FLOAT")
            return _webCLGL.enqueueReadBuffer_Float(_clglWork.buffers["result"]);
        else
            return _webCLGL.enqueueReadBuffer_Float4(_clglWork.buffers["result"]);
    }).bind(this);

    /** @private  */
    var iniG = (function() {
        var arguments = arguments[0]; // override
        var args = arguments[1]; // first is context or canvas

        for(var i = 2; i < arguments.length; i++) {
            if(arguments[i].type == "KERNEL") {
                var K = arguments[i].config;
                var kH;
                var kS;

                var idx;
                var outArg;
                var argsInThisKernel = [];
                if(K.length == 1) { // by direct assign "posXYZW += dir" (typical use when MRT is not available)
                    idx = "n";
                    outArg = K[0].match(new RegExp(/(([a-z|A-Z])| )*/gm))[0].trim(); // "posXYZW" (out as String)
                    var rightVar = K[0].match(new RegExp(/=(([a-z|A-Z])| )*$/gm))[0].replace("=","").trim(); // "dir"
                    var operation = K[0].match(new RegExp(/([^a-z|^A-Z])+/gm))[0].trim(); // "+="
                    kH = "";
                    kS ='vec4 current = '+outArg+'['+idx+'];\n'+
                        'current '+operation+' '+rightVar+'['+idx+'];\n'+
                        'return current;\n';

                    for(var key in args) {
                        var expl = key.split(" ");

                        if(expl[1] == outArg || expl[1] == rightVar)
                            argsInThisKernel.push(key);
                    }
                } else { // by normal code
                    idx = K[0];
                    outArg = K[1]; // out can be String or Array
                    kH = K[2];
                    kS = K[3];

                    for(var key in args) {
                        var expl = key.split(" ");
                        var argName = expl[1];

                        // search arguments in use
                        var matches = (kH+kS).match(new RegExp(argName, "gm"));
                        if(key != "indices" && matches != null && matches.length > 0)
                            argsInThisKernel.push(key.replace("*attr ", "* ")); // make replace for ensure no *attr in KERNEL
                    }
                }


                var objOutStr;
                var retCode = kS.match(new RegExp(/return.*$/gm));
                retCode = retCode[0].replace("return ", ""); // now "varx" or "[varx1,varx2,..]"
                var isArr = retCode.match(new RegExp(/\[/gm));
                if(isArr != null && isArr.length >= 1) { // type outputs array
                    objOutStr = [];
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
                } else { // type one output
                    objOutStr = retCode.replace(/;$/gm, "");
                }


                var returnCode;
                if(outArg instanceof Array) { // type outputs array
                    for(var n = 0; n < outArg.length; n++) {
                        // set output type float|float4
                        _clglWork.setAllowKernelWriting(outArg[n]);
                        for(var key in args) {
                            var expl = key.split(" ");

                            if(expl[1] == outArg[n]) {
                                var mt = expl[0].match(new RegExp("float4", "gm"));
                                if(n==0)
                                    returnCode = (mt != null && mt.length > 0) ? "out_float4 = "+objOutStr[n]+";\n" : "out_float = "+objOutStr[n]+";\n";
                                else
                                    returnCode += (mt != null && mt.length > 0) ? "out"+n+"_float4 = "+objOutStr[n]+";\n" : "out"+n+"_float = "+objOutStr[n]+";\n";
                            }
                        }
                    }
                } else { // type one output
                    // set output type float|float4
                    if(outArg != undefined) {
                        _clglWork.setAllowKernelWriting(outArg);
                        for(var key in args) {
                            var expl = key.split(" ");

                            if(expl[1] == outArg) {
                                var mt = expl[0].match(new RegExp("float4", "gm"));
                                returnCode = (mt != null && mt.length > 0) ? "out_float4 = "+objOutStr+";\n" : "out_float = "+objOutStr+";\n";
                            }
                        }
                    } else
                        returnCode = "out_float4 = "+objOutStr+";\n";
                }


                var strArgs = "", sep="";
                for(var n=0; n < argsInThisKernel.length; n++)
                    strArgs += sep+argsInThisKernel[n], sep=",";


                kS = 'void main('+strArgs+') {'+
                    'vec2 '+idx+' = get_global_id();'+
                    kS.replace(/return.*$/gm, returnCode)+
                    '}';
                var kernel = _webCLGL.createKernel();
                kernel.setKernelSource(kS, kH);
                _clglWork.addKernel(kernel, outArg);

            } else if(arguments[i].type == "GRAPHIC") { // VFP
                var VFP = arguments[i].config;
                var VFP_vertexH = VFP[0];
                var VFP_vertexS = VFP[1];
                var VFP_fragmentH = VFP[2];
                var VFP_fragmentS = VFP[3];


                var argsInThisVFP_v = [];
                var strArgs_v = "", sep="";
                for(var key in args) {
                    // search arguments in use
                    var matches = (VFP_vertexH+VFP_vertexS).match(new RegExp(key.split(" ")[1], "gm"));
                    if(key != "indices" && matches != null && matches.length > 0)
                        argsInThisVFP_v.push(key);
                }
                for(var n=0; n < argsInThisVFP_v.length; n++)
                    strArgs_v += sep+argsInThisVFP_v[n], sep=",";


                var argsInThisVFP_f = [];
                var strArgs_f = "", sep="";
                for(var key in args) {
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
                    VFP_fragmentS+
                    '}';
                var vfprogram = _webCLGL.createVertexFragmentProgram();
                vfprogram.setVertexSource(VFP_vertexS, VFP_vertexH);
                vfprogram.setFragmentSource(VFP_fragmentS, VFP_fragmentH);
                _clglWork.addVertexFragmentProgram(vfprogram, Object.keys(_clglWork.vertexFragmentPrograms).length.toString());
            }
        }

        // args
        for(var key in args) {
            var argVal = args[key];

            if(key == "indices") {
                if(argVal != null)
                    _clglWork.setIndices(argVal);
            } else
                _clglWork.setArg(key.split(" ")[1], argVal);
        }
    }).bind(this);
    if(arguments[0] instanceof HTMLCanvasElement) {
        var _gl = new WebCLGLUtils().getWebGLContextFromCanvas(arguments[0]);
        _webCLGL = new WebCLGL(_gl);
        _clglWork = _webCLGL.createWork(window.gpufor_precision|1000);
        iniG(arguments);
    } else if(arguments[0] instanceof WebGLRenderingContext) {
        var _gl = arguments[0];
        _webCLGL = new WebCLGL(_gl);
        _clglWork = _webCLGL.createWork(window.gpufor_precision|1000);
        iniG(arguments);
    } else {
        _webCLGL = new WebCLGL();
        _clglWork = _webCLGL.createWork(window.gpufor_precision|0);
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
     * getWork
     */
    this.getWork = function() {
        return _clglWork;
    };

    /**
     * processKernels
     * @param {Int} [buffDest=undefined] - if 0 then output to null screen
     */
    this.processKernels = function(buffDest) {
        _clglWork.enqueueNDRangeKernel(buffDest);
    };

    /**
     * onPreProcessKernel
     * @param {Int} [kernelNum=0]
     * @param {Callback} fn
     */
    this.onPreProcessKernel = function(kernelNum, fn) {
        var fnc = (kernelNum instanceof Function) ? kernelNum : fn;
        var kernelName = (kernelNum instanceof Function) ? Object.keys(_clglWork.kernels)[0] : Object.keys(_clglWork.kernels)[kernelNum];
        _clglWork.onPreProcessKernel(kernelName, fnc);
    };

    /**
     * onPostProcessKernel
     * @param {Int} [kernelNum=0]
     * @param {Callback} fn
     */
    this.onPostProcessKernel = function(kernelNum, fn) {
        var fnc = (kernelNum instanceof Function) ? kernelNum : fn;
        var kernelName = (kernelNum instanceof Function) ? Object.keys(_clglWork.kernels)[0] : Object.keys(_clglWork.kernels)[kernelNum];
        if(kernelNum instanceof Function) {
            fnc = kernelNum;
            kernelName = Object.keys(_clglWork.kernels)[0];
        } else {
            fnc = fn;
            kernelName = Object.keys(_clglWork.kernels)[kernelNum];
        }
        _clglWork.onPostProcessKernel(kernelName, fnc);
    };

    /**
     * setArg
     * @param {String} argName
     * @param {Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
     * @param {Array<Float>} [splits=[value.length]]
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @param {String} [overrideType="FLOAT4"] - force "FLOAT4" or "FLOAT"
     * @returns {WebCLGLBuffer}
     */
    this.setArg = function(argName, value, splits, overrideDimensions, overrideType) {
        return _clglWork.setArg(argName, value, splits, overrideDimensions, overrideType);
    };

    /**
     * fillPointerArg
     * @param {String} argName
     * @param {Array<Float>} clearColor
     */
    this.fillPointerArg = function(argName, clearColor) {
        return _clglWork.fillPointerArg(argName, clearColor);
    };

    /**
     * Set shared argument from other work
     * @param {String} argument Argument to set
     * @param {WebCLGLWork} clglWork
     */
    this.setSharedBufferArg = function(argument, clglWork) {
        _clglWork.setSharedBufferArg(argument, clglWork);
    };

    /**
     * Get all arguments existing in passed kernels & vertexFragmentPrograms
     * @returns {Object}
     */
    this.getAllArgs = function() {
        return _clglWork.getAllArgs();
    };

    /**
     * processGraphic
     * @param {String} [argument=undefined] Argument for vertices count or undefined if indices exist
     * @param {Int} [drawMode=0] 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
     **/
    this.processGraphic = function(argument, drawMode) {
        var dmode = (drawMode != undefined) ? drawMode : 0;

        _clglWork.enqueueVertexFragmentProgram(argument, dmode, _graphicArgDestination);
    };

    /**
     * onPreProcessGraphic
     * @param {Int} [graphicNum=0]
     * @param {Callback} fn
     */
    this.onPreProcessGraphic = function(graphicNum, fn) {
        var fnc = (graphicNum instanceof Function) ? graphicNum : fn;
        var vfpName = (graphicNum instanceof Function) ? "0" : graphicNum.toString();
        _clglWork.onPreProcessVertexFragmentProgram(vfpName, fnc);
    };

    /**
     * onPostProcessGraphic
     * @param {Int} [graphicNum=0]
     * @param {Callback} fn
     */
    this.onPostProcessGraphic = function(graphicNum, fn) {
        var fnc = (graphicNum instanceof Function) ? graphicNum : fn;
        var vfpName = (graphicNum instanceof Function) ? "0" : graphicNum.toString();
        _clglWork.onPostProcessVertexFragmentProgram(vfpName, fnc);
    };

    /**
     * setGraphicArgDestination
     * @param {WebCLGLBuffer|Array<WebCLGLBuffer>} [buffDest=undefined]
     */
    this.setGraphicArgDestination = function(buffDest) {
        _graphicArgDestination = buffDest;
    };

    /**
     * enableGraphic
     * @param {Int} [graphicNum=0]
     */
    this.enableGraphic = function(graphicNum) {
        _clglWork.enableVertexFragmentProgram(graphicNum|"0");
    };

    /**
     * disableGraphic
     * @param {Int} [graphicNum=0]
     */
    this.disableGraphic = function(graphicNum) {
        _clglWork.disableVertexFragmentProgram(graphicNum|"0");
    };
};

