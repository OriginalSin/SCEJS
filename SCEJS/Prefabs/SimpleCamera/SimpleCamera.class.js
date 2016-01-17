/**
* @class
*/
SimpleCamera = function(sce, jsonIn) {	
	"use strict";
	
	var _sce = sce;
	var _project = _sce.getLoadedProject();
	
	
	var _onkeydown = (jsonIn != undefined && jsonIn.onkeydown != undefined) ? jsonIn.onkeydown: null;
	var _onkeyup = (jsonIn != undefined && jsonIn.onkeyup != undefined) ? jsonIn.onkeyup: null;
	
	var _onmousedown = (jsonIn != undefined && jsonIn.onmousedown != undefined) ? jsonIn.onmousedown: null;
	var _onmouseup = (jsonIn != undefined && jsonIn.onmouseup != undefined) ? jsonIn.onmouseup: null;
	var _onmousemove = (jsonIn != undefined && jsonIn.onmousemove != undefined) ? jsonIn.onmousemove: null;
	
	var altKeyPressed = false;
	
	var camera = new Node();
	camera.setName("simple camera");
	_project.getActiveStage().addNode(camera);
	_project.getActiveStage().setActiveCamera(camera);
	
	// ComponentTransformTarget 
	var comp_transformTarget = new ComponentTransformTarget();
	camera.addComponent(comp_transformTarget);
	comp_transformTarget.setTargetDistance(0.5);
	
	// ComponentProjection
	var comp_projection = new ComponentProjection();
	camera.addComponent(comp_projection);
	
	// ComponentControllerTransformTarget
	var comp_controllerTransformTarget = new ComponentControllerTransformTarget();
	camera.addComponent(comp_controllerTransformTarget);
	
	// ComponentScreenEffects
	var comp_screenEffects = new ComponentScreenEffects();
	camera.addComponent(comp_screenEffects);
	comp_screenEffects.addKernel({	"name": "RGB",
									"kernel": new SE_RGB(),
									"width": _sce.getCanvas().width,
									"height": _sce.getCanvas().height,
									"onPostTick": (function() {									
										comp_screenEffects.clearArg("RGB", [0.0, 0.0, 0.0, 1.0]);
									}).bind(this)});
	//_sce.setDimensions(_sce.getCanvas().width, _sce.getCanvas().height);
	
	// ComponentKeyboardEvents
	var comp_keyboardEvents = new ComponentKeyboardEvents();
	camera.addComponent(comp_keyboardEvents);
	comp_keyboardEvents.onkeydown((function(evt) {
		var key = String.fromCharCode(evt.keyCode);
		
		if(key == "W")
			comp_controllerTransformTarget.forward();
		if(key == "S")
			comp_controllerTransformTarget.backward();
		if(key == "A" || key == "%")
			comp_controllerTransformTarget.strafeLeft();
		if(key == "D" || key == "'")
			comp_controllerTransformTarget.strafeRight();
		if(key == "E" || key == "&")
			comp_controllerTransformTarget.strafeFront();
		if(key == "C" || key == "(")
			comp_controllerTransformTarget.strafeBack();
		
		if(key == "L")
			this.setView(Constants.VIEW_TYPES.LEFT);
		if(key == "R")
			this.setView(Constants.VIEW_TYPES.RIGHT);
		if(key == "F")
			this.setView(Constants.VIEW_TYPES.FRONT);
		if(key == "B")
			this.setView(Constants.VIEW_TYPES.BACK);
		if(key == "T")
			this.setView(Constants.VIEW_TYPES.TOP);
		
		if(key == "P")
			comp_projection.setProjection(Constants.PROJECTION_TYPES.PERSPECTIVE); 
		if(key == "O")
			comp_projection.setProjection(Constants.PROJECTION_TYPES.ORTHO); 
		
		if(evt.altKey == true)
			altKeyPressed = true;
		
		if(_onkeydown != null)
			_onkeydown();
	}).bind(this));
	comp_keyboardEvents.onkeyup(function(evt) {		
		var key = String.fromCharCode(evt.keyCode);
		
		if(key == "W")
			comp_controllerTransformTarget.stopForward();
		if(key == "S")
			comp_controllerTransformTarget.stopBackward();
		if(key == "A" || key == "%")
			comp_controllerTransformTarget.stopStrafeLeft();
		if(key == "D" || key == "'")
			comp_controllerTransformTarget.stopStrafeRight();
		if(key == "E" || key == "&")
			comp_controllerTransformTarget.stopStrafeFront();
		if(key == "C" || key == "(")
			comp_controllerTransformTarget.stopStrafeBack();
		
		if(evt.altKey == false)
			altKeyPressed = false;
		
		if(_onkeyup != null)
			_onkeyup();
	});			
	
	// ComponentMouseEvents 
	var comp_mouseEvents = new ComponentMouseEvents();
	camera.addComponent(comp_mouseEvents);
	comp_mouseEvents.onmousedown(function(evt) {
			comp_controllerTransformTarget.mouseDown(evt);
			
			if(_onmousedown != null)
				_onmousedown();
	});
	comp_mouseEvents.onmouseup(function(evt) {
			comp_controllerTransformTarget.mouseUp(evt);
			
			if(_onmouseup != null)
				_onmouseup();
	});
	comp_mouseEvents.onmousemove(function(evt, dir) {
		if(comp_projection.getProjection() == Constants.PROJECTION_TYPES.PERSPECTIVE || altKeyPressed == true)
			comp_controllerTransformTarget.mouseMove(evt);
		
		if(comp_controllerTransformTarget.isRightBtnActive() == true && comp_projection.getProjection() == Constants.PROJECTION_TYPES.ORTHO && altKeyPressed == true) {
			if(dir.e[2] > 0) {
				comp_projection.setFov(comp_projection.getFov()*(1.0+Math.abs(dir.e[2]*0.005)));				
			} else {
				comp_projection.setFov(comp_projection.getFov()/(1.0+Math.abs(dir.e[2]*0.005))); 
			}
			//comp_transformTarget.setPositionTarget(comp_transformTarget.getPositionTarget().add(dir.x(dir.e[2]))); 
			//comp_transformTarget.setPositionGoal(comp_transformTarget.getPositionGoal().add(dir.x(dir.e[2]))); 
		}
		
		if(_onmousemove != null)
			_onmousemove();
	});
	comp_mouseEvents.onmousewheel(function(evt, dir) {
		if(evt.wheelDeltaY >= 0)
			comp_projection.setFov(comp_projection.getFov()/1.1);
		else
			comp_projection.setFov(comp_projection.getFov()*1.1);
		
		if(comp_projection.getProjection() == Constants.PROJECTION_TYPES.ORTHO) {
			comp_transformTarget.setPositionTarget(comp_transformTarget.getPositionTarget().add(dir)); 
			comp_transformTarget.setPositionGoal(comp_transformTarget.getPositionGoal().add(dir)); 
		}
	});		
	
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
				comp_transformTarget.pitch(-89.9); 
				break;
			case Constants.VIEW_TYPES.BOTTOM:			
				comp_transformTarget.pitch(90);
				break;
		}
	};
	
	/**
	 * setVelocity
	 * @param {Float} velocity
	 */
	this.setVelocity = function(velocity) {
		comp_controllerTransformTarget.setVelocity(velocity);
	};
};