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

        this.gpufG.processKernels();

        var comp_screenEffects = activeCamera.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
        if(comp_screenEffects != undefined) {
            var resolution = activeCamera.getComponent(Constants.COMPONENT_TYPES.PROJECTION).getResolution();
            this.gl.viewport(0, 0, resolution.width, resolution.height);

            if(this.gpufG != null)
                this.gpufG.processGraphic(undefined);
        } else console.log("ComponentScreenEffects not exists in camera");
	};

};
ComponentRenderer.prototype.constructor = ComponentRenderer;
