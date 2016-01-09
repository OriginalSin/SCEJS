/**
* @class
* @constructor
*/
SystemEvents = function(sce, target) {
	"use strict";

	var _sce = sce;
	var _project = _sce.getLoadedProject();
	var _target = target;

	var _utils = new Utils();

	var mousePosX_orig = 0;
	var mousePosY_orig = 0;
	var mousePosX = 0;
	var mousePosY = 0;
	var mouseOldPosX = 0;
	var mouseOldPosY = 0;
	var divPositionX = 0;
	var divPositionY = 0;
	var focused = false;


	/**
	 * initialize
	 */
	this.initialize = function() {
		document.body.addEventListener("keydown", keydownListener);
		document.body.addEventListener("keyup", keyupListener);
		_target.addEventListener("mousewheel", mousewheelListener);

		document.body.addEventListener("mouseup", mouseupListener, false);
		document.body.addEventListener("touchend", mouseupListener, false);
		_target.addEventListener("mousedown", mousedownListener, false);
		_target.addEventListener("touchstart", mousedownListener, false);
		document.body.addEventListener("mousemove", mousemoveListener, false);
		document.body.addEventListener("touchmove", mousemoveListener, false);

		_target.addEventListener("mouseover", (function() {
			focused = true;
		}).bind(this), false);
		_target.addEventListener("mouseleave", (function() {
			focused = false;
		}).bind(this), false);
	};

	/**
	 * getMousePosition
	 * @returns {{x: Int, y: Int}}
	 */
	this.getMousePosition = function() {
		return {"x": mousePosX, "y": mousePosY};
	};

	/**
	 * @param {Int} COMPONENT_TYPES
	 * @param {Int} EVENT_TYPES
	 * @param {Event} evt
	 * @private
	 */
	var callComponentEvent = (function(componentType, eventType, evt) {
		if(_project != undefined) {
			var stage = _project.getActiveStage();
			var comp_projection = stage.getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION);
			var dir = null;

			if(eventType == Constants.EVENT_TYPES.MOUSE_DOWN) {
				divPositionX = _utils.getElementPosition(_sce.getCanvas()).x;
				divPositionY = _utils.getElementPosition(_sce.getCanvas()).y;
				
				mousePosX = (evt.clientX - divPositionX);
				mousePosY = (evt.clientY - divPositionY);
				mousePosX_orig = mousePosX;
				mousePosY_orig = mousePosY;
				mouseOldPosX = mousePosX;
				mouseOldPosY = mousePosY;
			}
			if(eventType == Constants.EVENT_TYPES.MOUSE_MOVE) {
				mouseOldPosX = mousePosX;
				mouseOldPosY = mousePosY;
				mousePosX = (evt.clientX - divPositionX);
				mousePosY = (evt.clientY - divPositionY);
				
				dir = $V3([mousePosX-mousePosX_orig, 0.0, mousePosY-mousePosY_orig]);
			}
			if(eventType == Constants.EVENT_TYPES.MOUSE_WHEEL) {
				var currFov = comp_projection.getFov();
				var weightX = ((mousePosX-(_sce.getCanvas().width/2.0)) /_sce.getCanvas().width)*currFov*0.2;
				var weightY = ((mousePosY-(_sce.getCanvas().height/2.0)) /_sce.getCanvas().height)*currFov*0.2;				
				if(event.wheelDeltaY < 0) {					
					weightX *= -1.0;
					weightY *= -1.0;
				}
				
				var m = stage.getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix();
				var X = m.getLeft().x(weightX);
				var Y = m.getUp().x(weightY);
				dir = X.add(Y);
			}

			for(var n=0, fn = stage.getNodes().length; n < fn; n++) {
				for(var key in stage.getNodes()[n].getComponents()) {
					var component = stage.getNodes()[n].getComponent(key);
					if(component.type == componentType) {
						if(eventType == Constants.EVENT_TYPES.KEY_DOWN && component._onkeydown != null && focused == true)
							component._onkeydown(evt);

						if(eventType == Constants.EVENT_TYPES.KEY_UP && component._onkeyup != null)
							component._onkeyup(evt);

						if(eventType == Constants.EVENT_TYPES.MOUSE_DOWN && component._onmousedown != null)
							component._onmousedown(evt);

						if(eventType == Constants.EVENT_TYPES.MOUSE_UP && component._onmouseup != null)
							component._onmouseup(evt);

						if(eventType == Constants.EVENT_TYPES.MOUSE_MOVE && component._onmousemove != null)
							component._onmousemove(evt, dir);

						if(eventType == Constants.EVENT_TYPES.MOUSE_WHEEL && component._onmousewheel != null)
							component._onmousewheel(evt, dir);
					}
				}
			}
		}
	}).bind(this);

	var keydownListener = (function(evt) {
		callComponentEvent(Constants.COMPONENT_TYPES.KEYBOARD_EVENTS, Constants.EVENT_TYPES.KEY_DOWN, evt);
	}).bind(this);

	var keyupListener = (function(evt) {
		callComponentEvent(Constants.COMPONENT_TYPES.KEYBOARD_EVENTS, Constants.EVENT_TYPES.KEY_UP, evt);
	}).bind(this);

	var mousedownListener = (function(evt) {
		callComponentEvent(Constants.COMPONENT_TYPES.MOUSE_EVENTS, Constants.EVENT_TYPES.MOUSE_DOWN, evt);
	}).bind(this);

	var mouseupListener = (function(evt) {
		callComponentEvent(Constants.COMPONENT_TYPES.MOUSE_EVENTS, Constants.EVENT_TYPES.MOUSE_UP, evt);
	}).bind(this);

	var mousemoveListener = (function(evt) {
		callComponentEvent(Constants.COMPONENT_TYPES.MOUSE_EVENTS, Constants.EVENT_TYPES.MOUSE_MOVE, evt);
	}).bind(this);

	var mousewheelListener = (function(evt) {
		evt.preventDefault();

		callComponentEvent(Constants.COMPONENT_TYPES.MOUSE_EVENTS, Constants.EVENT_TYPES.MOUSE_WHEEL, evt);
	}).bind(this);
};
