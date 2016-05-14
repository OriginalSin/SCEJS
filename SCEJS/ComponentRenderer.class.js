/**
* @class
* @constructor
*/
ComponentRenderer = function() {
	Component.call(this);
	Component_GPU.call(this);
	"use strict";

	this.type = Constants.COMPONENT_TYPES.RENDERER;
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
	 * @param {Node} [activeCamera=undefined]
	 * @override
	 * @private
	 */
	this.tick = function(activeCamera) {
		this.tickArguments();
        this.processKernels(false);
        this.processGraphic(activeCamera);
	};

};
ComponentRenderer.prototype.constructor = ComponentRenderer;
