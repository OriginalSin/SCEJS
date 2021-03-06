/**
* @class
* @constructor
*/
UIComponentGPU_Kernel = function(targetElement, selectedNode, comp, args) {
	"use strict";

	var ah = new ActionHelpers();


	//KERNELS
	for(var kernelKey in comp.gpufG.getAllKernels()) {
		var kernel = comp.gpufG.getAllKernels()[kernelKey];
        var idPrefix = kernel.name;

		// fragment programs
		var str = "<div id='"+targetElement.id+"_"+idPrefix+"_kernels' style='display:table-cell;vertical-align:top;min-width:100px;max-width:100px;border:1px solid #333;'>"+
			"<div style='height:250px;overflow-x:hidden;'>"+
				"<div><input type='checkbox' id='ENABLE_"+idPrefix+"' style='font-size:10px;'/> "+kernel.name+"</div>"+
				"<div>["+((kernel.output[0]!=null)?kernel.output:"SCREEN")+"]</div>"+
				
				"<div>DEPTH TEST: <input type='checkbox' id='ENABLE_DEPTHTEST_"+idPrefix+"' style='font-size:10px;'></div>"+
	
				"<div>BLEND: <input type='checkbox' id='ENABLE_BLEND_"+idPrefix+"' style='font-size:10px;'></div>"+
	
				"<div>BLENT EQUATION: <select id='BLEND_EQUATION_"+idPrefix+"' style='font-size:10px;max-width:70px;'>";
					for(var blendEquationKey in Constants.BLENDING_EQUATION_TYPES) str+="<option value='"+blendEquationKey+"'>"+blendEquationKey+"</option>";
				str+="</select></div>"+
	
				"<div>BLEND SRC (Foreground): <select id='BLEND_source_"+idPrefix+"' style='font-size:10px;max-width:70px;'>";
					for(var blendModeKey in Constants.BLENDING_MODES) str+="<option value='"+blendModeKey+"'>"+blendModeKey+"</option>";
				str+="</select></div>"+
	
				"<div>BLEND DST (Background): <select id='BLEND_destination_"+idPrefix+"' style='font-size:10px;max-width:70px;'>";
					for(var blendModeKey in Constants.BLENDING_MODES) str+="<option value='"+blendModeKey+"'>"+blendModeKey+"</option>";
				str+="</select></div>";
			str += "</div>";


            var b = false;
            for(var argKey in args) {
                var arg = args[argKey];

                var exists = false;
                for(var keyB in kernel.in_values) {
                    if(argKey == keyB) {
                        exists = true;

                        str += 	"<div style='height:11px;background:rgba(150,150,255,"+((b==true)?1.0:0.9)+");color:rgba(0,0,0,0);'>"+
                            "<span style='border-right:1px solid grey;background-color:"+((arg != undefined)?"white":"black")+";'>_</span>-";

                        break;
                    }
                }
                if(exists == false) str += "<div style='height:11px;color:rgba(0,0,0,0);background-color:"+((b==true)?"rgba(0,0,0,0.0)":"rgba(0,0,0,0.07)")+"'>-";

                var updat = "";
                for(var n=0; n<kernel.output.length; n++) {
                    if(argKey == kernel.output[n]) {
                        updat = "<div style='display:inline-block;color:black;'>UPDATE</div>";
                        break;
                    }
                }

                str += updat+"</div>";


                b=!b;
            }
        str += "</div>";
		ah.appendStringChild(str, targetElement);
		
		
		var e = document.getElementById("ENABLE_"+idPrefix);
		e.checked = (kernel.enabled == true);
		e.addEventListener("click", (function(kernel, e) {
            kernel.enabled = (e.checked == true);
		}).bind(this, kernel, e));


		var e = document.getElementById("ENABLE_DEPTHTEST_"+idPrefix);
		e.checked = (kernel.depthTest == true);
		e.addEventListener("click", (function(kernel, e) {
            kernel.depthTest = (e.checked == true);
		}).bind(this, kernel, e));


		var e = document.getElementById("ENABLE_BLEND_"+idPrefix);
		e.checked = (kernel.blend == true);
		e.addEventListener("click", (function(kernel, e) {
            kernel.blend = (e.checked == true);
		}).bind(this, kernel, e));


		var e = document.getElementById("BLEND_EQUATION_"+idPrefix);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == kernel.blendEquation) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(kernel, e) {
            kernel.blendEquation = e.options[e.selectedIndex].value;
		}).bind(this, kernel, e));


		var e = document.getElementById("BLEND_source_"+idPrefix);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == kernel.blendSrcMode) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(kernel, e) {
            kernel.blendSrcMode = e.options[e.selectedIndex].value;
		}).bind(this, kernel, e));


		var e = document.getElementById("BLEND_destination_"+idPrefix);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == kernel.blendDstMode) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(kernel, e) {
            kernel.blendDstMode = e.options[e.selectedIndex].value;
		}).bind(this, kernel, e));
	}
	
};
