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
	 * getWork
	 * @returns {WebCLGLWork}
	 */
	this.getWork = function() {
		return clglWork;
	};

	/**
	 * @param {Object} jsonIn	 * 
	 * @param {VFP} jsonIn.vfp
	 * @param {String} jsonIn.name
	 * @param {Int} [jsonIn.drawMode=4]
	 * @param {Int} [jsonIn.geometryLength=1]
	 * @param {Callback} [jsonIn.onPreTick=undefined]
	 * @param {Callback} [jsonIn.onPostTick=undefined]
	 * @param {Bool} [enableDepthTest=true]
	 * @param {Bool} [enableBlend=false]
	 * @param {Constants.BLENDING_EQUATION_TYPES} [jsonIn.blendEquation=Constants.BLENDING_EQUATION_TYPES.FUNC_ADD]
	 * @param {Constants.BLENDING_MODES} [jsonIn.blendSrc=Constants.BLENDING_MODES.ONE]
	 * @param {Constants.BLENDING_MODES} [jsonIn.blendDst=Constants.BLENDING_MODES.ZERO]
	 */
	this.addVFP = function(jsonIn) {
		var arg = jsonIn.vfp.getSrc();
		var vfProgram = webCLGL.createVertexFragmentProgram();
		vfProgram.setVertexSource(arg[1][0], arg[0][0]);
		vfProgram.setFragmentSource(arg[3][0], arg[2][0]);
		clglWork.addVertexFragmentProgram(vfProgram, jsonIn.name);

		vfps[jsonIn.name] = {	"enabled": true,
								"vfp": vfProgram,
								"name": jsonIn.name,
								"drawMode": jsonIn.drawMode,
								"geometryLength": jsonIn.geometryLength,
								"onPreTick": jsonIn.onPreTick,
								"onPostTick": jsonIn.onPostTick,
								"enableDepthTest": ((jsonIn.enableDepthTest != undefined) ? jsonIn.enableDepthTest : true),
								"enableBlend": ((jsonIn.enableBlend != undefined) ? jsonIn.enableBlend : false),
								"blendEquation": ((jsonIn.blendEquation != undefined) ? jsonIn.blendEquation : Constants.BLENDING_EQUATION_TYPES.FUNC_ADD),
								"blendSrc": ((jsonIn.blendSrc != undefined) ? jsonIn.blendSrc : Constants.BLENDING_MODES.ONE),
								"blendDst": ((jsonIn.blendDst != undefined) ? jsonIn.blendDst : Constants.BLENDING_MODES.ZERO)
							};
	};
	
	/**
	* setVfpArgDestination
	* @param {String} vfpName
	* @param {String} [argDestination=undefined]
	*/
	this.setVfpArgDestination = function(vfpName, argDestination) {
		if(argDestination != undefined) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, argDestination.items[0].fBuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, argDestination.items[0].textureData, 0);
		} else {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
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
	 * @param {String} jsonIn.name
	 * @param {Callback} [jsonIn.onPreTick=undefined]
	 * @param {Callback} [jsonIn.onPostTick=undefined]
	 * @param {Bool} [enableDepthTest=true]
	 * @param {Bool} [enableBlend=false]
	 * @param {Constants.BLENDING_EQUATION_TYPES} [jsonIn.blendEquation=Constants.BLENDING_EQUATION_TYPES.FUNC_ADD]
	 * @param {Constants.BLENDING_MODES} [jsonIn.blendSrc=Constants.BLENDING_MODES.ONE]
	 * @param {Constants.BLENDING_MODES} [jsonIn.blendDst=Constants.BLENDING_MODES.ZERO]
	 */
	this.addKernel = function(jsonIn) {
		var arg = jsonIn.kernel.getSrc();
		var kernel = webCLGL.createKernel();
		kernel.setKernelSource(arg[1][0], arg[0][0]);
		clglWork.addKernel(kernel, jsonIn.name);

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
	};

	/**
	 * getKernels
	 * @returns {Object}
	 */
	this.getKernels = function() {
		return kernels;
	};

	/**
	* setArg
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
	* setSharedBufferArg
	* @param {String} argument Argument to set
	* @param {ComponentRenderer} comp_renderer
	*/
	this.setSharedBufferArg = function(argument, comp_renderer) {
		clglWork.setSharedBufferArg(argument, comp_renderer.getWork());
		args[argument] = {	"fnvalue": null,
							"updatable": null,
							"splits": null};
	};

	/**
	 * getArgs
	 * @returns {Object}
	 */
	this.getArgs = function() {
		return args;
	};

	/**
	 * getAllArgs
	 * @returns {Object}
	 */
	this.getAllArgs = function() {
		return clglWork.getAllArgs();
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
	* setEnableDepthTest
	* @param {String} name
	* @param {Bool} enable
	*/
	this.setEnableDepthTest = function(name, enable) {
		vfps[name].enableDepthTest = enable;
	};

	/**
	* setEnableBlend
	* @param {String} name
	* @param {Bool} enable
	*/
	this.setEnableBlend = function(name, enable) {
		vfps[name].enableBlend = enable;
	};

	/**
	* setBlendEquation
	* @param {String} name
	* @param {Constants.BLENDING_EQUATION_TYPES} equation
	*/
	this.setBlendEquation = function(name, equation) {
		vfps[name].blendEquation = equation;
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
				
				clglWork.enqueueNDRangeKernel(key, this.getTempBuffers()[this.getKernels()[key].name]);	
				
				if(this.getKernels()[key].onPostTick != undefined)
					this.getKernels()[key].onPostTick();
			}
		}


		var comp_screenEffects = activeCamera.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
		if(comp_screenEffects != undefined) {
			var resolution = activeCamera.getComponent(Constants.COMPONENT_TYPES.PROJECTION).getResolution();
			gl.viewport(0, 0, resolution.width, resolution.height);

			for(var key in this.getVFPs()) {
				if(this.getVFPs()[key].enabled == true) {
					if(vfps[key].enableDepthTest == true) {
						gl.enable(gl.DEPTH_TEST);
					} else {
						gl.disable(gl.DEPTH_TEST);
						gl.clear(gl.DEPTH_BUFFER_BIT);
					}

					if(vfps[key].enableBlend == true)
						gl.enable(gl.BLEND);
					else
						gl.disable(gl.BLEND);

					gl.blendFunc(gl[vfps[key].blendSrc], gl[vfps[key].blendDst]);
					gl.blendEquation(gl[vfps[key].blendEquation]);

					if(vfps[key].onPreTick != undefined)
						vfps[key].onPreTick();
					
					clglWork.enqueueVertexFragmentProgram(undefined, this.getVFPs()[key].name, vfps[key].drawMode, vfps[key].geometryLength);

					if(vfps[key].onPostTick != undefined)
						vfps[key].onPostTick();
				}
			}
		} else console.log("ComponentScreenEffects not exists in camera");
	};
};
ComponentRenderer.prototype = Object.create(Component.prototype);
ComponentRenderer.prototype.constructor = ComponentRenderer;
