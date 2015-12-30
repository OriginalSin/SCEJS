/**
* @class
* @constructor
*/
UIComponent_Vfp = function(compTypeKey, selectedNode, comp, args) { 
	"use strict";

	var ah = new ActionHelpers();


	// VFPS
	for(var vfpKey in comp.getVFPs()) {
		var vfp = comp.getVFPs()[vfpKey];

		// vertex programs
		str = "<div id='DIVID_"+vfpKey+"_vps' style='display:inline-block;border:1px solid #333;'>";
			str += ""+
			"<div>VFP NAME: "+vfpKey+"</div>"+
			"<div>SE ARG destination: "+vfp.name+"</div>"+

			"<div><input type='checkbox' id='ENABLE_"+vfpKey+"' style='font-size:10px;'>"+

			"<div>drawMode: <select id='DRAW_"+vfpKey+"' style='font-size:10px;'>";
				for(var drawModeKey in Constants.DRAW_MODES) str+="<option value='"+Constants.DRAW_MODES[drawModeKey]+"'>"+drawModeKey+"</option>";
			str+="</select></div>"+

			"<div>DEPTH TEST: <input type='checkbox' id='ENABLE_DEPTHTEST_"+vfpKey+"' style='font-size:10px;'>"+

			"<div>BLEND: <input type='checkbox' id='ENABLE_BLEND_"+vfpKey+"' style='font-size:10px;'>"+

			"<div>BLENT EQUATION: <select id='BLEND_EQUATION_"+vfpKey+"' style='font-size:10px;'>";
				for(var blendEquationKey in Constants.BLENDING_EQUATION_TYPES) str+="<option value='"+blendEquationKey+"'>"+blendEquationKey+"</option>";
			str+="</select></div>"+

			"<div>BLEND SRC (Foreground): <select id='BLEND_source_"+vfpKey+"' style='font-size:10px;'>";
				for(var blendModeKey in Constants.BLENDING_MODES) str+="<option value='"+blendModeKey+"'>"+blendModeKey+"</option>";
			str+="</select></div>"+

			"<div>BLEND DST (Background): <select id='BLEND_destination_"+vfpKey+"' style='font-size:10px;'>";
				for(var blendModeKey in Constants.BLENDING_MODES) str+="<option value='"+blendModeKey+"'>"+blendModeKey+"</option>";
			str+="</select></div>";


			for(var argKey in args) {
				var arg = args[argKey];
	
				var exists = false;
				for(var n=0, fn=vfp.vfp.in_vertex_values.length; n < fn; n++) {
					var vv = vfp.vfp.in_vertex_values[n];
					if(vv.name == argKey) {
						var bg = (vv.value != undefined) ? "rgba(255,150,150,1.0)" : "rgba(255,150,150,0.3)";
						var isFromKernel = (arg.type == "buffer_float4_fromKernel") ? "<div style='position:absolute;background-color:rgba(50,50,150,1.0);color:rgba(0,0,0,0);width:20px;margin:0px auto 0px 0px'>-</div>" : "";
						str += 	isFromKernel+"<div style='background:"+bg+";color:rgba(0,0,0,0)'>-</div>";
						exists = true;
						break;
					}
				}
				if(exists == false) str += "<div style='color:rgba(0,0,0,0)'>-</div>";
			}

		str += "</div>";
		$('#DIVID_'+compTypeKey).append(str);


		var e = document.getElementById("ENABLE_"+vfpKey);
		e.checked = (vfp.enabled == true) ? true : false;
		e.addEventListener("click", (function(comp, vfpKey, e) {
			if(e.checked == false) {
				comp.disableVfp(vfpKey);
			} else {
				comp.enableVfp(vfpKey);
			}
		}).bind(this, comp, vfpKey, e));


		var e = document.getElementById("DRAW_"+vfpKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.drawMode) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(comp, vfpKey, e) {
			console.log(e.options[e.selectedIndex].value);
			comp.setVfpDrawMode(vfpKey, parseInt(e.options[e.selectedIndex].value));
		}).bind(this, comp, vfpKey, e));


		var e = document.getElementById("ENABLE_DEPTHTEST_"+vfpKey);
		e.checked = (vfp.enableDepthTest == true) ? true : false;
		e.addEventListener("click", (function(comp, vfpKey, e) {
			if(e.checked == false) {
				comp.setVfpEnableDepthTest(vfpKey, false);
			} else {
				comp.setVfpEnableDepthTest(vfpKey, true);
			}
		}).bind(this, comp, vfpKey, e));


		var e = document.getElementById("ENABLE_BLEND_"+vfpKey);
		e.checked = (vfp.enableBlend == true) ? true : false;
		e.addEventListener("click", (function(comp, vfpKey, e) {
			if(e.checked == false) {
				comp.setVfpEnableBlend(vfpKey, false);
			} else {
				comp.setVfpEnableBlend(vfpKey, true);
			}
		}).bind(this, comp, vfpKey, e));


		var e = document.getElementById("BLEND_EQUATION_"+vfpKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.blendEquation) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(comp, vfpKey, e) {
			comp.setVfpBlendEquation(vfpKey, e.options[e.selectedIndex].value);
		}).bind(this, comp, vfpKey, e));


		var e = document.getElementById("BLEND_source_"+vfpKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.blendSrc) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(comp, vfpKey, e) {
			comp.setVfpBlendSrc(vfpKey, e.options[e.selectedIndex].value);
		}).bind(this, comp, vfpKey, e));


		var e = document.getElementById("BLEND_destination_"+vfpKey);
		for(var n=0; n < e.options.length; n++)
			if(e.options[n].value == vfp.blendDst) {
				e.selectedIndex = n;
				break;
			}
		e.addEventListener("change", (function(comp, vfpKey, e) {
			comp.setVfpBlendDst(vfpKey, e.options[e.selectedIndex].value);
		}).bind(this, comp, vfpKey, e));



		// fragment programs
		str = "<div id='DIVID_"+vfpKey+"_fps' style='display:inline-block;border:1px solid #333;'>";

		for(var argKey in args) {
			var arg = args[argKey];

			var exists = false;
			for(var n=0, fn=vfp.vfp.in_fragment_values.length; n < fn; n++) {
				var fv = vfp.vfp.in_fragment_values[n];
				if(fv.name == argKey) {
					var bg = (fv.value != undefined) ? "rgba(150,255,150,1.0)" : "rgba(150,255,150,0.3)";
					str += 	"<div style='background:"+bg+";color:rgba(0,0,0,0)'>-----</div>";
					exists = true;
					break;
				}
			}
			if(exists == false) str += "<div style='color:rgba(0,0,0,0)'>-----</div>";
		}

		str += "</div>";
		$('#DIVID_'+compTypeKey).append(str);
	}
	
};
