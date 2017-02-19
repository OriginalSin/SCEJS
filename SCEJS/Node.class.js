/**
* @class
* @constructor
*/
Node = function() {
	"use strict";

    this._components = {};
	this._name = null;
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
        this._components[component.type] = component;
		
		if(this._components[component.type].initialize != null)
            this._components[component.type].initialize(this, _gl);
	};
	
	/**
	 * getComponent
	 * @param {COMPONENT_TYPES} type
	 * @returns {Component}
	 */
	this.getComponent = function(type) {
		return this._components[type];
	};
	
	/**
	 * getComponents
	 * @returns {Object}
	 */
	this.getComponents = function() {
		return this._components;
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
        this._name = name;
	};
	
	/**
	* getName
	* @returns {String}
	*/
	this.getName = function() {
        return this._name;
	};
	
	/**
	* initialize
	* @param {String} name.
	* @param {WebGLRenderingContext} glCtx.
	* @private
	*/
	this.initialize = function(name, glCtx) {
        this._name = name;
		_gl = glCtx;
	};
};

