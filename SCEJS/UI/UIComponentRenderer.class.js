/**
* @class
* @constructor
*/
UIComponentRenderer = function(compTypeKey, selectedNode) {
	"use strict";
	
	var ah = new ActionHelpers();
	
	var str = 	"<div id='component_vfps' class='component_section'>VertexFragmentPrograms</div>"+
	"<div id='component_indices' class='component_section'>Indices</div>"+
	"<div id='component_arguments' class='component_section'>Arguments</div>";						
	$('#DIVID_component_'+compTypeKey).append(str);
	
	var comp = selectedNode.getComponent(Constants.COMPONENT_TYPES.RENDERER);
	
	// VFP
	for(var vfpKey in comp.getVFPs()) {
		var vfp = comp.getVFPs()[vfpKey];
		
		var str = 	"<div style='background:rgba(0,0,0,0.5);padding:5px;' class='StormShadow02 StormRound'>"+
						"<div>name: "+vfpKey+"</div>"+
						"<div>destination: "+vfp.argBufferDestination+"</div>"+
						
						"<div>blendSrc: "+vfp.blendSrc+" <select id='BLEND_source_"+vfpKey+"'>"+
							"<option value='ZERO'>ZERO</option>"+
							"<option value='ONE'>ONE</option>"+
							"<option value='SRC_COLOR'>SRC_COLOR</option>"+
							"<option value='ONE_MINUS_SRC_COLOR'>ONE_MINUS_SRC_COLOR</option>"+
							"<option value='DST_COLOR'>DST_COLOR</option>"+
							"<option value='ONE_MINUS_DST_COLOR'>ONE_MINUS_DST_COLOR</option>"+
							"<option value='SRC_ALPHA'>SRC_ALPHA</option>"+
							"<option value='ONE_MINUS_SRC_ALPHA'>ONE_MINUS_SRC_ALPHA</option>"+
							"<option value='DST_ALPHA'>DST_ALPHA</option>"+
							"<option value='ONE_MINUS_DST_ALPHA'>ONE_MINUS_DST_ALPHA</option>"+
							"<option value='SRC_ALPHA_SATURATE'>SRC_ALPHA_SATURATE</option>"+
							"<option value='CONSTANT_COLOR'>CONSTANT_COLOR</option>"+
							"<option value='ONE_MINUS_CONSTANT_COLOR'>ONE_MINUS_CONSTANT_COLOR</option>"+
							"<option value='CONSTANT_ALPHA'>CONSTANT_ALPHA</option>"+
							"<option value='ONE_MINUS_CONSTANT_ALPHA'>ONE_MINUS_CONSTANT_ALPHA</option>"+
						"</select></div>"+
						"<div>blendDst: "+vfp.blendDst+" <select id='BLEND_destination_"+vfpKey+"'>"+
							"<option value='ZERO'>ZERO</option>"+
							"<option value='ONE'>ONE</option>"+
							"<option value='SRC_COLOR'>SRC_COLOR</option>"+
							"<option value='ONE_MINUS_SRC_COLOR'>ONE_MINUS_SRC_COLOR</option>"+
							"<option value='DST_COLOR'>DST_COLOR</option>"+
							"<option value='ONE_MINUS_DST_COLOR'>ONE_MINUS_DST_COLOR</option>"+
							"<option value='SRC_ALPHA'>SRC_ALPHA</option>"+
							"<option value='ONE_MINUS_SRC_ALPHA'>ONE_MINUS_SRC_ALPHA</option>"+
							"<option value='DST_ALPHA'>DST_ALPHA</option>"+
							"<option value='ONE_MINUS_DST_ALPHA'>ONE_MINUS_DST_ALPHA</option>"+
							"<option value='SRC_ALPHA_SATURATE'>SRC_ALPHA_SATURATE</option>"+
							"<option value='CONSTANT_COLOR'>CONSTANT_COLOR</option>"+
							"<option value='ONE_MINUS_CONSTANT_COLOR'>ONE_MINUS_CONSTANT_COLOR</option>"+
							"<option value='CONSTANT_ALPHA'>CONSTANT_ALPHA</option>"+
							"<option value='ONE_MINUS_CONSTANT_ALPHA'>ONE_MINUS_CONSTANT_ALPHA</option>"+
						"</select></div>"+
						
						"<div id='in_vertex_values_"+vfpKey+"' style='background:rgba(255,0,0,0.1)'></div>"+
						"<div id='in_fragment_values_"+vfpKey+"' style='background:rgba(0,255,0,0.1)'></div>";
					"</div>";						
		$('#component_vfps').append(str);
		
		var e = document.getElementById("BLEND_source_"+vfpKey);
		e.addEventListener("change", (function(comp, e) {
			comp.setBlendSrc(vfpKey, e.options[e.selectedIndex].value);
		}).bind(this, comp, e));
		
		var e = document.getElementById("BLEND_destination_"+vfpKey);
		e.addEventListener("change", (function(comp, e) {
			comp.setBlendDst(vfpKey, e.options[e.selectedIndex].value);
		}).bind(this, comp, e));
		
		var str = "";
		for(var n=0, fn=vfp.vfp.in_vertex_values.length; n < fn; n++) {
			var vv = vfp.vfp.in_vertex_values[n];
			str += 	"<div>"+
					"<span style='font-weight:bold;color:rgba(255,0,0,0.5)'>"+vv.type+"</span> "+vv.name;
					if(vv.value != undefined)
						str += "<span style='color:grey'>"+vv.value.constructor.name+"</span>";
			str += "</div>";
		}
		$('#in_vertex_values_'+vfpKey).append(str);
		
		str = "";
		for(var n=0, fn=vfp.vfp.in_fragment_values.length; n < fn; n++) {
			var fv = vfp.vfp.in_fragment_values[n];
			str += 	"<div>"+
					"<span style='font-weight:bold;color:rgba(0,255,0,0.5)'>"+fv.type+"</span> "+fv.name;
					if(fv.value != undefined)
						str += "<span style='color:grey'>"+fv.value.constructor.name+"</span>";
			str += "</div>";
		}
		$('#in_fragment_values_'+vfpKey).append(str);
	}
	
	// indices
	var str = 	"<div id='DIVID_indices' style='background:rgba(0,0,0,0.5);padding:5px;margin-bottom:4px' class='StormShadow02 StormRound'>"+
			"<div>indices</div>";
			if(comp.getIndices() != undefined)
				str += "<div style='color:grey'>"+comp.getIndices().constructor.name+"</div>";
		"</div>";						
	$('#component_indices').append(str);
	
	// arguments
	for(var argKey in comp.getArgs()) {	
		var arg = comp.getArgs()[argKey];
		console.log(arg);
		
		var str = 	"<div id='DIVID_"+argKey+"' style='background:rgba(0,0,0,0.5);padding:5px;margin-bottom:4px' class='StormShadow02 StormRound'>"+
					"<div>"+argKey+"</div>"+
					"<div>"+arg.fnvalue()+"</div>"+
				"</div>";						
		$('#component_arguments').append(str);
		
		
	    
	    
	    
		ah.add_checkbox(document.getElementById('DIVID_'+argKey), argKey+" UPDATABLE", arg.updatable, 
			(function(comp, argKey) {
				comp.setArgUpdatable(argKey, true);
			}).bind(this, comp, argKey), (function(comp, argKey) {
				comp.setArgUpdatable(argKey, false);
			}).bind(this, comp, argKey));
	}
};