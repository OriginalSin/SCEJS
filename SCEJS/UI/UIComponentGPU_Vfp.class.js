/**
* @class
* @constructor
*/
UIComponentGPU_Vfp = function(targetElement, selectedNode, comp, args) {
	"use strict";

	var ah = new ActionHelpers();


	// VFPS
	for(var vfpKey in comp.gpufG.getAllVertexFragmentProgram()) {
		var vfp = comp.gpufG.getAllVertexFragmentProgram()[vfpKey];
        var idPrefix = vfp.name;

		// vertex programs
		var str = "<div id='"+targetElement.id+"_"+idPrefix+"_vps' style='display:table-cell;vertical-align:top;min-width:100px;max-width:100px;border:1px solid #333;'>"+
			"<div style='height:250px;overflow-x:hidden;'>"+
				"<div><input type='checkbox' id='ENABLE_"+idPrefix+"' style='font-size:10px;'/> "+vfp.name+"</div>"+
				"<div>["+((vfp.output[0]!=null)?vfp.output:"SCREEN")+"]</div>"+
	
				"<div>drawMode: <select id='DRAW_"+idPrefix+"' style='font-size:10px;max-width:70px;'>";
					for(var drawModeKey in Constants.DRAW_MODES) str+="<option value='"+Constants.DRAW_MODES[drawModeKey]+"'>"+drawModeKey+"</option>";
				str+="</select></div>"+
	
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
                for(var keyB in vfp.in_vertex_values) {
                    if(argKey == keyB) {
                        exists = true;

                        str += 	"<div style='height:11px;background:rgba(255,150,150,"+((b==true)?1.0:0.9)+");color:rgba(0,0,0,0);'>"+
                            "<span style='border-right:1px solid grey;background-color:"+((arg != undefined)?"white":"black")+";'>_</span>"+
                            "<span style='color:blue;'>"+((vfp.in_vertex_values[keyB].type == "float4_fromSampler"||vfp.in_vertex_values[keyB].type == "float_fromSampler")?"fromSampler":"")+"</span>-";

                        break;
                    }
                }
                if(exists == false) str += "<div style='height:11px;color:rgba(0,0,0,0);background-color:"+((b==true)?"rgba(0,0,0,0.0)":"rgba(0,0,0,0.07)")+"'>-";

                str += "</div>";


                b=!b;
            }
		str += "</div>";
		ah.appendStringChild(str, targetElement);


		var e = document.getElementById("ENABLE_"+idPrefix);
		e.checked = (vfp.enabled == true);
		e.addEventListener("click", (function(vfp, e) {
            vfp.enabled = (e.checked == true);
		}).bind(this, vfp, e));


		var e = document.getElementById("DRAW_"+idPrefix);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.drawMode) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(comp, idPrefix, e) {
			console.log(e.options[e.selectedIndex].value);
            vfp.drawMode = parseInt(e.options[e.selectedIndex].value);
		}).bind(this, comp, idPrefix, e));


		var e = document.getElementById("ENABLE_DEPTHTEST_"+idPrefix);
		e.checked = (vfp.depthTest == true);
		e.addEventListener("click", (function(vfp, e) {
            vfp.depthTest = (e.checked == true);
		}).bind(this, vfp, e));


		var e = document.getElementById("ENABLE_BLEND_"+idPrefix);
		e.checked = (vfp.blend == true);
		e.addEventListener("click", (function(vfp, e) {
            vfp.blend = (e.checked == true);
		}).bind(this, vfp, e));


		var e = document.getElementById("BLEND_EQUATION_"+idPrefix);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.blendEquation) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(vfp, e) {
            vfp.blendEquation = e.options[e.selectedIndex].value;
		}).bind(this, vfp, e));


		var e = document.getElementById("BLEND_source_"+idPrefix);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.blendSrcMode) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(vfp, e) {
            vfp.blendSrcMode = e.options[e.selectedIndex].value;
		}).bind(this, vfp, e));


		var e = document.getElementById("BLEND_destination_"+idPrefix);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.blendDstMode) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(vfp, e) {
            vfp.blendDstMode = e.options[e.selectedIndex].value;
		}).bind(this, vfp, e));



		// fragment programs
		str = "<div id='DIVID_"+idPrefix+"_fps' style='display:table-cell;vertical-align:top;min-width:50px;max-width:50px;border:1px solid #333;'>"+
			"<div style='height:250px;'>";
			str += "</div>";


            var b = false;
            for(var argKey in args) {
                var arg = args[argKey];

                var exists = false;
                for(var keyB in vfp.in_fragment_values) {
                    if(argKey == keyB) {
                        exists = true;

                        str += 	"<div style='height:11px;background:rgba(150,150,255,"+((b==true)?1.0:0.9)+");color:rgba(0,0,0,0);'>"+
                        "<span style='border-right:1px solid grey;background-color:"+((arg != undefined)?"white":"black")+";'>_</span>-";

                        break;
                    }
                }
                if(exists == false) str += "<div style='height:11px;color:rgba(0,0,0,0);background-color:"+((b==true)?"rgba(0,0,0,0.0)":"rgba(0,0,0,0.07)")+"'>-";

                var updat = "";
                for(var n=0; n<vfp.output.length; n++) {
                    if(argKey == vfp.output[n]) {
                        updat = "<div style='display:inline-block;color:black;'>UPDATE</div>";
                        break;
                    }
                }

                str += updat+"</div>";


                b=!b;
            }
		str += "</div>";
		ah.appendStringChild(str, targetElement);
	}
	
};
