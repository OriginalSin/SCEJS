/**
* @class
* @constructor
*/
ComponentProjection = function() { Component.call(this);
	"use strict";
	
	this.type = Constants.COMPONENT_TYPES.PROJECTION;
	this.node = null;
	var gl = null;
	
	
	var mProjectionMatrix = $M16([1.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,1.0]);
	
	var proy = Constants.PROJECTION_TYPES.PERSPECTIVE;
	var _width = 512;
	var _height = 512;
	
	var _fov = 45;
	var _fovOrtho = 20;	
	
	var _near = 0.1;
    var _far = 10000;

	var _nearOrtho = -100000;
	var _farOrtho = 100000;
	
	
	/**
	 * initialize
	 * @param {Node} nod
	 * @param {WebGLRenderingContext} glCtx.
	 * @override
	 */
	this.initialize = function(nod, glCtx) {
		this.node = nod;
		gl = glCtx;
		
		updateProjectionMatrix();
	};	
	
	/**
	 * getMatrix
	 * @returns {StormM16}
	 */
	this.getMatrix = function() {
		return mProjectionMatrix;
	};
	
	/**
	 * getProjection
	 * @returns {Constants.PROJECTION_TYPES}
	 */
	this.getProjection = function() {
		return proy;
	};	
	
	/**
	 * setProjection
	 * @param {Constants.PROJECTION_TYPES} projection_type
	 */
	this.setProjection = function(projection_type) {
		proy = projection_type;
		updateProjectionMatrix();
	};	
	
	/**
	 * setResolution
	 * @param {Int} width
	 * @param {Int} height
	 */
	this.setResolution = function(width, height) {
		_width = width;
		_height = height;
		updateProjectionMatrix();
	};
	/**
	 * @typedef {Object} ComponentProjection~getResolution
	 * @property {Int} ComponentProjection~getResolution.width
	 * @property {Int} ComponentProjection~getResolution.height
	 */
	/**
	 * getResolution
	 * @returns {SCE~getDimensions}
	 */
	this.getResolution = function() {
		return {"width": _width,
				"height": _height};
	};
	/**
	 * setFov
	 * @param {Float} fov
	 */
	this.setFov = function(fov) {
		if(proy == Constants.PROJECTION_TYPES.PERSPECTIVE) _fov = fov;
		else _fovOrtho = fov;
		
		updateProjectionMatrix();
	};
	/**
	 * getFov
	 * @returns {Float}
	 */
	this.getFov = function() {
		if(proy == Constants.PROJECTION_TYPES.PERSPECTIVE) return _fov;
		else return _fovOrtho;
	};
	/**
	 * setNear
	 * @param {Float} near
	 */
	this.setNear = function(near) {
		if(proy == Constants.PROJECTION_TYPES.PERSPECTIVE) _near = near;
		else _nearOrtho = near;
		
		updateProjectionMatrix();
	};
	/**
	 * getNear
	 * @returns {Float}
	 */
	this.getNear = function() {
		if(proy == Constants.PROJECTION_TYPES.PERSPECTIVE) return _near;
		else return _nearOrtho;
	};
	/**
	 * setFar
	 * @param {Float} far
	 */
	this.setFar = function(far) {
		if(proy == Constants.PROJECTION_TYPES.PERSPECTIVE) _far = far;
		else _farOrtho = far;
		
		updateProjectionMatrix();
	};
	/**
	 * getFar
	 * @returns {Float}
	 */
	this.getFar = function() {
		if(proy == Constants.PROJECTION_TYPES.PERSPECTIVE) return _far;
		else return _farOrtho;
	};
	
	/**
	 * updateProjectionMatrix
	 * @private
	 */
	var updateProjectionMatrix = (function() {		
		var fovy = (proy == Constants.PROJECTION_TYPES.PERSPECTIVE) ? _fov : _fovOrtho;
		var aspect = _width / _height;
		
		if(proy == Constants.PROJECTION_TYPES.PERSPECTIVE)
			mProjectionMatrix = $M16().setPerspectiveProjection(fovy, aspect, _near, _far);
		else
			mProjectionMatrix = $M16().setOrthographicProjection(-aspect*fovy, aspect*fovy, -aspect*fovy, aspect*fovy, _nearOrtho, _farOrtho); 
	}).bind(this);
};
ComponentProjection.prototype = Object.create(Component.prototype);
ComponentProjection.prototype.constructor = ComponentProjection;