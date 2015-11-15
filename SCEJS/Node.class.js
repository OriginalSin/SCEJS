/**
* @class
* @constructor
*/
Node = function() {
	"use strict";
	
	var components = {};
	
	this.onTick = null;
	var gl = null;
	
	var enabled = true;
	
	/**
	 * addComponent
	 * @param {Component} component
	 */
	this.addComponent = function(component) {
		components[component.type] = component;
		
		if(components[component.type].initialize != null)
			components[component.type].initialize(this, gl);
	};
	
	/**
	 * getComponent
	 * @param {Int} COMPONENT_TYPES
	 * @returns {Component}
	 */
	this.getComponent = function(COMPONENT_TYPES) {
		return components[COMPONENT_TYPES];
	};
	
	/**
	 * getComponents
	 * @returns {Object}
	 */
	this.getComponents = function() {
		return components;
	};
	
	/**
	* setEnabled
	* @param {Bool} enable.
	*/
	this.setEnabled = function(enable) {
		enabled = enable;
	};
	
	/**
	* setEnabled
	* @returns {Bool}
	*/
	this.isEnabled = function() {
		return enabled;
	};
	
	/**
	* setWebGLContext
	* @param {WebGLRenderingContext} glCtx.
	* @private
	*/
	this.setWebGLContext = function(glCtx) {
		gl = glCtx;
	};
};

