/**
* @class
* @constructor
*/
ComponentRenderer = function() { Component.call(this);
	"use strict";
	
	this.type = Constants.COMPONENT_TYPES.RENDERER;
	this.node = null;
	var gl = null;
	
	var webCLGL;
	var clglWork;
	
	var args = {};
	var vfps = {};
	
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
	 * getWebCLGL
	 * @returns {WebCLGL}
	 */
	this.getWebCLGL = function() {
		return webCLGL;
	};
	
	/**
	 * @param {String} name
	 * @param {VFP} vfp
	 * @param {String} seArgDestination
	 * @param {Int} drawMode
	 * @param {Function} onPostTick
	 */
	this.addVFP = function(name, vfp, seArgDestination, drawMode, onPostTick) {
		var arg = vfp.getSrc();
		var vfProgram = webCLGL.createVertexFragmentProgram();
		vfProgram.setVertexSource(arg[1][0], arg[0][0]);
		vfProgram.setFragmentSource(arg[3][0], arg[2][0]);
		clglWork.addVertexFragmentProgram(vfProgram, seArgDestination);
		
		vfProgram.argBufferDestination = seArgDestination;
		
		vfps[name] = {	"enabled": true,
						"vfp": vfProgram,
						"argBufferDestination": seArgDestination,
						"drawMode": drawMode,
						"onPostTick": onPostTick};
	};
	
	/**
	 * getVFPs
	 * @returns {Object}
	 */
	this.getVFPs = function() {
		return vfps;
	};
	
	/**
	* enableVfp
	* @param {String} name
	*/
	this.enableVfp = function(name) {
		vfps[name].enabled = true;
	};
	
	/**
	* disableVfp
	* @param {String} name
	*/
	this.disableVfp = function(name) {
		vfps[name].enabled = false;
	};
	
	/**
	 * @param {KERNEL} k
	 * @param {String} argDestination
	 */
	this.addKernel = function(k, argDestination) {
		var arg = k.getSrc();
		var kernel = webCLGL.createKernel();
		kernel.setKernelSource(arg[1][0], arg[0][0]);
		clglWork.addKernel(kernel, argDestination);
	};
	
	/**
	* @param {String} argument Argument to set
	* @param {Function} fnvalue
	* @param {Array<Float>} [splits=[array.length]]
	*/
	this.setArg = function(argument, fnvalue, splits) {
		clglWork.setArg(argument, fnvalue(), splits);
		args[argument] = {	"fnvalue": fnvalue,
							"updatable": null};
	};
	
	/**
	 * getArgs
	 * @returns {Object} 
	 */
	this.getArgs = function() {
		return args;
	};
	
	/**
	* @param {String} argument Argument to set
	* @param {Bool} value
	*/
	this.setArgUpdatable = function(argument, value) {
		args[argument].updatable = value;
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
	* @param {Function} fnvalue 
	* @param {Array<Float>} [splits=[array.length]]
	*/
	this.setIndices = function(fnvalue, splits) {
		clglWork.setIndices(fnvalue(), splits); 
	};
	
	/**
	 * getIndices
	 * @returns {WebCLGLBuffer}
	 */
	this.getIndices = function() {
		return clglWork.CLGL_bufferIndices;
	};
	
	/**
	 * tick
	 * @param {Node} [activeCamera=undefined]
	 * @override
	 * @private
	 */
	this.tick = function(activeCamera) {
		for(var key in args) {
			if(args[key].updatable == true) {
				clglWork.setArg(key, args[key].fnvalue());
			}
		}
		
		clglWork.enqueueNDRangeKernel();
			
		
		var comp_screenEffects = activeCamera.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
		if(comp_screenEffects != undefined) {	
			var resolution = activeCamera.getComponent(Constants.COMPONENT_TYPES.PROJECTION).getResolution();
			gl.viewport(0, 0, resolution.width, resolution.height);
			
			for(var key in this.getVFPs()) {
				if(this.getVFPs()[key].enabled == true) {
					var destArg = comp_screenEffects.getBuffers()[this.getVFPs()[key].vfp.argBufferDestination];	
					if(destArg != undefined) {
						gl.bindFramebuffer(gl.FRAMEBUFFER, destArg.items[0].fBuffer);
						gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, destArg.items[0].textureData, 0);
					} else {
						gl.bindFramebuffer(gl.FRAMEBUFFER, null);
					}
					clglWork.enqueueVertexFragmentProgram(undefined, this.getVFPs()[key].argBufferDestination, (function() {}).bind(this), vfps[key].drawMode);
					
					if(vfps[key].onPostTick != undefined)
						vfps[key].onPostTick();
				}
			}
		} else console.log("ComponentScreenEffects not exists in camera"); 
	};	
};
ComponentRenderer.prototype = Object.create(Component.prototype);
ComponentRenderer.prototype.constructor = ComponentRenderer;