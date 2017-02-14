/**
* @class
* @constructor
*/
UIComponent_Vfp = function(targetElement, selectedNode, comp, args) { 
	"use strict";

	var ah = new ActionHelpers();


	// VFPS
	for(var vfpKey in comp.gpufG.getAllVertexFragmentProgram()) {
		var vfp = comp.gpufG.getAllVertexFragmentProgram()[vfpKey];

		// vertex programs
		var str = "<div id='"+targetElement.id+"_"+vfpKey+"_vps' style='display:table-cell;vertical-align:top;min-width:100px;max-width:100px;border:1px solid #333;'>"+
			"<div style='height:250px;'>"+
				"<div>VFP NAME: "+vfpKey+"</div>"+
				"<div>SE ARG destination: "+vfp.output+"</div>"+
	
				"<div><input type='checkbox' id='ENABLE_"+vfpKey+"' style='font-size:10px;'></div>"+
	
				"<div>drawMode: <select id='DRAW_"+vfpKey+"' style='font-size:10px;max-width:70px;'>";
					for(var drawModeKey in Constants.DRAW_MODES) str+="<option value='"+Constants.DRAW_MODES[drawModeKey]+"'>"+drawModeKey+"</option>";
				str+="</select></div>"+
	
				"<div>DEPTH TEST: <input type='checkbox' id='ENABLE_DEPTHTEST_"+vfpKey+"' style='font-size:10px;'></div>"+
	
				"<div>BLEND: <input type='checkbox' id='ENABLE_BLEND_"+vfpKey+"' style='font-size:10px;'></div>"+
	
				"<div>BLENT EQUATION: <select id='BLEND_EQUATION_"+vfpKey+"' style='font-size:10px;max-width:70px;'>";
					for(var blendEquationKey in Constants.BLENDING_EQUATION_TYPES) str+="<option value='"+blendEquationKey+"'>"+blendEquationKey+"</option>";
				str+="</select></div>"+
	
				"<div>BLEND SRC (Foreground): <select id='BLEND_source_"+vfpKey+"' style='font-size:10px;max-width:70px;'>";
					for(var blendModeKey in Constants.BLENDING_MODES) str+="<option value='"+blendModeKey+"'>"+blendModeKey+"</option>";
				str+="</select></div>"+
	
				"<div>BLEND DST (Background): <select id='BLEND_destination_"+vfpKey+"' style='font-size:10px;max-width:70px;'>";
					for(var blendModeKey in Constants.BLENDING_MODES) str+="<option value='"+blendModeKey+"'>"+blendModeKey+"</option>";
				str+="</select></div>";
			str += "</div>";
	
			for(var argKey in args) {
				var arg = args[argKey];
	
				var exists = false;
				for(var n=0, fn=vfp.in_vertex_values.length; n < fn; n++) {
					var vv = vfp.in_vertex_values[n];
					if(vv.name == argKey) {
						var bg = (vv.value != undefined) ? "rgba(255,150,150,1.0)" : "rgba(255,150,150,0.3)";
						var isFromKernel = (arg.type == "buffer_float4_fromKernel") ? "<div style='display:inline-block;background-color:rgba(50,50,150,1.0);color:rgba(0,0,0,0);width:20px;margin:0px auto 0px 0px'>-</div>" : "";
						str += 	"<div style='background:"+bg+";color:rgba(0,0,0,0)'>-"+isFromKernel+"</div>";
						exists = true;
						break;
					}
				}
				if(exists == false) str += "<div style='color:rgba(0,0,0,0)'>-</div>";
			}			
		str += "</div>";
		ah.appendStringChild(str, targetElement);


		var e = document.getElementById("ENABLE_"+vfpKey);
		e.checked = (vfp.enabled == true) ? true : false;
		e.addEventListener("click", (function(vfp, e) {
            vfp.enabled = (e.checked == false) ? false : true;
		}).bind(this, vfp, e));


		var e = document.getElementById("DRAW_"+vfpKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.drawMode) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(comp, vfpKey, e) {
			console.log(e.options[e.selectedIndex].value);
            vfp.drawMode = parseInt(e.options[e.selectedIndex].value);
		}).bind(this, comp, vfpKey, e));


		var e = document.getElementById("ENABLE_DEPTHTEST_"+vfpKey);
		e.checked = (vfp.depthTest == true) ? true : false;
		e.addEventListener("click", (function(vfp, e) {
            vfp.depthTest = (e.checked == false) ? false : true;
		}).bind(this, vfp, e));


		var e = document.getElementById("ENABLE_BLEND_"+vfpKey);
		e.checked = (vfp.blend == true) ? true : false;
		e.addEventListener("click", (function(vfp, e) {
            vfp.blend = (e.checked == false) ? false : true;
		}).bind(this, vfp, e));


		var e = document.getElementById("BLEND_EQUATION_"+vfpKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.blendEquation) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(vfp, e) {
            vfp.blendEquation = e.options[e.selectedIndex].value;
		}).bind(this, vfp, e));


		var e = document.getElementById("BLEND_source_"+vfpKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.blendSrcMode) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(vfp, e) {
            vfp.blendSrcMode = e.options[e.selectedIndex].value;
		}).bind(this, vfp, e));


		var e = document.getElementById("BLEND_destination_"+vfpKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.blendDstMode) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(vfp, e) {
            vfp.blendDstMode = e.options[e.selectedIndex].value;
		}).bind(this, vfp, e));



		// fragment programs
		str = "<div id='DIVID_"+vfpKey+"_fps' style='display:table-cell;vertical-align:top;min-width:25px;max-width:25px;border:1px solid #333;'>"+
			"<div style='height:250px;'>";
			str += "</div>";
			
			for(var argKey in args) {
				var arg = args[argKey];
	
				var exists = false;
				for(var n=0, fn=vfp.in_fragment_values.length; n < fn; n++) {
					var fv = vfp.in_fragment_values[n];
					if(fv.name == argKey) {
						var bg = (fv.value != undefined) ? "rgba(150,150,255,1.0)" : "rgba(150,150,255,0.3)";
						str += 	"<div style='height:11px;background:"+bg+";color:rgba(0,0,0,0)'>-----</div>";
						exists = true;
						break;
					}
				}
				if(exists == false) str += "<div style='height:11px;color:rgba(0,0,0,0)'>-----</div>";
			}			
		str += "</div>";
		ah.appendStringChild(str, targetElement);
	}
	
};
