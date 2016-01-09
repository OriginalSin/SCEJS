/**
* @class
* @constructor
*/
ComponentScreenEffects = function() { 
	Component.call(this);
	Component_Work.call(this);
	Component_Kernel.call(this);
	Component_Argument.call(this);
	"use strict";
	
	this.type = Constants.COMPONENT_TYPES.SCREEN_EFFECTS;
	this.node = null;
	
	
	/**
	 * initialize
	 * @param {Node} nod
	 * @param {WebGLRenderingContext} glCtx.
	 * @override
	 * @private
	 */
	this.initialize = function(nod, glCtx) {
		node = nod;
		this.gl = glCtx;

		this.initWebCLGLWork(glCtx);
	};	
	
	/**
	 * tick
	 * @override
	 * @private
	 */
	this.tick = function() {
		this.tickArguments();
		this.tickKernels(true);
	};	
};
ComponentScreenEffects.prototype.constructor = ComponentScreenEffects;