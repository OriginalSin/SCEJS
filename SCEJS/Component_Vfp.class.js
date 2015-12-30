/**
* @class
* @constructor
*/
Component_Vfp = function() {	
	"use strict";
	
	this.vfps = {};
	
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
		var vfProgram = this.webCLGL.createVertexFragmentProgram();
		vfProgram.setVertexSource(arg[1][0], arg[0][0]);
		vfProgram.setFragmentSource(arg[3][0], arg[2][0]);
		this.clglWork.addVertexFragmentProgram(vfProgram, jsonIn.name);

		this.vfps[jsonIn.name] = {	"enabled": true,
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
									"blendDst": ((jsonIn.blendDst != undefined) ? jsonIn.blendDst : Constants.BLENDING_MODES.ZERO)	};
	};
	
	/**
	* setVfpArgDestination
	* @param {String} vfpName
	* @param {String} [argDestination=undefined]
	*/
	this.setVfpArgDestination = function(vfpName, argDestination) {
		if(argDestination != undefined) {
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, argDestination.items[0].fBuffer);
			this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, argDestination.items[0].textureData, 0);
		} else {
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		}
	}; 
	
	/**
	 * getVFPs
	 * @returns {Object}
	 */
	this.getVFPs = function() {
		return this.vfps;
	};

	/**
	* enableVfp
	* @param {String} name
	*/
	this.enableVfp = function(name) {
		this.vfps[name].enabled = true;
	};

	/**
	* disableVfp
	* @param {String} name
	*/
	this.disableVfp = function(name) {
		this.vfps[name].enabled = false;
	};
	
	
	
	
	/**
	* setVfpEnableDepthTest
	* @param {String} name
	* @param {Bool} enable
	*/
	this.setVfpEnableDepthTest = function(name, enable) {
		this.vfps[name].enableDepthTest = enable;
	};

	/**
	* setVfpEnableBlend
	* @param {String} name
	* @param {Bool} enable
	*/
	this.setVfpEnableBlend = function(name, enable) {
		this.vfps[name].enableBlend = enable;
	};

	/**
	* setVfpBlendEquation
	* @param {String} name
	* @param {Constants.BLENDING_EQUATION_TYPES} equation
	*/
	this.setVfpBlendEquation = function(name, equation) {
		this.vfps[name].blendEquation = equation;
	};

	/**
	* setVfpBlendSrc
	* @param {String} name
	* @param {Constants.BLENDING_MODES} blend
	*/
	this.setVfpBlendSrc = function(name, blend) {
		this.vfps[name].blendSrc = blend;
	};

	/**
	* setVfpBlendDst
	* @param {String} name
	* @param {Constants.BLENDING_MODES} blend
	*/
	this.setVfpBlendDst = function(name, blend) {
		this.vfps[name].blendDst = blend;
	};
	
};