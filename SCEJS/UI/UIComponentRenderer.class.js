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
					vfpKey+
					"<div id='in_vertex_values_"+vfpKey+"' style='background:rgba(255,0,0,0.1)'></div>"+
					"<div id='in_fragment_values_"+vfpKey+"' style='background:rgba(0,255,0,0.1)'></div>";
				"</div>";						
		$('#component_vfps').append(str);
		
		var str = "";
		for(var n=0, fn=vfp.in_vertex_values.length; n < fn; n++) {
			var vv = vfp.in_vertex_values[n];
			str += 	"<div>"+
					"<span style='font-weight:bold;color:rgba(255,0,0,0.5)'>"+vv.type+"</span> "+vv.name;
					if(vv.value != undefined)
						str += "<span style='color:grey'>"+vv.value.constructor.name+"</span>";
			str += "</div>";
		}
		$('#in_vertex_values_'+vfpKey).append(str);
		
		str = "";
		for(var n=0, fn=vfp.in_fragment_values.length; n < fn; n++) {
			var fv = vfp.in_fragment_values[n];
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
					"<form><textarea id='code_"+argKey+"' name='code_"+argKey+"'>"+
					"</textarea></form>"+
					"<div>"+arg.fnvalue+"</div>"+
				"</div>";						
		$('#component_arguments').append(str);
		
		
		
		
		var editor = CodeMirror.fromTextArea(document.getElementById("code_"+argKey), {
	        lineNumbers: true,
	        theme : "eclipse",
	        mode: "javascript" 
	      });
		
		var server = new CodeMirror.TernServer({"defs": defs});
		server.server.addFile("xxx", document.getElementById("cod").innerHTML);
	    editor.setOption("extraKeys", {
	      "Ctrl-Space": function(cm) { server.complete(cm); },
	      "Ctrl-I": function(cm) { server.showType(cm); },
	      "Ctrl-O": function(cm) { server.showDocs(cm); },
	      "Alt-.": function(cm) { server.jumpToDef(cm); },
	      "Alt-,": function(cm) { server.jumpBack(cm); },
	      "Ctrl-Q": function(cm) { server.rename(cm); },
	      "Ctrl-.": function(cm) { server.selectName(cm); }
	    });
	    editor.on("cursorActivity", function(cm) { server.updateArgHints(cm); });
		
		
		
		
		
		
		
		
	    
	    
	    
		ah.add_checkbox(document.getElementById('DIVID_'+argKey), argKey+" UPDATABLE", arg.updatable, 
			(function(comp, argKey) {
				comp.setArgUpdatable(argKey, true);
			}).bind(this, comp, argKey), (function(comp, argKey) {
				comp.setArgUpdatable(argKey, false);
			}).bind(this, comp, argKey));
	}
};