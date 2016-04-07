/**
* @class
* @constructor
*/
Component_Work = function() {
	"use strict";
	
	this.gl = null;
	this.webCLGL;
	this.clglWork;
	
	/**
	 * initWebCLGLWork
	 * @param {WebGLRenderingContext} glCtx.
	 */
	this.initWebCLGLWork = function(glCtx) {
		this.gl = glCtx;

		this.webCLGL = new WebCLGL(this.gl);
		var offset = 1000.0;
		this.clglWork = this.webCLGL.createWork(offset);
	};

	/**
	 * getWebCLGL
	 * @returns {WebCLGL}
	 */
	this.getWebCLGL = function() {
		return this.webCLGL;
	};
	
	/**
	 * getWork
	 * @returns {WebCLGLWork}
	 */
	this.getWork = function() {
		return this.clglWork;
	};
	
};