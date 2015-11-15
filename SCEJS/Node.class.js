/**
* @class
* @constructor
*/
Node = function() {
	"use strict";
	
	var _components = {};
	var _name = null;
	var _gl = null;
	
	var _enabled = true;
	
	/**
	 * onTick
	 * 
	 */
	this.onTick = null;
	
	/**
	 * addComponent
	 * @param {Component} component
	 */
	this.addComponent = function(component) {
		_components[component.type] = component;
		
		if(_components[component.type].initialize != null)
			_components[component.type].initialize(this, _gl);
	};
	
	/**
	 * getComponent
	 * @param {COMPONENT_TYPES} COMPONENT_TYPES
	 * @returns {Component}
	 */
	this.getComponent = function(COMPONENT_TYPES) {
		return _components[COMPONENT_TYPES];
	};
	
	/**
	 * getComponents
	 * @returns {Object}
	 */
	this.getComponents = function() {
		return _components;
	};
	
	/**
	* setEnabled
	* @param {Bool} enable.
	*/
	this.setEnabled = function(enable) {
		_enabled = enable;
	};
	
	/**
	* setEnabled
	* @returns {Bool}
	*/
	this.isEnabled = function() {
		return _enabled;
	};
	
	/**
	* setName
	* @param {String} name.
	*/
	this.setName = function(name) {
		_name = name;
	};
	
	/**
	* getName
	* @returns {String}
	*/
	this.getName = function() {
		return _name;
	};
	
	/**
	* initialize
	* @param {String} name.
	* @param {WebGLRenderingContext} glCtx.
	* @private
	*/
	this.initialize = function(name, glCtx) {
		_name = name;
		_gl = glCtx;
	};
};

