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
	 * @param {String} jsonIn.name
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
	
};
