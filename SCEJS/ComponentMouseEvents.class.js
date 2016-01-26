/**
* @class
* @constructor
*/
ComponentMouseEvents = function() { Component.call(this);
	"use strict";
	
	this.type = Constants.COMPONENT_TYPES.MOUSE_EVENTS;
	this.node = null;
	var gl = null;
	
	
	this._onmousedown = null;	
	this._onmouseup = null;	
	this._onmousemove = null;	
	this._onmousewheel = null;
	
	
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
	 * @callback ComponentMouseEvents~onmousedown
	 * @param {MouseEvent} evt
	 */	
	/**
	 * onmousedown
	 * @param {ComponentMouseEvents~onmousedown} cb
	 */
	this.onmousedown = function(cb) {
		this._onmousedown = cb;
	};	
	
	/**
	 * @callback ComponentMouseEvents~onmouseup
	 * @param {MouseEvent} evt
	 */	
	/**
	 * onmousedown
	 * @param {ComponentMouseEvents~onmouseup} cb
	 */
	this.onmouseup = function(cb) {
		this._onmouseup = cb;
	};	
	
	/**
	 * @callback ComponentMouseEvents~onmousemove
	 * @param {MouseEvent} evt
	 * @param {StormV3} dir
	 */	
	/**
	 * onmousedown
	 * @param {ComponentMouseEvents~onmousemove} cb
	 */
	this.onmousemove = function(cb) {
		this._onmousemove = cb;
	};	
	
	/**
	 * @callback ComponentMouseEvents~onmousewheel
	 * @param {MouseWheelEvent} evt
	 * @param {StormV3} dir
	 */	
	/**
	 * onmousedown
	 * @param {ComponentMouseEvents~onmousewheel} cb
	 */
	this.onmousewheel = function(cb) {
		this._onmousewheel = cb;
	};	
};
ComponentMouseEvents.prototype = Object.create(Component.prototype);
ComponentMouseEvents.prototype.constructor = ComponentMouseEvents;