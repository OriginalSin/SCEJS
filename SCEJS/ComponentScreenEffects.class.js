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
				
				this.clglWork.enqueueNDRangeKernel(key, undefined); 
				
				if(this.getKernels()[key].onPostTick != undefined)
					this.getKernels()[key].onPostTick();
			}
		}
	};	
};
ComponentScreenEffects.prototype.constructor = ComponentScreenEffects;