/**
* @class
* @constructor
* @param {Object} jsonIn
* @param {Node} jsonIn.node
*/
ComponentControllerTransformTarget = function() { Component.call(this);
	"use strict";
	
	this.type = Constants.COMPONENT_TYPES.CONTROLLER_TRANSFORM_TARGET;
	this.node = null;
	var gl = null;
	
	
	var comp_transformTarget;
	var comp_projection;
	
	var forward = 0;
	var backward = 0;
	var left = 0;
	var right = 0;
	var front = 0;
	var back = 0;
	
	var leftButton = 0;
	var middleButton = 0;
	var rightButton = 0;
	
	
	var lastX = 0;
	var lastY = 0;
	
	var lockRotX = false;
	var lockRotY = false;
	
	
	/**
	 * initialize
	 * @param {Node} nod
	 * @param {WebGLRenderingContext} glCtx.
	 * @override
	 */
	this.initialize = function(nod, glCtx) {
		node = nod;
		gl = glCtx;
		
		comp_transformTarget = node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET);
		comp_projection = node.getComponent(Constants.COMPONENT_TYPES.PROJECTION);
	};	
	
	/**
	 * lockRotX
	 */
	this.lockRotX = function() {
		lockRotX = true;
	};
	/**
	 * unlockRotX
	 */
	this.unlockRotX = function() {
		lockRotX = false;
	};
	/**
	 * isLockRotX
	 * @returns {Boolean}
	 */
	this.isLockRotX = function() {
		return lockRotX;
	};
	
	/**
	 * lockRotY
	 */
	this.lockRotY = function() {
		lockRotY = true;
	};
	
	/**
	 * unlockRotY
	 */
	this.unlockRotY = function() {
		lockRotY = false;
	};
	
	/**
	 * isLockRotY
	 * @returns {Boolean}
	 */
	this.isLockRotY = function() {
		return lockRotY;
	};
	
	/**
	 * forward
	 */
	this.forward = function() {
		forward = 1;
	};
	
	/**
	 * backward
	 */
	this.backward = function() {
		backward = 1;
	};
	
	/**
	 * strafeLeft
	 */
	this.strafeLeft = function() {
		left = 1;
	};
	
	/**
	 * strafeRight
	 */
	this.strafeRight = function() {
		right = 1;
	};
	
	/**
	 * strafeFront
	 */
	this.strafeFront = function() {
		front = 1;
	};
	
	/**
	 * strafeBack
	 */
	this.strafeBack = function() {
		back = 1;
	};
	
	/**
	 * stopForward
	 */
	this.stopForward = function() {
		forward = 0;
	};
	
	/**
	 * stopBackward
	 */
	this.stopBackward = function() {
		backward = 0;
	};
	
	/**
	 * stopStrafeLeft
	 */
	this.stopStrafeLeft = function() {
		left = 0;
	};
	
	/**
	 * stopStrafeRight
	 */
	this.stopStrafeRight = function() {
		right = 0;
	};
	
	/**
	 * stopStrafeFront
	 */
	this.stopStrafeFront = function() {
		front = 0;
	};
	
	/**
	 * stopStrafeBack
	 */
	this.stopStrafeBack = function() {
		back = 0;
	};

	this.mouseDown = function(event) {
		lastX = event.screenX;
		lastY = event.screenY;
		
		if(event.button == 0) // LEFT BUTTON
			leftButton = 1;
		if(event.button == 1) // MIDDLE BUTTON
			middleButton = 1;
		if(event.button == 2) // RIGHT BUTTON
			rightButton = 1;
		
		updateGoal(event);
	};

	this.mouseUp = function(event) {
		if(event.button == 0) // LEFT BUTTON
			leftButton = 0;
		if(event.button == 1) // MIDDLE BUTTON
			middleButton = 0;
		if(event.button == 2) // RIGHT BUTTON
			rightButton = 0;
	};

	this.mouseMove = function(event) {
		if(leftButton == 1 || middleButton == 1)
			updateGoal(event);
	};

	

	/**
	* @param {Float} elapsed
	* @private  
	* @override
	*/
	this.tick = function(elapsed) {	
		var dir = $V3([0.0, 0.0, 0.0]);
		if(forward == 1)
			dir = dir.add(comp_transformTarget.getMatrix().inverse().getForward().x(-1.0));
		if(backward == 1)
			dir = dir.add(comp_transformTarget.getMatrix().inverse().getForward());
		if(left == 1)
			dir = dir.add(comp_transformTarget.getMatrix().inverse().getLeft().x(-1.0));
		if(right == 1)
			dir = dir.add(comp_transformTarget.getMatrix().inverse().getLeft());
		if(back == 1)
			dir = dir.add(comp_transformTarget.getMatrix().inverse().getUp().x(-1.0));
		if(front == 1)
			dir = dir.add(comp_transformTarget.getMatrix().inverse().getUp());
		
		comp_transformTarget.setPositionTarget(comp_transformTarget.getPositionTarget().add(dir));
		comp_transformTarget.setPositionGoal(comp_transformTarget.getPositionGoal().add(dir));
	};

	/** @private */
	var updateGoal = function(event) {
		if(middleButton == 1) {
			event.preventDefault(); 
			var X = comp_transformTarget.getMatrix().getLeft().x((lastX - event.screenX)*(comp_projection.getFov()*0.005));
			var Y = comp_transformTarget.getMatrix().getUp().x((lastY - event.screenY)*(comp_projection.getFov()*-0.005));  
			var dir = X.add(Y.x(-1.0));
			comp_transformTarget.setPositionGoal(comp_transformTarget.getPositionGoal().add(dir));
			comp_transformTarget.setPositionTarget(comp_transformTarget.getPositionTarget().add(dir));
		} else {
			var factorRot = 0.5;
			if(lockRotY == false) {
				if(lastX > event.screenX) {
					comp_transformTarget.yaw(-(lastX - event.screenX)*factorRot);
				} else {
					comp_transformTarget.yaw((event.screenX - lastX)*factorRot);
				}
			}
			if(lockRotX == false) {
				if(lastY > event.screenY) {
					comp_transformTarget.pitch((lastY - event.screenY)*factorRot);
				} else {
					comp_transformTarget.pitch(-(event.screenY - lastY)*factorRot);
				}
			}
		}
		lastX = event.screenX;
		lastY = event.screenY;
	};
};
ComponentControllerTransformTarget.prototype = Object.create(Component.prototype);
ComponentControllerTransformTarget.prototype.constructor = ComponentControllerTransformTarget;