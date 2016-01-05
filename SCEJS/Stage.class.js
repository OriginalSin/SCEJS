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
	* getNodes
	* @returns {Array<Nodes>}
	*/
	this.getNodes = function() {
		return nodes;
	};
	
	/**
	* render
	*/
	this.render = function() {
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
		gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);
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
			var resolution = activeCamera.getComponent(Constants.COMPONENT_TYPES.PROJECTION).getResolution();
			gl.viewport(0, 0, resolution.width, resolution.height);
			 
			gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);
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
						
			if(activeCamera.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS) != undefined) {
				//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
				activeCamera.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS).tick();
			}
		}
		if(paused == false) window.requestAnimFrame(tick);
	}).bind(this);
};

