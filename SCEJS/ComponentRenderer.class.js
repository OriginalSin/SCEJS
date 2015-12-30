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
	* setVfpDrawMode
	* @param {String} name
	* @param {Constants.DRAW_MODES} draw
	*/
	this.setVfpDrawMode = function(name, draw) {
		this.vfps[name].drawMode = draw;
	};

	/**
	 * tick
	 * @param {Node} [activeCamera=undefined]
	 * @override
	 * @private
	 */
	this.tick = function(activeCamera) {
		for(var key in this.args) {
			if(this.args[key].updatable == true) {
				var arg = this.args[key];
				this.clglWork.setArg(key, arg.fnvalue(), arg.splits, arg.overrideDimensions);
			}
		}

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
				
				this.clglWork.enqueueNDRangeKernel(key, this.getTempBuffers()[this.getKernels()[key].name]);	
				
				if(this.getKernels()[key].onPostTick != undefined)
					this.getKernels()[key].onPostTick();
			}
		}


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
					
					this.clglWork.enqueueVertexFragmentProgram(undefined, this.getVFPs()[key].name, this.vfps[key].drawMode, this.vfps[key].geometryLength);

					if(this.vfps[key].onPostTick != undefined)
						this.vfps[key].onPostTick();
				}
			}
		} else console.log("ComponentScreenEffects not exists in camera");
	};
};
ComponentRenderer.prototype.constructor = ComponentRenderer;
