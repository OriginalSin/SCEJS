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
	 * getWebCLGL
	 * @returns {WebCLGL}
	 */
	this.getWebCLGL = function() {
		return webCLGL;
	};
	
	/**
	 * @param {Object} jsonIn
	 * @param {String} jsonIn.name
	 * @param {VFP} jsonIn.vfp
	 * @param {String} jsonIn.seArgDestination
	 * @param {Int} [jsonIn.drawMode=4]
	 * @param {Callback} [jsonIn.onPostTick=undefined]
	 * @param {Constants.BLENDING_MODES} [jsonIn.blendSrc=undefined]
	 * @param {Constants.BLENDING_MODES} [jsonIn.blendDst=undefined]
	 */
	this.addVFP = function(jsonIn) {
		var arg = jsonIn.vfp.getSrc();
		var vfProgram = webCLGL.createVertexFragmentProgram();
		vfProgram.setVertexSource(arg[1][0], arg[0][0]);
		vfProgram.setFragmentSource(arg[3][0], arg[2][0]);
		clglWork.addVertexFragmentProgram(vfProgram, jsonIn.seArgDestination);
		
		vfProgram.argBufferDestination = jsonIn.seArgDestination;
		
		vfps[jsonIn.name] = {	"enabled": true,
								"vfp": vfProgram,
								"argBufferDestination": jsonIn.seArgDestination,
								"drawMode": jsonIn.drawMode,
								"onPostTick": jsonIn.onPostTick,
								"blendSrc": jsonIn.blendSrc,
								"blendDst": jsonIn.blendDst};
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
	 * addKernel
	 * @param {Object} jsonIn
	 * @param {KERNEL} jsonIn.kernel
	 * @param {String} jsonIn.argDestination
	 */
	this.addKernel = function(jsonIn) {
		var arg = jsonIn.kernel.getSrc();
		var kernel = webCLGL.createKernel();
		kernel.setKernelSource(arg[1][0], arg[0][0]);
		clglWork.addKernel(kernel, jsonIn.argDestination);
		
		kernels[jsonIn.name] = {"kernel": kernel,
								"argBufferDestination": jsonIn.argDestination};
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
	*/
	this.setArg = function(argument, fnvalue, splits) { 
		clglWork.setArg(argument, fnvalue(), splits);
		args[argument] = {	"fnvalue": fnvalue,
							"updatable": null,
							"splits": splits};
	};
	
	/**
	 * getArgs
	 * @returns {Object} 
	 */
	this.getArgs = function() {
		return args;
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
	* @param {String} argument Argument to set
	* @param {Bool} value
	*/
	this.setArgUpdatable = function(argument, value) {
		args[argument].updatable = value;
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
	* setBlendSrc
	* @param {String} name
	* @param {Constants.BLENDING_MODES} blend
	*/
	this.setBlendSrc = function(name, blend) {
		vfps[name].blendSrc = blend;
	};
	
	/**
	* setBlendDst
	* @param {String} name
	* @param {Constants.BLENDING_MODES} blend
	*/
	this.setBlendDst = function(name, blend) {
		vfps[name].blendDst = blend;
	};
	
	/**
	* setDrawMode
	* @param {String} name
	* @param {Constants.DRAW_MODES} draw
	*/
	this.setDrawMode = function(name, draw) {
		vfps[name].drawMode = draw;
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
				clglWork.setArg(key, args[key].fnvalue(), args[key].splits);
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
					
					if(vfps[key].blendSrc != undefined) {
						gl.enable(gl.BLEND);
						gl.blendFunc(gl[vfps[key].blendSrc], gl[vfps[key].blendDst]);
						gl.blendEquation(gl.FUNC_ADD); 
						gl.disable(gl.DEPTH_TEST);
						gl.clear(gl.DEPTH_BUFFER_BIT);
					}
					
					clglWork.enqueueVertexFragmentProgram(undefined, this.getVFPs()[key].argBufferDestination, (function() {}).bind(this), vfps[key].drawMode);
					
					if(vfps[key].blendSrc != undefined) {
						gl.disable(gl.BLEND);
						gl.enable(gl.DEPTH_TEST);
					}
					
					if(vfps[key].onPostTick != undefined)
						vfps[key].onPostTick();
				}
			}			
		} else console.log("ComponentScreenEffects not exists in camera"); 
	};	
};
ComponentRenderer.prototype = Object.create(Component.prototype);
ComponentRenderer.prototype.constructor = ComponentRenderer;