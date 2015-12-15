/*
The MIT License (MIT)

Copyright (c) <2010> <Roberto Gonzalez. http://stormcolour.appspot.com/>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

//***********
// APP CLASSES
//***********
var sceDirectory = document.querySelector('script[src$="SCE.class.js"]').getAttribute('src');
var page = sceDirectory.split('/').pop(); 
sceDirectory = sceDirectory.replace('/'+page,"");

var includesF = ['/StormMath.class.js',
                '/Utils.class.js',
				'/WebCLGLUtils.class.js',
				'/WebCLGLBuffer.class.js',
				'/WebCLGLBufferItem.class.js',
				'/WebCLGLKernel.class.js',
				'/WebCLGLKernelProgram.class.js',
				'/WebCLGLVertexFragmentProgram.class.js',
				'/WebCLGLWork.class.js', 
				'/WebCLGL.class.js',
				'/VFP.class.js',
				'/VFP_RGB.class.js',
				'/SE.class.js',
				'/SE_RGB.class.js',
				'/ArrayGenerator.class.js',
                '/Mesh.class.js',
                '/Constants.js',
                '/SystemEvents.class.js',
				'/Component.class.js',
				'/ComponentTransform.class.js',
				'/ComponentTransformTarget.class.js',
				'/ComponentControllerTransformTarget.class.js',
				'/ComponentProjection.class.js',
				'/ComponentRenderer.class.js',
				'/ComponentScreenEffects.class.js',
				'/ComponentKeyboardEvents.class.js',
				'/ComponentMouseEvents.class.js',
				'/Node.class.js',
				'/Stage.class.js',
				'/Project.class.js',
				'/UI/UI.class.js',
				'/UI/PanelStage.class.js',
				'/UI/PanelNode.class.js',
				'/UI/PanelNumberGenerator.class.js',
				'/UI/UIComponentRenderer.class.js'];
for(var n = 0, f = includesF.length; n < f; n++) document.write('<script type="text/javascript" src="'+sceDirectory+includesF[n]+'"></script>');

//***********
//UI LIBRARIES
//***********
//CSS
if(window.jQuery == undefined) {
	document.write('<link rel="stylesheet" type="text/css" href="'+sceDirectory+'/UI/JQuery/ui/jquery-ui.min.css" />');
}
document.write('<link rel="stylesheet" type="text/css" href="'+sceDirectory+'/UI/style.css" />');
document.write('<link rel="stylesheet" type="text/css" href="'+sceDirectory+'/UI/fileMenu/fileMenu.css" />');
document.write('<link rel="stylesheet" type="text/css" href="'+sceDirectory+'/UI/stormPanel/stormPanel.css" />');

//JS
if(window.jQuery == undefined) {
	document.write('<script type="text/javascript" src="'+sceDirectory+'/UI/JQuery/jquery-1.11.3.js"></script>');	
	document.write('<script type="text/javascript" src="'+sceDirectory+'/UI/JQuery/ui/jquery-ui.min.js"></script>');
}
document.write('<script type="text/javascript" src="'+sceDirectory+'/UI/fileMenu/fileMenu.js"></script>');
document.write('<script type="text/javascript" src="'+sceDirectory+'/UI/stormPanel/stormPanel.js"></script>');
document.write('<script type="text/javascript" src="'+sceDirectory+'/UI/ActionHelpers.class.js"></script>');

/**
* Engine contructor
* @class
* @constructor
*/
SCE = function() {	
	"use strict";
			
	var target = null,
	project = null,	
	dimensions = null,
	canvas = null,
	gl = null,
	_UI = null,
	_events = null;
	
	/**
	* Init WebGL Context
	* @type Void
	* @param {Object} jsonIn
	* @param {HTMLDivElement} jsonIn.target
	* @param {Object} [jsonIn.dimensions={width: Int, height: Int}]
	*/
	this.initialize = function(jsonIn) {
		target = (jsonIn != undefined && jsonIn.target != undefined) ? jsonIn.target : undefined;
		dimensions = (jsonIn != undefined && jsonIn.dimensions != undefined) ? jsonIn.dimensions : {"width": 512, "height": 512};
			
		if(target != null) {
			canvas = document.createElement("canvas");
			target.appendChild(canvas);
			this.setDimensions(dimensions.width, dimensions.height);
			
			if(!(gl = new Utils().getWebGLContextFromCanvas(canvas))) {
				alert("No WebGLRenderingContext");
				return false; 
			}
		} else alert('Target DIV required');
	};
	
	/**
	 * loadProject 
	 * @param {Project} prj
	 */
	this.loadProject = function(prj) {
		project = prj; 
		project.setWebGLContext(gl);
		
		_UI = new UI(project).render(target);
		_events = new SystemEvents(this, canvas);
		_events.initialize();
	};
	
	/**
	 * getLoadedProject 
	 * @returns {Project}
	 */
	this.getLoadedProject = function() {
		return project;
	};
	
	/**
	 * getCanvas
	 * @returns {HTMLCanvasElement}
	 */
	this.getCanvas = function() {
		return canvas;
	};
	
	/**
	 * getEvents
	 * @returns {SystemEvents}
	 */
	this.getEvents = function() {
		return _events;
	};
	
	/**
	 * setDimensions
	 * @param {Int} width
	 * @param {Int} height
	 */
	this.setDimensions = function(width, height) {
		dimensions = {"width": width, "height": height};
		 
		canvas.setAttribute("width", dimensions.width);
		canvas.setAttribute("height", dimensions.height); 
		
		if(project != null && project.getActiveStage() != null && project.getActiveStage().getActiveCamera() != null) {
			project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).setResolution(dimensions.width, dimensions.width);
			
			var cse = project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
			cse.addSE({	"se": new SE_RGB(),
						"width": dimensions.width,
						"height": dimensions.width});
		}
	};
};



