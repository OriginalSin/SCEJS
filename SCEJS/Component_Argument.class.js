/**
 * @class
 * @constructor
 */
Component_Argument = function() {
    "use strict";

    this.args = {};

    /**
     * setAllowKernelWriting
     * @param {String} argument
     */
    this.setAllowKernelWriting = function(argument) {
        this.clglWork.setAllowKernelWriting(argument);
    };

    /**
     * @param {String} argument Argument to set
     * @param {Function} fnvalue
     * @param {Array<Float>} [splits=[array.length]]
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @returns {WebCLGLBuffer}
     */
    this.setArg = function(argument, fnvalue, splits, overrideDimensions) {
        var buff = this.clglWork.setArg(argument, fnvalue(), splits, overrideDimensions);
        this.args[argument] = {	"fnvalue": fnvalue,
            "updatable": null,
            "splits": splits,
            "overrideDimensions": overrideDimensions};

        return buff;
    };

    /**
     * setSharedBufferArg
     * @param {String} argument Argument to set
     * @param {ComponentRenderer} comp_renderer
     */
    this.setSharedBufferArg = function(argument, comp_renderer) {
        this.clglWork.setSharedBufferArg(argument, comp_renderer.getWork());
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
        return this.clglWork.getAllArgs();
    };

    /**
     * getBuffers
     * @returns {Array<WebCLGLBuffer>}
     */
    this.getBuffers = function() {
        return this.clglWork.buffers;
    };

    /**
     * getTempBuffers
     * @returns {Array<WebCLGLBuffer>}
     */
    this.getTempBuffers = function() {
        return this.clglWork.buffers_TEMP;
    };

    /**
     * clearArg
     * @param {String} argName
     * @param {Array<Float>} clearColor
     */
    this.clearArg = function(argName, clearColor) {
        if(this.getBuffers()[argName].items[0].fBuffer == undefined) {
            this.getBuffers()[argName].items[0].createWebGLRenderBuffer();
            this.getBuffers()[argName].items[0].createWebGLFrameBuffer();
        }

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.getBuffers()[argName].items[0].fBuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.getBuffers()[argName].items[0].textureData, 0);

        if(clearColor != undefined)
            this.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    };

    /**
     * clearTempArg
     * @param {String} argName
     * @param {Array<Float>} clearColor
     */
    this.clearTempArg = function(argName, clearColor) {
        /*if(this.getTempBuffers()[argName] == undefined) {
         var buffTMP = this.webCLGL.createBuffer(this.getBuffers()[argName].length, this.getBuffers()[argName].type, this.clglWork.offset, false, this.getBuffers()[argName].mode, this.getBuffers()[argName].splits);
         //this.webCLGL.enqueueWriteBuffer(buffTMP, value);
         this.getTempBuffers()[argName] = buffTMP;
         }*/

        if(this.getTempBuffers().hasOwnProperty(argName) && this.getTempBuffers()[argName].items[0].fBuffer == undefined) {
            this.getTempBuffers()[argName].items[0].createWebGLRenderBuffer();
            this.getTempBuffers()[argName].items[0].createWebGLFrameBuffer();

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.getTempBuffers()[argName].items[0].fBuffer);
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.getTempBuffers()[argName].items[0].textureData, 0);
        }

        if(clearColor != undefined)
            this.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
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
                this.clglWork.setArg(key, arg.fnvalue(), arg.splits, arg.overrideDimensions);
            }
        }
    };

};