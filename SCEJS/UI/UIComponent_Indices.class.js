/**
* @class
* @constructor
*/
UIComponent_Indices = function(compTypeKey, selectedNode, comp, args) {
	"use strict";

	var ah = new ActionHelpers();


	// INDICES
	var str = 	"<div id='DIVID_indices' style='background:rgba(0,0,0,0.5);padding-left:3px'>"+
			"<div>indices</div>";
			if(comp.getIndices() != undefined) {
				if(comp.getIndices() instanceof WebCLGLBuffer) {
					var strItems = "", sep = "";
					for(var j=0; j < comp.getIndices().items.length; j++) {
						strItems += sep+"<span title='"+comp.getIndices().items[j].inData+"'>"+comp.getIndices().items[j].length+"</span>";
						sep = ",";
					}
					str += " <span style='color:grey'> {WebCLGLBuffer "+strItems+"}</span>";
				}
			}
		"</div>";
	ah.appendStringChild(str, document.getElementById('DIVID_'+compTypeKey));
	
};
