/**
* @class
* @constructor
*/
Stage = function() {
	"use strict";
	
	var nodes = [];
	var activeCamera = null;
	var selectedNode = null;
	var paused = false;
	var backgroundColor = [0.0, 0.0, 0.0, 1.0];
	var gl = null;
	var _ontick;
	
	/**
	 * setActiveCamera
	 * @param {Node} node
	 */
	this.setActiveCamera = function(node) {
		activeCamera = node;
	};
	
	/**
	 * getActiveCamera
	 * @returns {Node}
	 */
	this.getActiveCamera = function() {
		return activeCamera;
	};
	
	/**
	 * setSelectedNode
	 * @param {Node} node
	 */
	this.setSelectedNode = function(node) {
		selectedNode = node;
	};
	
	/**
	 * getSelectedNode
	 * @returns {Node}
	 */
	this.getSelectedNode = function() {
		return selectedNode;
	};
	
	/**
	* addNode
	* @param {Node} node.
	*/
	this.addNode = function(node) {
		nodes.push(node);
		
		node.initialize(((node.getName() != null) ? node.getName() : "node "+(nodes.length-1)), gl);
	};
	
	/**
	* removeNode
	* @param {Node} node.
	*/
	this.removeNode = function(node) {
		for(var n=0; n < nodes.length; n++) {
			if(nodes[n] == node) {
				nodes.splice(n, 1);
				break;
			}
		}
	};
		
	/**
	* getNodes
	* @returns {Array<Nodes>}
	*/
	this.getNodes = function() {
		return nodes;
	};
	
	/**
	* render
    * @param {Callback} ontick
	*/
	this.render = function(ontick) {
    	_ontick = ontick;
		paused = false;
		this.setBackgroundColor(backgroundColor);
		tick();
	};
	
	/**
	* pause
	*/
	this.pause = function() {
		paused = true;
	};
	
	/**
	* setWebGLContext
	* @param {WebGLRenderingContext} glCtx.
	* @private
	*/
	this.setWebGLContext = function(glCtx) {
		gl = glCtx;
	};
	
	/**
	* setBackgroundColor
	* @param {Array<Float4>} color.
	*/
	this.setBackgroundColor = function(color) {
		backgroundColor = color;
	};
	
	/**
	* getBackgroundColor
	* @returns {Array<Float4>}
	*/
	this.getBackgroundColor = function() {
		return backgroundColor;
	};
	
	/**
	* getWebGLContext
	* @returns {WebGLRenderingContext} 
	*/
	this.getWebGLContext = function() {
		return gl;
	};
	
	/**
	 * tick
	 * @private
	 */
	var tick = (function() {
		if(activeCamera != null) {
            if(_ontick != undefined)
                _ontick();

			var resolution = activeCamera.getComponent(Constants.COMPONENT_TYPES.PROJECTION).getResolution();
			gl.viewport(0, 0, resolution.width, resolution.height);

			gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);
			gl.clearDepth(1.0);
			//gl.enable(gl.DEPTH_TEST);
            //gl.enable(gl.CULL_FACE);
            //gl.cullFace(gl.BACK);
			gl.depthFunc(gl.LEQUAL);

			var comp_camera_gpu = activeCamera.getComponent(Constants.COMPONENT_TYPES.GPU);
			if(comp_camera_gpu != undefined)
                comp_camera_gpu.gpufG.fillArg("RGB", [backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]]);

			for(var n=0, fn = nodes.length; n < fn; n++) {
			    if(nodes[n] != activeCamera) {
                    for(var key in nodes[n].getComponents()) {
                        var component = nodes[n].getComponent(key);

                        if(component.tick != null)
                            component.tick();
                    }

                    if(nodes[n].onTick != null)  nodes[n].onTick();
                }
			}

            for(var n=0, fn = nodes.length; n < fn; n++) {
                if(nodes[n] != activeCamera) {
                    for(var key in nodes[n].getComponents()) {
                        var component = nodes[n].getComponent(key);

                        if(component.gpufG != null) {
                            for(var keyB in component.gpufG.vertexFragmentPrograms) {
                                var vfp = component.gpufG.vertexFragmentPrograms[keyB];

                                var ob = new WebCLGLUtils().getOutputBuffers(vfp, component.gpufG._argsValues);
                                if(vfp.enabled == true && ob != null) {
                                    component.gpufG._gl.bindFramebuffer(component.gpufG._gl.FRAMEBUFFER, ob[0].fBuffer);
                                    component.gpufG._gl.clear(component.gpufG._gl.DEPTH_BUFFER_BIT);
                                    component.gpufG._gl.bindFramebuffer(component.gpufG._gl.FRAMEBUFFER, ob[0].fBufferTemp);
                                    component.gpufG._gl.clear(component.gpufG._gl.DEPTH_BUFFER_BIT);
                                }
                            }
                        }
                    }
                }
            }

            for(var key in activeCamera.getComponents()) {
                var component = activeCamera.getComponent(key);

                if(component.tick != null)
                    component.tick();
            }
		}
		if(paused == false) window.requestAnimFrame(tick);
	}).bind(this);
};

