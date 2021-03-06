/**
* @class
* @constructor
*/
UIComponentGPU_Argument = function(targetElement, selectedNode, comp, args) {
	"use strict";

	var ah = new ActionHelpers();


	// ARGS
	var str = "<div id='"+targetElement.id+"_args' style='width:inherit;display:table-cell;vertical-align:top;'>"+
		"<div style='height:251px;'>"+
			"<div>ARGUMENTS</div>"+
		"</div>";

	    var b = false;
		for(var argKey in args) {
			var arg = args[argKey];
	
			str +=  "<div id='DIVID_"+argKey+"_args' title='"+arg+"' style='background-color:"+((b==true)?"rgba(0,0,0,0.0)":"rgba(0,0,0,0.07)")+"'>"+
			            argKey+
                    " <input type='checkbox' id='CHECKBOX_UPDATE_"+argKey+"' title='update on tick' style='width:8px;height:8px;margin:0px;vertical-align:middle' />";

                    if(arg != undefined) {
                        if(arg instanceof WebCLGLBuffer) {
                            str += " <span style='color:rgb(150, 255, 150)'> {WebCLGLBuffer "+arg.length+"}</span>";
                        } else if(arg instanceof Float32Array || arg instanceof Array) {
                            str += " <span style='color:rgb(150, 255, 150)'> {"+arg.constructor.name+" "+arg.length+"}</span>"; // arg.value
                        } else {
                            str += " <span style='color:rgb(150, 255, 150)'> {<span>"+arg.constructor.name+" "+arg+"}</span>"; // arg.value
                        }
                    }

			str += "</div>";


            b=!b;
		}
	str += "</div>";
	ah.appendStringChild(str, targetElement);
	

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
	
};
