/**
 * @class
 * @constructor
 */
Component_GPU = function() {
    "use strict";

    this.gpufG = null;
    this.args = {};

    var _enableKernel = true;
    var _drawMode = 4;
    var _enableDepthTest = true;
    var _enableBlend = false;
    var _blendEquation = Constants.BLENDING_EQUATION_TYPES.FUNC_ADD;
    var _blendSrc = Constants.BLENDING_MODES.ONE;
    var _blendDst = Constants.BLENDING_MODES.ZERO;

    /**
     * setGPUFor
     */
    this.setGPUFor = function() {
        for(var key in arguments[1]) {
            var expl = key.split(" ");
            if(expl != null && expl.length > 1) {
                var argName = expl[1];
                this.args[argName] = {
                	"fnvalue": arguments[1][key],
                    "updatable": null,
                    "splits": null,
                    "overrideDimensions": null};
            }
            arguments[1][key] = arguments[1][key]();
        }

        var F = (function(args) {
            return gpufor.apply(this, args);
        }).bind(this, arguments);
        this.gpufG = new F();
    };

    /**
     * getWork
     * @returns {WebCLGLWork}
     */
    this.getWork = function() {
        return this.gpufG.getWork();
    };

    /**
     * getWebCLGL
     * @returns {WebCLGL}
     */
    this.getWebCLGL = function() {
        return this.gpufG.getWebCLGL();
    };


    //██╗  ██╗███████╗██████╗ ███╗   ██╗███████╗██╗     ███████╗
    //██║ ██╔╝██╔════╝██╔══██╗████╗  ██║██╔════╝██║     ██╔════╝
    //█████╔╝ █████╗  ██████╔╝██╔██╗ ██║█████╗  ██║     ███████╗
    //██╔═██╗ ██╔══╝  ██╔══██╗██║╚██╗██║██╔══╝  ██║     ╚════██║
    //██║  ██╗███████╗██║  ██║██║ ╚████║███████╗███████╗███████║
    //╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚══════╝

    /**
     * enableKernel
     * @param {Int} [kernelNum=0]
     */
    this.enableKernel = function(kernelNum) {
        this.gpufG.enableKernel(kernelNum);
    };

    /**
     * disableKernel
     * @param {Int} [kernelNum=0]
     */
    this.disableKernel = function(kernelNum) {
        this.gpufG.disableKernel(kernelNum);
    };

    /**
     * onPreProcessKernels
     * @param {Int} [kernelNum=0]
     * @param {Callback} fn
     */
    this.onPreProcessKernels = function(kernelNum, fn) {
        this.gpufG.onPreProcessKernel(kernelNum, fn);
    };

    /**
     * onPostProcessKernels
     * @param {Int} [kernelNum=0]
     * @param {Callback} fn
     */
    this.onPostProcessKernels = function(kernelNum, fn) {
        this.gpufG.onPostProcessKernel(kernelNum, fn);
    };

    /**
     * tickKernels
     * @param {Bool} [isScreenEffects=false]
     * @private
     */
    this.processKernels = function(isScreenEffects) {
        if(this.gpufG != null && _enableKernel == true) {
            this.gl.enable(this.gl.DEPTH_TEST);

            this.gpufG.processKernels();
        }
    };


    // ██████╗ ██████╗  █████╗ ██████╗ ██╗  ██╗██╗ ██████╗███████╗
    //██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██║  ██║██║██╔════╝██╔════╝
    //██║  ███╗██████╔╝███████║██████╔╝███████║██║██║     ███████╗
    //██║   ██║██╔══██╗██╔══██║██╔═══╝ ██╔══██║██║██║     ╚════██║
    //╚██████╔╝██║  ██║██║  ██║██║     ██║  ██║██║╚██████╗███████║
    // ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝

    /**
     * enableGraphic
     * @param {Int} [graphicNum=0]
     */
    this.enableGraphic = function(graphicNum) {
        this.gpufG.enableGraphic(graphicNum);
    };

    /**
     * disableGraphic
     * @param {Int} [graphicNum=0]
     */
    this.disableGraphic = function(graphicNum) {
        this.gpufG.disableGraphic(graphicNum);
    };

    /**
     * setGraphicDrawMode
     * @param {Constants.DRAW_MODES} draw
     */
    this.setGraphicDrawMode = function(draw) {
        _drawMode = draw;
    };

    /**
     * setGraphicEnableDepthTest
     * @param {Bool} enable
     */
    this.setGraphicEnableDepthTest = function(enable) {
        _enableDepthTest = enable;
    };

    /**
     * setGraphicEnableBlend
     * @param {Bool} enable
     */
    this.setGraphicEnableBlend = function(enable) {
        _enableBlend = enable;
    };

    /**
     * setGraphicBlendEquation
     * @param {Constants.BLENDING_EQUATION_TYPES} equation
     */
    this.setGraphicBlendEquation = function(equation) {
        _blendEquation = equation;
    };

    /**
     * setGraphicBlendSrc
     * @param {Constants.BLENDING_MODES} blend
     */
    this.setGraphicBlendSrc = function(blend) {
        _blendSrc = blend;
    };

    /**
     * setGraphicBlendDst
     * @param {Constants.BLENDING_MODES} blend
     */
    this.setGraphicBlendDst = function(blend) {
        _blendDst = blend;
    };

    /**
     * onPreProcessGraphic
     * @param {Int} [graphicNum=0]
     * @param {Callback} fn
     */
    this.onPreProcessGraphic = function(graphicNum, fn) {
        this.gpufG.onPreProcessGraphic(graphicNum, fn);
    };

    /**
     * onPostProcessGraphic
     * @param {Int} [graphicNum=0]
     * @param {Callback} fn
     */
    this.onPostProcessGraphic = function(graphicNum, fn) {
        this.gpufG.onPostProcessGraphic(graphicNum, fn);
    };

    /**
     * tickVfp
     * @param {Node} [activeCamera=undefined]
     * @private
     */
    this.processGraphic = function(activeCamera) {
        var comp_screenEffects = activeCamera.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
        if(comp_screenEffects != undefined) {
            var resolution = activeCamera.getComponent(Constants.COMPONENT_TYPES.PROJECTION).getResolution();
            this.gl.viewport(0, 0, resolution.width, resolution.height);

            if(this.gpufG != null) {
                if(_enableDepthTest == true) {
                    this.gl.enable(this.gl.DEPTH_TEST);
                } else {
                    this.gl.disable(this.gl.DEPTH_TEST);
                    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
                }

                if(_enableBlend == true)
                    this.gl.enable(this.gl.BLEND);
                else
                    this.gl.disable(this.gl.BLEND);

                this.gl.blendFunc(this.gl[_blendSrc], this.gl[_blendDst]);
                this.gl.blendEquation(this.gl[_blendEquation]);

                this.gpufG.processGraphic(undefined, _drawMode);
            }
        } else console.log("ComponentScreenEffects not exists in camera");
    };

    /**
     * enableVfp
     * @param {Int} graphicNum
     */
    this.enableGraphic = function(graphicNum) {
        this.gpufG.enableGraphic(graphicNum);
    };

    /**
     * disableVfp
     * @param {Int} graphicNum
     */
    this.disableGraphic = function(graphicNum) {
        this.gpufG.disableGraphic(graphicNum);
    };



    // █████╗ ██████╗  ██████╗ ██╗   ██╗███╗   ███╗███████╗███╗   ██╗████████╗███████╗
    //██╔══██╗██╔══██╗██╔════╝ ██║   ██║████╗ ████║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
    //███████║██████╔╝██║  ███╗██║   ██║██╔████╔██║█████╗  ██╔██╗ ██║   ██║   ███████╗
    //██╔══██║██╔══██╗██║   ██║██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
    //██║  ██║██║  ██║╚██████╔╝╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   ███████║
    //╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝

    /**
     * @param {String} argument Argument to set
     * @param {Function} fnvalue
     * @param {Array<Float>} [splits=[array.length]]
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @returns {WebCLGLBuffer}
     */
    this.setArg = function(argument, fnvalue, splits, overrideDimensions) {
        var buff = this.gpufG.setArg(argument, fnvalue(), splits, overrideDimensions);
        this.args[argument] = {	"fnvalue": fnvalue,
            "updatable": null,
            "splits": splits,
            "overrideDimensions": overrideDimensions};

        return buff;
    };

    /**
     * getComponentBufferArg
     * @param {String} argument Argument to set
     * @param {ComponentRenderer} comp_renderer
     */
    this.getComponentBufferArg = function(argument, comp_renderer) {
        this.gpufG.getGPUForPointerArg(argument, comp_renderer.gpufG);
        this.args[argument] = {	"fnvalue": null,
            "updatable": null,
            "splits": null,
            "overrideDimensions": null};
    };

    /**
     * getArgs
     * @returns {Object}
     */
    this.getArgs = function() {
        return this.args;
    };

    /**
     * getAllArgs
     * @returns {Object}
     */
    this.getAllArgs = function() {
        return this.gpufG.getAllArgs();
    };

    /**
     * getBuffers
     * @returns {Array<WebCLGLBuffer>}
     */
    this.getBuffers = function() {
        return this.gpufG.getWork().buffers;
    };

    /**
     * clearArg
     * @param {String} argName
     * @param {Array<Float>} clearColor
     */
    this.clearArg = function(argName, clearColor) {
        this.gpufG.fillPointerArg(argName, clearColor);
    };

    /**
     * @param {String} argument Argument to set
     * @param {Bool} value
     */
    this.setArgUpdatable = function(argument, value) {
        this.args[argument].updatable = value;
    };

    /**
     * tickArguments
     * @private
     */
    this.tickArguments = function() {
        for(var key in this.args) {
            if(this.args[key].updatable == true) {
                var arg = this.args[key];
                this.gpufG.setArg(key, arg.fnvalue(), arg.splits, arg.overrideDimensions);
            }
        }
    };

};