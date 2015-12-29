/**
* @class
* @constructor
*/
UIComponentScreenEffects = function(compTypeKey, selectedNode) {
	"use strict";

	var ah = new ActionHelpers();

	var comp = selectedNode.getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);

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


	var str = "<div id='DIVID_"+compTypeKey+"' class='component_section'></div>";
	//$('#DIVID_component_'+compTypeKey).append(str);
	ah.appendStringChild(str, document.getElementById('DIVID_component_'+compTypeKey));








	// INDICES
	/*var str = 	"<div id='DIVID_indices' style='background:rgba(0,0,0,0.5);padding-left:3px'>"+
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
	ah.appendStringChild(str, document.getElementById('DIVID_'+compTypeKey));*/

	// ARGS
	str = "<div id='DIVID_"+compTypeKey+"_args' style='display:inline-block;border:1px solid #333;'>";
		str += "<div>ARGUMENTS</div>";
	for(var argKey in args) {
		var arg = args[argKey];

		str += "<div id='DIVID_"+argKey+"_args'><span style='font-weight:bold;color:rgba(200,200,255,0.5)'>"+arg.type+"</span> "+argKey+" <input type='checkbox' id='CHECKBOX_UPDATE_"+argKey+"' title='update on tick' style='width:8px;height:8px;margin:0px;vertical-align:middle' />";
		if(arg.value != undefined) {
			if(arg.value instanceof WebCLGLBuffer) {
				var strItems = "", sep = "";
				for(var j=0; j < arg.value.items.length; j++) {
					strItems += sep+"<span title='"+arg.value.items[j].inData+"'>"+arg.value.items[j].length+"</span>";
					sep = ",";
				}
				str += " <span style='color:rgb(150, 255, 150)'> {WebCLGLBuffer "+strItems+"}</span>";
			} else if(arg.value instanceof Float32Array || arg.value instanceof Array) {
				str += " <span style='color:rgb(150, 255, 150)'> {"+arg.value.constructor.name+" <span title='"+arg.value+"'>"+arg.value.length+"</span>}</span>";
			} else {
				str += " <span style='color:rgb(150, 255, 150)'> {<span title='"+arg.value+"'>"+arg.value.constructor.name+"</span>}</span>";
			}
		}
		str += "</div>";
	}
	str += "</div>";
	ah.appendStringChild(str, document.getElementById('DIVID_'+compTypeKey));
	//$('#DIVID_'+compTypeKey).append(str);

	for(var argKey in args) {
		var arg = args[argKey];

		if(comp.getArgs()[argKey] != undefined && comp.getArgs()[argKey].updatable != null) {
			var e = document.getElementById("CHECKBOX_UPDATE_"+argKey);
			e.checked = (comp.getArgs()[argKey].updatable == true) ? true : false;
			e.addEventListener("click", (function(comp, argKey) {
				if(e.checked == false) {
					comp.setArgUpdatable(argKey, false);
				} else {
					comp.setArgUpdatable(argKey, true);
				}
			}).bind(this, comp, argKey));
		}

		var e = document.getElementById("DIVID_"+argKey+"_args");
		e.addEventListener('dragover', (function(e, evt) {
			if(evt.preventDefault)
				evt.preventDefault(); // Necessary. Allows us to drop.

			evt.dataTransfer.dropEffect = 'move';
			e.style.background = "rgba(150, 255, 150, 0.3)";
		}).bind(this, e), false);

		e.addEventListener('dragleave', (function(e, evt) {
			e.style.background = "transparent";
		}).bind(this, e), false);

		e.addEventListener('drop', (function(e, comp, argKey, evt) {
			if(evt.stopPropagation) {
				evt.stopPropagation(); // Stops some browsers from redirecting.
			  	evt.preventDefault();
			}

			e.style.background = "transparent";

			var data = evt.dataTransfer.getData('text/plain');
			var type = data.match(/,/i) ? "array": "image";
			if(type == "image") {
				var image = new Image();
				image.onload = (function(comp, argKey, image) {
					comp.setArg(argKey, (function(){return image;}).bind(this));
				}).bind(this, comp, argKey, image);
				image.src = data;
			} else {
				comp.setArg(argKey, (function(){return data.split(",");}).bind(this));
			}

			//comp.setArg(argKey, (function(evt) {return evt.dataTransfer.getData('text/plain');}).bind(this, evt));
		}).bind(this, e, comp, argKey), false);
	}

	//KERNELS
	for(var kernelKey in comp.getKernels()) {
		var kernel = comp.getKernels()[kernelKey];

		// fragment programs
		str = "<div id='DIVID_"+kernelKey+"_kernels' style='display:inline-block;border:1px solid #333;'>";
			str += "<div>KERNEL NAME: "+kernelKey+"</div>"+
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
