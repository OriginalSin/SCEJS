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
            if(_ontick != undefined)
                _ontick();

			var resolution = activeCamera.getComponent(Constants.COMPONENT_TYPES.PROJECTION).getResolution();
			gl.viewport(0, 0, resolution.width, resolution.height);

			gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);
			gl.clearDepth(1.0);
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
			
			var comp_screen_effects = activeCamera.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS); 
			/*if(comp_screen_effects != undefined)
				comp_screen_effects.clearArg("RGB", [backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]]);*/
			
			for(var n=0, fn = nodes.length; n < fn; n++) {
				for(var key in nodes[n].getComponents()) {
					var component = nodes[n].getComponent(key);

					if(component.tick != null && component.type != Constants.COMPONENT_TYPES.SCREEN_EFFECTS)
						component.tick(activeCamera);
				}
				
				if(nodes[n].onTick != null)  nodes[n].onTick();
			}

			if(comp_screen_effects != undefined) {
				//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
				comp_screen_effects.tick();
			}
		}
		if(paused == false) window.requestAnimFrame(tick);
	}).bind(this);
};

