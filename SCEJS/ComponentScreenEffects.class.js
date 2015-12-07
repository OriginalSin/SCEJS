/**
* @class
* @constructor
*/
ComponentScreenEffects = function() { Component.call(this);
	"use strict";
	
	this.type = Constants.COMPONENT_TYPES.SCREEN_EFFECTS;
	this.node = null;
	var gl = null;
	
	var webCLGL;
	var clglWork;
	
	var args = {};
	
	/**
	 * initialize
	 * @param {Node} nod
	 * @param {WebGLRenderingContext} glCtx.
	 * @override
	 * @private
	 */
	this.initialize = function(nod, glCtx) {
		node = nod;
		gl = glCtx;
		
		webCLGL = new WebCLGL(gl);
		var offset = 1000.0;
		clglWork = webCLGL.createWork(offset);	
	};	

	/**
	 * @param {Object} jsonIn
	 * @param {SE} jsonIn.se
	 * @param {Int} jsonIn.width
	 * @param {Int} jsonIn.height
	 */
	this.addSE = function(jsonIn) {
		var source = jsonIn.se.getSrc();
		var kernel = webCLGL.createKernel(); 
		kernel.setKernelSource(source[1][0], source[0][0]);				
		clglWork.addKernel(kernel, undefined); // undefined=output to principal buffer
		
		for(var n=0, fn=jsonIn.se.dependencies.length; n < fn; n++)
			this.setArg(jsonIn.se.dependencies[n], function(){return new Float32Array(jsonIn.width*jsonIn.height*4);}, undefined, [jsonIn.width, jsonIn.height]);
	};
	
	
	/**
	* @param {String} argument Argument to set
	* @param {Function} fnvalue
	* @param {Array<Float>} [splits=[array.length]]
	* @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
	*/
	this.setArg = function(argument, fnvalue, splits, overrideDimensions) {
		clglWork.setArg(argument, fnvalue(), splits, overrideDimensions);
		args[argument] = {	"fnvalue": fnvalue,
							"updatable": null,
							"splits": splits,
							"overrideDimensions": overrideDimensions};
	};
	
	/**
	 * getBuffers
	 * @returns {Array<WebCLGLBuffer>}
	 */
	this.getBuffers = function() {
		return clglWork.buffers;
	};
	
	/**
	 * tick
	 * @override
	 * @private
	 */
	this.tick = function() {
		for(var key in args) {
			if(args[key].updatable == true) {
				var arg = args[key];
				clglWork.setArg(key, arg.fnvalue(), arg.splits, arg.overrideDimensions);
			}
		}
		clglWork.enqueueNDRangeKernel();
		
		for(var key in this.getBuffers()) {			
			var destArg = this.getBuffers()[key];
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, destArg.items[0].fBuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, destArg.items[0].textureData, 0);
			
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
		}		
	};	
};
ComponentScreenEffects.prototype = Object.create(Component.prototype);
ComponentScreenEffects.prototype.constructor = ComponentScreenEffects;