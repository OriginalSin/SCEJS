/**
* @class
* @constructor
*/
UIComponentRenderer = function(compTypeKey, selectedNode) {
	"use strict";

	var ah = new ActionHelpers();

	var comp = selectedNode.getComponent(Constants.COMPONENT_TYPES.RENDERER);

	var getArgType = function(argsOrigin, argsTarget, type) {
		for(var argKey in argsOrigin)
			if(argsOrigin[argKey].type == type)
				argsTarget[argKey] = argsOrigin[argKey];

		return args;
	};

	var args = {},
		tmpArgs = comp.getAllArgs();
	getArgType(tmpArgs, args, "buffer_float4_fromKernel");
	getArgType(tmpArgs, args, "buffer_float_fromKernel");
	getArgType(tmpArgs, args, "buffer_float4");
	getArgType(tmpArgs, args, "buffer_float");
	getArgType(tmpArgs, args, "mat4");
	getArgType(tmpArgs, args, "float4");
	getArgType(tmpArgs, args, "float");


	var str = ""+
	"<div id='DIVID_"+compTypeKey+"' class='component_section'>"+
		"<div id='DIVID_"+compTypeKey+"_args' style='width:50%;display:inline-block;float:left;'></div>"+
		"<div id='DIVID_"+compTypeKey+"_kernelsvfps' style='width:50%;display:inline-block;overflow-x:auto;'></div>"+
	"</div>";
	ah.appendStringChild(str, document.getElementById('DIVID_component_'+compTypeKey));



	// INDICES
	new UIComponent_Indices(document.getElementById('DIVID_'+compTypeKey), selectedNode, comp, args);

	// ARGS
	new UIComponent_Argument(document.getElementById('DIVID_'+compTypeKey+'_args'), selectedNode, comp, args);

	//KERNELS
	new UIComponent_Kernel(document.getElementById('DIVID_'+compTypeKey+'_kernelsvfps'), selectedNode, comp, args);

	// VFPS
	new UIComponent_Vfp(document.getElementById('DIVID_'+compTypeKey+'_kernelsvfps'), selectedNode, comp, args);
};
