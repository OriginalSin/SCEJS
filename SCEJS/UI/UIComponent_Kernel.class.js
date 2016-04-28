/**
* @class
* @constructor
*/
UIComponent_Kernel = function(targetElement, selectedNode, comp, args) {
	"use strict";

	var ah = new ActionHelpers();


	//KERNELS
	for(var kernelKey in comp.getKernels()) {
		var kernel = comp.getKernels()[kernelKey];

		// fragment programs
		var str = "<div id='"+targetElement.id+"_"+kernelKey+"_kernels' style='display:table-cell;vertical-align:top;min-width:100px;max-width:100px;border:1px solid #333;'>"+
			"<div style='height:250px;'>"+
				"<div>KERNEL NAME: "+kernelKey+"</div>"+
				"<div>ARG DESTINATION: "+kernel.name+"</div>"+ 
				
				"<div><input type='checkbox' id='ENABLE_"+kernelKey+"' style='font-size:10px;'></div>"+
				
				"<div>DEPTH TEST: <input type='checkbox' id='ENABLE_DEPTHTEST_"+kernelKey+"' style='font-size:10px;'></div>"+
	
				"<div>BLEND: <input type='checkbox' id='ENABLE_BLEND_"+kernelKey+"' style='font-size:10px;'></div>"+
	
				"<div>BLENT EQUATION: <select id='BLEND_EQUATION_"+kernelKey+"' style='font-size:10px;max-width:70px;'>";
					for(var blendEquationKey in Constants.BLENDING_EQUATION_TYPES) str+="<option value='"+blendEquationKey+"'>"+blendEquationKey+"</option>";
				str+="</select></div>"+
	
				"<div>BLEND SRC (Foreground): <select id='BLEND_source_"+kernelKey+"' style='font-size:10px;max-width:70px;'>";
					for(var blendModeKey in Constants.BLENDING_MODES) str+="<option value='"+blendModeKey+"'>"+blendModeKey+"</option>";
				str+="</select></div>"+
	
				"<div>BLEND DST (Background): <select id='BLEND_destination_"+kernelKey+"' style='font-size:10px;max-width:70px;'>";
					for(var blendModeKey in Constants.BLENDING_MODES) str+="<option value='"+blendModeKey+"'>"+blendModeKey+"</option>";
				str+="</select></div>";
			str += "</div>";
				
			for(var argKey in args) {
				var arg = args[argKey];
	
				var exists = false;
				for(var n=0, fn=kernel.kernel.in_values.length; n < fn; n++) {
					var fv = kernel.kernel.in_values[n];
					if(fv.name == argKey) {
						var bg = (fv.value != undefined) ? "rgba(150,150,255,1.0)" : "rgba(150,150,255,0.3)";
						var isDest = (kernel.name == argKey) ? "<div style='display:inline-block;background-color:rgba(50,50,150,1.0);color:rgba(0,0,0,0);width:20px;margin:0px auto 0px auto'>-</div>" : "";
						str += 	"<div style='height:11px;background:"+bg+";color:rgba(0,0,0,0);'>-"+isDest+"</div>";
						exists = true;
						break;
					}
				}
				if(exists == false) str += "<div style='height:11px;color:rgba(0,0,0,0)'>-</div>";
			}			
		str += "</div>";
		ah.appendStringChild(str, targetElement);
		
		
		var e = document.getElementById("ENABLE_"+kernelKey);
		e.checked = (kernel.enabled == true) ? true : false;
		e.addEventListener("click", (function(comp, kernelKey, e) {
			if(e.checked == false) {
				comp.disableKernel(kernelKey);
			} else {
				comp.enableKernel(kernelKey);
			}
		}).bind(this, comp, kernelKey, e));


		var e = document.getElementById("ENABLE_DEPTHTEST_"+kernelKey);
		e.checked = (kernel.enableDepthTest == true) ? true : false;
		e.addEventListener("click", (function(comp, kernelKey, e) {
			if(e.checked == false) {
				comp.setKernelEnableDepthTest(kernelKey, false);
			} else {
				comp.setKernelEnableDepthTest(kernelKey, true);
			}
		}).bind(this, comp, kernelKey, e));


		var e = document.getElementById("ENABLE_BLEND_"+kernelKey);
		e.checked = (kernel.enableBlend == true) ? true : false;
		e.addEventListener("click", (function(comp, kernelKey, e) {
			if(e.checked == false) {
				comp.setKernelEnableBlend(kernelKey, false);
			} else {
				comp.setKernelEnableBlend(kernelKey, true);
			}
		}).bind(this, comp, kernelKey, e));


		var e = document.getElementById("BLEND_EQUATION_"+kernelKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == kernel.blendEquation) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(comp, kernelKey, e) {
			comp.setKernelBlendEquation(kernelKey, e.options[e.selectedIndex].value);
		}).bind(this, comp, kernelKey, e));


		var e = document.getElementById("BLEND_source_"+kernelKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == kernel.blendSrc) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(comp, kernelKey, e) {
			comp.setKernelBlendSrc(kernelKey, e.options[e.selectedIndex].value);
		}).bind(this, comp, kernelKey, e));


		var e = document.getElementById("BLEND_destination_"+kernelKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == kernel.blendDst) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(comp, kernelKey, e) {
			comp.setKernelBlendDst(kernelKey, e.options[e.selectedIndex].value);
		}).bind(this, comp, kernelKey, e));
	}
	
};
