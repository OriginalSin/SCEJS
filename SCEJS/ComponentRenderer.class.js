/**
* @class
* @constructor
*/
ComponentRenderer = function() {
	Component.call(this);
	Component_Work.call(this); 
	Component_Kernel.call(this);
	Component_Vfp.call(this);
	Component_Argument.call(this);
	Component_Indices.call(this);
	"use strict";

	this.type = Constants.COMPONENT_TYPES.RENDERER;
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
	 * @param {Node} [activeCamera=undefined]
	 * @override
	 * @private
	 */
	this.tick = function(activeCamera) {
		this.tickArguments();
		this.tickKernels(false);
		this.tickVfps(activeCamera);
	};
};
ComponentRenderer.prototype.constructor = ComponentRenderer;
