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
	comp_keyboardEvents.onkeydown = function(evt) {
		if(String.fromCharCode(evt.keyCode) == "W")
			comp_controllerTransformTarget.forward();
		if(String.fromCharCode(evt.keyCode) == "S")
			comp_controllerTransformTarget.backward();
		if(String.fromCharCode(evt.keyCode) == "A")
			comp_controllerTransformTarget.strafeLeft();
		if(String.fromCharCode(evt.keyCode) == "D")
			comp_controllerTransformTarget.strafeRight();
	};
	comp_keyboardEvents.onkeyup = function(evt) {
		comp_controllerTransformTarget.stop();
	};			
	
	// ComponentMouseEvents 
	var comp_mouseEvents = new ComponentMouseEvents();
	camera.addComponent(comp_mouseEvents);
	comp_mouseEvents.onmousedown = function(evt) {
		comp_controllerTransformTarget.mouseDown(evt);
	};
	comp_mouseEvents.onmouseup = function(evt) {
		comp_controllerTransformTarget.mouseUp(evt);
	};
	comp_mouseEvents.onmousemove = function(evt) {
		comp_controllerTransformTarget.mouseMove(evt);
	};
	comp_mouseEvents.onmousewheel = function(evt) {
		comp_controllerTransformTarget.mouseWheel(evt);
	};			
};