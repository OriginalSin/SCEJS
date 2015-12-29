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
	var kernels = {};
	
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
	 * @param {String} jsonIn.name
	 * @param {Int} jsonIn.width
	 * @param {Int} jsonIn.height
	 * @param {Callback} [jsonIn.onPreTick=undefined]
	 * @param {Callback} [jsonIn.onPostTick=undefined]
	 * @param {Bool} [enableDepthTest=true]
	 * @param {Bool} [enableBlend=false]
	 * @param {Constants.BLENDING_EQUATION_TYPES} [jsonIn.blendEquation=Constants.BLENDING_EQUATION_TYPES.FUNC_ADD]
	 * @param {Constants.BLENDING_MODES} [jsonIn.blendSrc=Constants.BLENDING_MODES.ONE]
	 * @param {Constants.BLENDING_MODES} [jsonIn.blendDst=Constants.BLENDING_MODES.ZERO]
	 */
	this.addSE = function(jsonIn) {
		var source = jsonIn.se.getSrc();
		var kernel = webCLGL.createKernel(); 
		kernel.setKernelSource(source[1][0], source[0][0]);				
		clglWork.addKernel(kernel, jsonIn.name); // undefined=output to principal buffer
		
		kernels[jsonIn.name] = {"enabled": true,
								"kernel": kernel,
								"name": jsonIn.name,
								"onPreTick": jsonIn.onPreTick,
								"onPostTick": jsonIn.onPostTick,
								"enableDepthTest": ((jsonIn.enableDepthTest != undefined) ? jsonIn.enableDepthTest : true),
								"enableBlend": ((jsonIn.enableBlend != undefined) ? jsonIn.enableBlend : false),
								"blendEquation": ((jsonIn.blendEquation != undefined) ? jsonIn.blendEquation : Constants.BLENDING_EQUATION_TYPES.FUNC_ADD),
								"blendSrc": ((jsonIn.blendSrc != undefined) ? jsonIn.blendSrc : Constants.BLENDING_MODES.ONE),
								"blendDst": ((jsonIn.blendDst != undefined) ? jsonIn.blendDst : Constants.BLENDING_MODES.ZERO)};
		
		for(var n=0, fn=jsonIn.se.dependencies.length; n < fn; n++)
			this.setArg(jsonIn.se.dependencies[n], function(){return new Float32Array(jsonIn.width*jsonIn.height*4);}, undefined, [jsonIn.width, jsonIn.height]);
	};
	
	/**
	 * getKernels
	 * @returns {Object}
	 */
	this.getKernels = function() {
		return kernels;
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
	* setSharedBufferArg
	* @param {String} argument Argument to set
	* @param {ComponentRenderer} comp_renderer
	*/
	this.setSharedBufferArg = function(argument, comp_renderer) {
		clglWork.setSharedBufferArg(argument, comp_renderer.getWork());
		args[argument] = {	"fnvalue": null,
							"updatable": null,
							"splits": null,
							"overrideDimensions": null};
	};
	
	/**
	 * getBuffers
	 * @returns {Array<WebCLGLBuffer>}
	 */
	this.getBuffers = function() {
		return clglWork.buffers;
	};
	
	/**
	 * getTempBuffers
	 * @returns {Array<WebCLGLBuffer>}
	 */
	this.getTempBuffers = function() {
		return clglWork.buffers_TEMP;
	};

	/**
	 * clearArg
	 * @param {String} argName
	 * @param {Array<Float>} clearColor
	 */
	this.clearArg = function(argName, clearColor) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.getBuffers()[argName].items[0].fBuffer);						
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.getBuffers()[argName].items[0].textureData, 0);
		
		if(clearColor != undefined)
			gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	};
	
	/**
	 * clearTempArg
	 * @param {String} argName
	 * @param {Array<Float>} clearColor
	 */
	this.clearTempArg = function(argName, clearColor) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.getTempBuffers()[argName].items[0].fBuffer);						
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.getTempBuffers()[argName].items[0].textureData, 0);
		
		if(clearColor != undefined)
			gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
		
		
		
		
		
		for(var key in this.getKernels()) {
			if(this.getKernels()[key].enabled == true) {
				var kernel = this.getKernels()[key];
				
				if(kernel.enableDepthTest == true) {
					gl.enable(gl.DEPTH_TEST);
				} else {
					gl.disable(gl.DEPTH_TEST);
					gl.clear(gl.DEPTH_BUFFER_BIT);
				}

				if(kernel.enableBlend == true)
					gl.enable(gl.BLEND);
				else
					gl.disable(gl.BLEND);

				gl.blendFunc(gl[kernel.blendSrc], gl[kernel.blendDst]);
				gl.blendEquation(gl[kernel.blendEquation]);
				
				
				if(kernel.onPreTick != undefined)
					kernel.onPreTick();
				
				clglWork.enqueueNDRangeKernel(key, undefined);
				
				if(this.getKernels()[key].onPostTick != undefined)
					this.getKernels()[key].onPostTick();
			}
		}
	};	
};
ComponentScreenEffects.prototype = Object.create(Component.prototype);
ComponentScreenEffects.prototype.constructor = ComponentScreenEffects;