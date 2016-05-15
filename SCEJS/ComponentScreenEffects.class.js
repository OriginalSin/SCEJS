/**
* @class
* @constructor
*/
ComponentScreenEffects = function() { 
	Component.call(this);
    Component_GPU.call(this);
	"use strict";
	
	this.type = Constants.COMPONENT_TYPES.SCREEN_EFFECTS;
	this.node = null;


    this.gl;


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
	};	
	
	/**
	 * tick
	 * @override
	 * @private
	 */
	this.tick = function() {
		this.tickArguments();
        this.processKernels(true);
	};

};
ComponentScreenEffects.prototype.constructor = ComponentScreenEffects;