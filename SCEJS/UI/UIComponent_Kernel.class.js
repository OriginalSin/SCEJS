/**
* @class
* @constructor
*/
UIComponent_Kernel = function(compTypeKey, selectedNode, comp, args) {
	"use strict";

	var ah = new ActionHelpers();


	//KERNELS
	for(var kernelKey in comp.getKernels()) {
		var kernel = comp.getKernels()[kernelKey];

		// fragment programs
		str = "<div id='DIVID_"+kernelKey+"_kernels' style='display:inline-block;border:1px solid #333;'>";
			str += ""+
			"<div>KERNEL NAME: "+kernelKey+"</div>"+
			"<div>ARG DESTINATION: "+kernel.name+"</div>"+ 
			
			"<div><input type='checkbox' id='ENABLE_"+kernelKey+"' style='font-size:10px;'>"+
			
			"<div>DEPTH TEST: <input type='checkbox' id='ENABLE_DEPTHTEST_"+kernelKey+"' style='font-size:10px;'>"+

			"<div>BLEND: <input type='checkbox' id='ENABLE_BLEND_"+kernelKey+"' style='font-size:10px;'>"+

			"<div>BLENT EQUATION: <select id='BLEND_EQUATION_"+kernelKey+"' style='font-size:10px;'>";
				for(var blendEquationKey in Constants.BLENDING_EQUATION_TYPES) str+="<option value='"+blendEquationKey+"'>"+blendEquationKey+"</option>";
			str+="</select></div>"+

			"<div>BLEND SRC (Foreground): <select id='BLEND_source_"+kernelKey+"' style='font-size:10px;'>";
				for(var blendModeKey in Constants.BLENDING_MODES) str+="<option value='"+blendModeKey+"'>"+blendModeKey+"</option>";
			str+="</select></div>"+

			"<div>BLEND DST (Background): <select id='BLEND_destination_"+kernelKey+"' style='font-size:10px;'>";
				for(var blendModeKey in Constants.BLENDING_MODES) str+="<option value='"+blendModeKey+"'>"+blendModeKey+"</option>";
			str+="</select></div>";

			
			for(var argKey in args) {
				var arg = args[argKey];
	
				var exists = false;
				for(var n=0, fn=kernel.kernel.in_values.length; n < fn; n++) {
					var fv = kernel.kernel.in_values[n];
					if(fv.name == argKey) {
						var bg = (fv.value != undefined) ? "rgba(150,150,255,1.0)" : "rgba(150,150,255,0.3)";
						var isDest = (kernel.name == argKey) ? "<div style='position:absolute;background-color:rgba(50,50,150,1.0);color:rgba(0,0,0,0);width:20px;margin:0px auto 0px auto'>-</div>" : "";
						str += 	isDest+"<div style='background:"+bg+";color:rgba(0,0,0,0);'>-</div>";
						exists = true;
						break;
					}
				}
				if(exists == false) str += "<div style='color:rgba(0,0,0,0)'>-</div>";
			}

		str += "</div>";
		$('#DIVID_'+compTypeKey).append(str);
		
		
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
