/**
* @class
* @constructor
*/
Component_Argument = function() {
	"use strict";
	
	this.args = {};
	
	/**
	* @param {String} argument Argument to set
	* @param {Function} fnvalue
	* @param {Array<Float>} [splits=[array.length]]
	* @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
    * @returns {WebCLGLBuffer}
	*/
	this.setArg = function(argument, fnvalue, splits, overrideDimensions) {
	    if(fnvalue.writeWebGLBuffer != undefined) {
            this.args[argument] = {	"fnvalue": fnvalue,
                "updatable": null,
                "splits": splits,
                "overrideDimensions": overrideDimensions};

            return this.clglWork.setArg(argument, fnvalue, splits, overrideDimensions);
        } else {
            var buff = this.clglWork.setArg(argument, fnvalue(), splits, overrideDimensions);
            this.args[argument] = {	"fnvalue": fnvalue,
                "updatable": null,
                "splits": splits,
                "overrideDimensions": overrideDimensions};

            return buff;
        }
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
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.getTempBuffers()[argName].items[0].fBuffer);						
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.getTempBuffers()[argName].items[0].textureData, 0);
		
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