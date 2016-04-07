/**
* @class
* @constructor
*/
Component_Indices = function() {
	"use strict";
	
	/**
	* @param {Function} fnvalue
	* @param {Array<Float>} [splits=[array.length]]
	*/
	this.setIndices = function(fnvalue, splits) {
		this.clglWork.setIndices(fnvalue(), splits);
	};

	/**
	 * getIndices
	 * @returns {WebCLGLBuffer}
	 */
	this.getIndices = function() {
		return this.clglWork.CLGL_bufferIndices;
	};
	
};