/**
* @class
* @constructor
*/
Component_Vfp = function() {	
	"use strict";
	
	this.vfps = {};
	
	/**
	 * @param {Object} jsonIn	 
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
	* setVfpDrawMode
	* @param {String} name
	* @param {Constants.DRAW_MODES} draw
	*/
	this.setVfpDrawMode = function(name, draw) {
		this.vfps[name].drawMode = draw;
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
	
	/**
	 * tickVfp
	 * @param {Node} [activeCamera=undefined]
	 * @private
	 */
	this.tickVfps = function(activeCamera) {
		var comp_screenEffects = activeCamera.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
		if(comp_screenEffects != undefined) {
			var resolution = activeCamera.getComponent(Constants.COMPONENT_TYPES.PROJECTION).getResolution();
			this.gl.viewport(0, 0, resolution.width, resolution.height);

			for(var key in this.getVFPs()) {
				if(this.getVFPs()[key].enabled == true) {
					if(this.vfps[key].enableDepthTest == true) {
						this.gl.enable(this.gl.DEPTH_TEST);
					} else {
						this.gl.disable(this.gl.DEPTH_TEST);
						this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
					}

					if(this.vfps[key].enableBlend == true)
						this.gl.enable(this.gl.BLEND);
					else
						this.gl.disable(this.gl.BLEND);

					this.gl.blendFunc(this.gl[this.vfps[key].blendSrc], this.gl[this.vfps[key].blendDst]);
					this.gl.blendEquation(this.gl[this.vfps[key].blendEquation]);

					if(this.vfps[key].onPreTick != undefined)
						this.vfps[key].onPreTick();
					
					this.clglWork.enqueueVertexFragmentProgram(undefined, key, this.vfps[key].drawMode, this.vfps[key].geometryLength);

					if(this.vfps[key].onPostTick != undefined)
						this.vfps[key].onPostTick();
				}
			}
		} else console.log("ComponentScreenEffects not exists in camera");
	};
};