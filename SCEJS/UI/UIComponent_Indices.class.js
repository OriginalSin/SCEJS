/**
* @class
* @constructor
*/
UIComponent_Indices = function(targetElement, selectedNode, comp, args) {
	"use strict";

	var ah = new ActionHelpers();


	// INDICES
	var str = 	"<div id='"+targetElement.id+"_indices' style='background:rgba(0,0,0,0.5);padding-left:3px'>"+
			"<div>indices</div>";
			var indices = comp.getBuffers()["indices"];
			if(indices != undefined) {
				if(indices instanceof WebCLGLBuffer) {
					var strItems = "<span title='"+indices.inData+"'>"+indices.length+"</span>";
					str += " <span style='color:grey'> {WebCLGLBuffer "+strItems+"}</span>";
				}
			}
		"</div>";
	ah.appendStringChild(str, targetElement);
	
};
