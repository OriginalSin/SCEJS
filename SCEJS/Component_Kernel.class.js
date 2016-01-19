/**
* @class
* @constructor
*/
Component_Kernel = function() {
	"use strict";

	this.kernels = {};
	
	/**
	 * addKernel
	 * @param {Object} jsonIn
	 * @param {KERNEL} jsonIn.kernel
	 * @param {String} jsonIn.name - Used only for identify. not for output to buffer (ScreenEffect output always to 'null')
	 * @param {Int} [jsonIn.geometryLength=1]
	 * @param {Int} [jsonIn.width]
	 * @param {Int} [jsonIn.height]
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
		var kernel = this.webCLGL.createKernel();
		kernel.setKernelSource(arg[1][0], arg[0][0]);
		this.clglWork.addKernel(kernel, jsonIn.name);

		this.kernels[jsonIn.name] = {	"enabled": true,
										"kernel": kernel,
										"name": jsonIn.name,
										"geometryLength": jsonIn.geometryLength,
										"onPreTick": jsonIn.onPreTick,
										"onPostTick": jsonIn.onPostTick,
										"enableDepthTest": ((jsonIn.enableDepthTest != undefined) ? jsonIn.enableDepthTest : true),
										"enableBlend": ((jsonIn.enableBlend != undefined) ? jsonIn.enableBlend : false),
										"blendEquation": ((jsonIn.blendEquation != undefined) ? jsonIn.blendEquation : Constants.BLENDING_EQUATION_TYPES.FUNC_ADD),
										"blendSrc": ((jsonIn.blendSrc != undefined) ? jsonIn.blendSrc : Constants.BLENDING_MODES.ONE),
										"blendDst": ((jsonIn.blendDst != undefined) ? jsonIn.blendDst : Constants.BLENDING_MODES.ZERO)};
		
		if(jsonIn.kernel.dependencies != undefined) {
			for(var n=0, fn=jsonIn.kernel.dependencies.length; n < fn; n++)
				this.setArg(jsonIn.kernel.dependencies[n], function(){return new Float32Array(jsonIn.width*jsonIn.height*4);}, undefined, [jsonIn.width, jsonIn.height]);
		}
	};

	/**
	 * getKernels
	 * @returns {Object}
	 */
	this.getKernels = function() {
		return this.kernels;
	};

	/**
	* enableKernel
	* @param {String} name
	*/
	this.enableKernel = function(name) {
		this.kernels[name].enabled = true;
	};

	/**
	* disableKernel
	* @param {String} name
	*/
	this.disableKernel = function(name) {
		this.kernels[name].enabled = false;
	};
	
	
	
	
	/**
	* setKernelEnableDepthTest
	* @param {String} name
	* @param {Bool} enable
	*/
	this.setKernelEnableDepthTest = function(name, enable) {
		this.kernels[name].enableDepthTest = enable;
	};

	/**
	* setKernelEnableBlend
	* @param {String} name
	* @param {Bool} enable
	*/
	this.setKernelEnableBlend = function(name, enable) {
		this.kernels[name].enableBlend = enable;
	};

	/**
	* setKernelBlendEquation
	* @param {String} name
	* @param {Constants.BLENDING_EQUATION_TYPES} equation
	*/
	this.setKernelBlendEquation = function(name, equation) {
		this.kernels[name].blendEquation = equation;
	};

	/**
	* setKernelBlendSrc
	* @param {String} name
	* @param {Constants.BLENDING_MODES} blend
	*/
	this.setKernelBlendSrc = function(name, blend) {
		this.kernels[name].blendSrc = blend;
	};

	/**
	* setKernelBlendDst
	* @param {String} name
	* @param {Constants.BLENDING_MODES} blend
	*/
	this.setKernelBlendDst = function(name, blend) {
		this.kernels[name].blendDst = blend;
	};
	
	/**
	 * tickKernels
	 * @param {Bool} [isScreenEffects=false]
	 * @private
	 */
	this.tickKernels = function(isScreenEffects) {
		for(var key in this.getKernels()) {
			if(this.getKernels()[key].enabled == true) {
				var kernel = this.getKernels()[key];
				
				if(kernel.enableDepthTest == true) {
					this.gl.enable(this.gl.DEPTH_TEST);
				} else {
					this.gl.disable(this.gl.DEPTH_TEST);
					this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
				}

				if(kernel.enableBlend == true)
					this.gl.enable(this.gl.BLEND);
				else
					this.gl.disable(this.gl.BLEND);

				this.gl.blendFunc(this.gl[kernel.blendSrc], this.gl[kernel.blendDst]);
				this.gl.blendEquation(this.gl[kernel.blendEquation]);
				
				
				if(kernel.onPreTick != undefined)
					kernel.onPreTick();
				
				var buffDest = (isScreenEffects != undefined && isScreenEffects == true) ? null : this.getTempBuffers()[this.getKernels()[key].name];
				this.clglWork.enqueueNDRangeKernel(key, buffDest, kernel.geometryLength);	
				
				if(this.getKernels()[key].onPostTick != undefined)
					this.getKernels()[key].onPostTick();
			}
		}
	};
};
