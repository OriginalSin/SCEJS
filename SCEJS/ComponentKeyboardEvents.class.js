/**
* @class
* @constructor
*/
ComponentKeyboardEvents = function() { Component.call(this);
	"use strict";
	
	this.type = Constants.COMPONENT_TYPES.KEYBOARD_EVENTS;
	this.node = null;
	var gl = null;
	
	this._onkeydown = null;
	this._onkeyup = null;
	
	/**
	 * initialize
	 * @param {Node} nod
	 * @param {WebGLRenderingContext} glCtx.
	 * @override
	 */
	this.initialize = function(nod, glCtx) {
		node = nod;
		gl = glCtx;
	};	
	
	/**
	 * @callback ComponentKeyboardEvents~onkeydown
	 * @param {KeyboardEvent} evt
	 */	
	/**
	 * onkeydown
	 * @param {ComponentKeyboardEvents~onkeydown} cb
	 */
	this.onkeydown = function(cb) {
		this._onkeydown = cb;
	};		
	
	/**
	 * @callback ComponentKeyboardEvents~onkeyup
	 * @param {KeyboardEvent} evt
	 */	
	/**
	 * onkeyup
	 * @param {ComponentKeyboardEvents~onkeyup} cb
	 */
	this.onkeyup = function(cb) {
		this._onkeyup = cb;
	};	
	
};
ComponentKeyboardEvents.prototype = Object.create(Component.prototype);
ComponentKeyboardEvents.prototype.constructor = ComponentKeyboardEvents;