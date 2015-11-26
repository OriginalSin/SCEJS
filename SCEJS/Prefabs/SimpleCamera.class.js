/**
* @class
*/
SimpleCamera = function(sce) {	
	"use strict";
	
	var _sce = sce;
	var _project = _sce.getLoadedProject();
	
	var camera = new Node();
	_project.getActiveStage().addNode(camera);
	_project.getActiveStage().setActiveCamera(camera);
	
	// ComponentTransformTarget 
	var comp_transformTarget = new ComponentTransformTarget();
	camera.addComponent(comp_transformTarget);
	
	// ComponentControllerTransformTarget
	var comp_controllerTransformTarget = new ComponentControllerTransformTarget();
	camera.addComponent(comp_controllerTransformTarget);
	
	// ComponentProjection
	var comp_projection = new ComponentProjection();
	camera.addComponent(comp_projection);
		
	// ComponentScreenEffects
	var comp_screenEffects = new ComponentScreenEffects();
	camera.addComponent(comp_screenEffects);
	comp_screenEffects.addSE(new SE_RGB(), _sce.getCanvas().width, _sce.getCanvas().height);
	//_sce.setDimensions(_sce.getCanvas().width, _sce.getCanvas().height);
	
	// ComponentKeyboardEvents
	var comp_keyboardEvents = new ComponentKeyboardEvents();
	camera.addComponent(comp_keyboardEvents);
	comp_keyboardEvents.onkeydown = (function(evt) {
		if(String.fromCharCode(evt.keyCode) == "W")
			comp_controllerTransformTarget.forward();
		if(String.fromCharCode(evt.keyCode) == "S")
			comp_controllerTransformTarget.backward();
		if(String.fromCharCode(evt.keyCode) == "A" || String.fromCharCode(evt.keyCode) == "%")
			comp_controllerTransformTarget.strafeLeft();
		if(String.fromCharCode(evt.keyCode) == "D" || String.fromCharCode(evt.keyCode) == "'")
			comp_controllerTransformTarget.strafeRight();
		if(String.fromCharCode(evt.keyCode) == "E" || String.fromCharCode(evt.keyCode) == "&")
			comp_controllerTransformTarget.strafeFront();
		if(String.fromCharCode(evt.keyCode) == "C" || String.fromCharCode(evt.keyCode) == "(")
			comp_controllerTransformTarget.strafeBack();
		
		if(String.fromCharCode(evt.keyCode) == "L")
			this.setView(Constants.VIEW_TYPES.LEFT);
		if(String.fromCharCode(evt.keyCode) == "R")
			this.setView(Constants.VIEW_TYPES.RIGHT);
		if(String.fromCharCode(evt.keyCode) == "F")
			this.setView(Constants.VIEW_TYPES.FRONT);
		if(String.fromCharCode(evt.keyCode) == "B")
			this.setView(Constants.VIEW_TYPES.BACK);
		if(String.fromCharCode(evt.keyCode) == "T")
			this.setView(Constants.VIEW_TYPES.TOP);
		
		if(String.fromCharCode(evt.keyCode) == "P")
			comp_projection.setProjection(Constants.PROJECTION_TYPES.PERSPECTIVE); 
	}).bind(this);
	comp_keyboardEvents.onkeyup = function(evt) {		
		if(String.fromCharCode(evt.keyCode) == "W")
			comp_controllerTransformTarget.stopForward();
		if(String.fromCharCode(evt.keyCode) == "S")
			comp_controllerTransformTarget.stopBackward();
		if(String.fromCharCode(evt.keyCode) == "A" || String.fromCharCode(evt.keyCode) == "%")
			comp_controllerTransformTarget.stopStrafeLeft();
		if(String.fromCharCode(evt.keyCode) == "D" || String.fromCharCode(evt.keyCode) == "'")
			comp_controllerTransformTarget.stopStrafeRight();
		if(String.fromCharCode(evt.keyCode) == "E" || String.fromCharCode(evt.keyCode) == "&")
			comp_controllerTransformTarget.stopStrafeFront();
		if(String.fromCharCode(evt.keyCode) == "C" || String.fromCharCode(evt.keyCode) == "(")
			comp_controllerTransformTarget.stopStrafeBack();
	};			
	
	// ComponentMouseEvents 
	var comp_mouseEvents = new ComponentMouseEvents();
	camera.addComponent(comp_mouseEvents);
	comp_mouseEvents.onmousedown = function(evt) {
		if(comp_projection.getProjection() == Constants.PROJECTION_TYPES.PERSPECTIVE)
			comp_controllerTransformTarget.mouseDown(evt);
	};
	comp_mouseEvents.onmouseup = function(evt) {
		if(comp_projection.getProjection() == Constants.PROJECTION_TYPES.PERSPECTIVE)
			comp_controllerTransformTarget.mouseUp(evt);
	};
	comp_mouseEvents.onmousemove = function(evt, dir) {
		if(comp_projection.getProjection() == Constants.PROJECTION_TYPES.PERSPECTIVE)
			comp_controllerTransformTarget.mouseMove(evt);
	};
	comp_mouseEvents.onmousewheel = function(evt, dir) {
		if(evt.wheelDeltaY >= 0)
			comp_projection.setFov(comp_projection.getFov()/1.1);
		else
			comp_projection.setFov(comp_projection.getFov()*1.1);
		
		if(comp_projection.getProjection() == Constants.PROJECTION_TYPES.ORTHO) {
			comp_transformTarget.setPositionTarget(comp_transformTarget.getPositionTarget().add(dir)); 
			comp_transformTarget.setPositionGoal(comp_transformTarget.getPositionGoal().add(dir)); 
		}
	};		
	
	/**
	* Set side view. This change the projection to orthographic.
	* @param {Constants.VIEW_TYPES} view 
	 */
	this.setView = function(view) {
		comp_projection.setProjection(Constants.PROJECTION_TYPES.ORTHO); 
		comp_transformTarget.reset();
		switch(view) {
			case Constants.VIEW_TYPES.LEFT:
				comp_transformTarget.yaw(90);
				break;
			case Constants.VIEW_TYPES.RIGHT:			
				comp_transformTarget.yaw(-90);
				break;
			case Constants.VIEW_TYPES.FRONT:
				//comp_transformTarget.getMatrix().setRotation(new Utils().degToRad(0),false,$V3([0.0,1.0,0.0]));
				break;
			case Constants.VIEW_TYPES.BACK:			
				//comp_transformTarget.getMatrix().setRotation(new Utils().degToRad(180),false,$V3([0.0,1.0,0.0]));
				break;
			case Constants.VIEW_TYPES.TOP:
				comp_transformTarget.pitch(-90);
				break;
			case Constants.VIEW_TYPES.BOTTOM:			
				comp_transformTarget.pitch(90);
				break;
		}
	};
};