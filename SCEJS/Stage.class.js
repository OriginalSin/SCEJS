/**
* @class
* @constructor
*/
Stage = function() {
	"use strict";
	
	var nodes = [];
	var activeCamera = null;
	var selectedNode = null;
	var gl = null;
	
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
		
		node.setWebGLContext(gl);
	};
		
	/**
	* getNodes
	* @returns {Array<Nodes>}
	*/
	this.getNodes = function() {
		return nodes;
	};
	
	/**
	* initialize
	*/
	this.render = function() {
		tick();
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
	 * tick
	 * @private
	 */
	var tick = (function() {
		if(activeCamera != null) {
			gl.viewport(0, 0, 512, 512);
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.clearDepth(1.0);
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
			
			for(var n=0, fn = nodes.length; n < fn; n++) {
				for(var key in nodes[n].getComponents()) {
					var component = nodes[n].getComponent(key);
					
					if(component.tick != null && component.type != Constants.COMPONENT_TYPES.SCREEN_EFFECTS)
						component.tick(activeCamera);
				}
				
				if(nodes[n].onTick != null)  nodes[n].onTick();
			}
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
			
			if(activeCamera.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS) != undefined)
				activeCamera.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS).tick();
		}
		window.requestAnimFrame(tick);
	}).bind(this);
};

