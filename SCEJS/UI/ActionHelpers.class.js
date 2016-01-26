/**
* @class
* @constructor
*/
ActionHelpers = function() {
	"use strict";
	
	var firstColumWidth = "40%";
	var secondColumWidth = "60%";
	
	/**
	 * appendStringChild
	 * @param {String} str
	 * @param {HTMLElement} target
	 * @param {String} [location="end"] end or init
	 */
	this.appendStringChild = function(str, target, location) {
		var loc = (location != undefined) ? location : "end";
		var parser = new DOMParser();
		var e = parser.parseFromString(str, "text/html");
		
		if(loc == "end") 
			target.appendChild(e.body.firstChild);
		else 
			target.insertBefore(e.body.firstChild, target.firstChild);
	};

	/**
	 * add_btn
	 * @param {HTMLElement} target
	 * @param {String} name
	 * @param {Function} onClickCallback
	 */
	this.add_btn = function(target, name, onClickCallback) {
		var str = ''+
		'<div>'+
			"<button id='BUTTONID_"+name+"' style='width:100%'>"+name+"</button>"+
		'</div>';
		this.appendStringChild(str, target);
		
		var e = document.getElementById("BUTTONID_"+name);
		e.addEventListener('click', (function(callback) {
			callback();
		}).bind(this, onClickCallback));
	};

	/**
	 * @callback ActionHelpers~add_valuesAndBtn~onClickCallback
	 * @param {Array<Float>} arr
	 */
	/**
	 * add_valuesAndBtn
	 * @param {HTMLElement} target
	 * @param {String} name
	 * @param {String} type Type for the input (number, text, etc..)
	 * @param {Array<String>} arrayTexts
	 * @param {Array<String|Float|Int>} arrayDefaultValues
	 * @param {ActionHelpers~add_valuesAndBtn~onClickCallback} onClickCallback
	 */
	this.add_valuesAndBtn = function(target, name, type, arrayTexts, arrayDefaultValues, onClickCallback) {
		var str = ''+
		'<div>'+
			'<div style="display:inline-block;width:'+firstColumWidth+';vertical-align:top;overflow:hidden;">'+
				"<button id='BUTTONID_"+name+"' style='width:100%'>"+name+"</button>"+
			'</div>'+
			'<div style="display:inline-block;width:'+secondColumWidth+';">';
				for(var n=0; n < arrayTexts.length; n++) {
					str += '<input type="'+type+'" id="INPUTID_'+name+'_'+arrayTexts[n]+'" step="'+(arrayDefaultValues[n]/20)+'" value="'+arrayDefaultValues[n]+'" title="'+arrayTexts[n]+'" style="width:'+((100/arrayTexts.length)-1)+'%"/>';			
				}	
			str += "</div>"+
		'</div>';
		this.appendStringChild(str, target);
			
		var e = document.getElementById("BUTTONID_"+name);
		e.addEventListener('click', (function(callback) {
			var arrayValues = [];
			for(var n=0; n < arrayTexts.length; n++) {
				arrayValues.push($('#INPUTID_'+name+'_'+arrayTexts[n]).val());
			}
			callback(arrayValues);
		}).bind(this, onClickCallback));
	};

	/**
	 * add_checkbox
	 * @param {HTMLElement} target
	 * @param {String} name
	 * @param {Int|Bool} variable
	 * @param {Function} checkCallback
	 * @param {Function} uncheckCallback
	 */
	this.add_checkbox = function(target, name, variable, checkCallback, uncheckCallback) {
		var str = ''+
		'<div>'+
			'<div style="display:inline-block;width:'+firstColumWidth+';vertical-align:top;overflow:hidden;">'+
				name+
			'</div>'+
			'<div style="display:inline-block;width:'+secondColumWidth+';">'+
				'<input type="checkbox" id="INPUTID_'+name+'" />'+
			'</div>'+
		'</div>';
		this.appendStringChild(str, target);
		
		var e = document.getElementById("INPUTID_"+name);
		if(variable === true || variable === 1) {
			e.checked = true;
		} else {
			e.checked = false;
		}
		
		e.addEventListener("click", (function(checkCall, uncheckCall, e) {	
			if(e.checked == false) {
				uncheckCall();
			} else {
				checkCall();
			}
		}).bind(this, checkCallback, uncheckCallback, e));
	};

	/**
	 * add_select
	 * @param {HTMLElement} target
	 * @param {String} name
	 * @param {Array<String>} valuesArray
	 * @param {Any} variable
	 * @param {Function} selectCallback
	 */
	this.add_select = function(target, name, valuesArray, variable, selectCallback) {
		var str = ''+
		'<div>'+
			'<div style="display:inline-block;width:'+firstColumWidth+';vertical-align:top;overflow:hidden;">'+
				name+
			'</div>'+
			'<div style="display:inline-block;width:'+secondColumWidth+';">'+
				'<select id="SELECTID_'+name+'" style="width:100%">';
			for(var n=0; n < valuesArray.length; n++) {
				var isSelected = "";
				if(variable == valuesArray[n]) 
					isSelected = "selected='selected'";
				
				str += "<option value='"+valuesArray[n]+"' "+isSelected+">"+valuesArray[n]+"</option>";
			}					
			str += '</select>'+
			'</div>'+
		'</div>';
		this.appendStringChild(str, target);
			
		var e = document.getElementById("SELECTID_"+name);
		e.addEventListener("change", (function(callback, e) {
			callback(e.options[e.selectedIndex].value);
		}).bind(this, selectCallback, e));
	};

	/**
	 * add_slider
	 * @param {HTMLElement} target
	 * @param {String} name
	 * @param {Float} fvalue
	 * @param {Float} min
	 * @param {Float} max
	 * @param {Float} steps
	 * @param {Function} onChangeCallback
	 */
	this.add_slider = function(target, name, fvalue, min, max, steps, onChangeCallback) {
		var str = ''+
		'<div>'+
			'<div style="display:inline-block;width:'+firstColumWidth+';vertical-align:top;overflow:hidden;">'+
				name+
			'</div>'+
			'<div style="display:inline-block;width:'+secondColumWidth+';">'+
				'<input id="INPUTID_'+name+'X" type="number" 		min="'+min+'" max="'+max+'" step="'+steps+'" value="'+fvalue+'" style="vertical-align:middle;width:20%">'+
				'<input id="INPUTID_'+name+'X_slider" type="range" 	min="'+min+'" max="'+max+'" step="'+steps+'" value="'+fvalue+'" style="vertical-align:middle;width:78%">'+
			'</div>'+
		'</div>';
		this.appendStringChild(str, target);
		
		var exec_call = function(callback, e) {
			var value = document.getElementById("INPUTID_"+name+"X").value;
			callback(parseFloat(value));
		};
		
		// spinners
		var set_spinner = function(callback, e) {
			e.nextSibling.value = parseFloat(e.value).toFixed(3);
			
			exec_call(callback, e);
		};
		
		var e = document.getElementById("INPUTID_"+name+"X");
		e.addEventListener("mousewheel", set_spinner.bind(this, onChangeCallback, e));
		e.addEventListener("keydown", set_spinner.bind(this, onChangeCallback, e));
		e.addEventListener("keyup", set_spinner.bind(this, onChangeCallback, e));
		e.addEventListener("click", set_spinner.bind(this, onChangeCallback, e));
		
		
		// range elements
		var set_range = function(callback, e) {
			e.previousSibling.value = parseFloat(e.value).toFixed(3);
			
			exec_call(callback, e);
		};
		
		var e = document.getElementById("INPUTID_"+name+"X_slider");
		e.addEventListener("input", set_range.bind(this, onChangeCallback, e));
	};

	/**
	 * add_3dslider
	 * @param {HTMLElement} target
	 * @param {String} name
	 * @param {Array<Float>} array3f Three float values
	 * @param {Float} min
	 * @param {Float} max
	 * @param {Float} steps
	 * @param {Function} onChangeCallback
	 */
	this.add_3dslider = function(target, name, array3f, min, max, steps, onChangeCallback) {
		var str = ''+
		'<div>'+
			'<div style="display:inline-block;width:'+firstColumWidth+';vertical-align:top;overflow:hidden;">'+
				name+
			'</div>'+
			'<div style="display:inline-block;width:'+secondColumWidth+';">'+
				'<input id="INPUTID_'+name+'X" type="number" 		min="'+min+'" max="'+max+'" step="'+steps+'" value="'+array3f[0]+'" style="background:red;color:#FFF;vertical-align:middle;width:20%">'+
				'<input id="INPUTID_'+name+'X_slider" type="range" 	min="'+min+'" max="'+max+'" step="'+steps+'" value="'+array3f[0]+'" style="background:red;color:#FFF;vertical-align:middle;width:78%">'+
				
				'<input id="INPUTID_'+name+'Y" type="number" 		min="'+min+'" max="'+max+'" step="'+steps+'" value="'+array3f[1]+'" style="background:green;color:#FFF;vertical-align:middle;width:20%">'+
				'<input id="INPUTID_'+name+'Y_slider" type="range" 	min="'+min+'" max="'+max+'" step="'+steps+'" value="'+array3f[1]+'" style="background:green;color:#FFF;vertical-align:middle;width:78%">'+
				
				'<input id="INPUTID_'+name+'Z" type="number" 		min="'+min+'" max="'+max+'" step="'+steps+'" value="'+array3f[2]+'" style="background:blue;color:#FFF;vertical-align:middle;width:20%">'+
				'<input id="INPUTID_'+name+'Z_slider" type="range" 	min="'+min+'" max="'+max+'" step="'+steps+'" value="'+array3f[2]+'" style="background:blue;color:#FFF;vertical-align:middle;width:78%">'+
			'</div>'+
		'</div>';
		this.appendStringChild(str, target);
		
		var exec_call = function(callback, e) {
			var vector = [document.getElementById("INPUTID_"+name+"X").value, document.getElementById("INPUTID_"+name+"Y").value, document.getElementById("INPUTID_"+name+"Z").value];
			callback(vector);
		};
		
		// spinners
		var set_spinner = function(callback, e) {
			e.nextSibling.value = parseFloat(e.value).toFixed(3);
			
			exec_call(callback, e);
		};
		
		var e = document.getElementById("INPUTID_"+name+"X");
		e.addEventListener("mousewheel", set_spinner.bind(this, onChangeCallback, e));
		e.addEventListener("keydown", set_spinner.bind(this, onChangeCallback, e));
		e.addEventListener("keyup", set_spinner.bind(this, onChangeCallback, e));
		e.addEventListener("click", set_spinner.bind(this, onChangeCallback, e));
			
		var e = document.getElementById("INPUTID_"+name+"Y");
		e.addEventListener("mousewheel", set_spinner.bind(this, onChangeCallback, e));
		e.addEventListener("keydown", set_spinner.bind(this, onChangeCallback, e));
		e.addEventListener("keyup", set_spinner.bind(this, onChangeCallback, e));
			
		var e = document.getElementById("INPUTID_"+name+"Z");
		e.addEventListener("mousewheel", set_spinner.bind(this, onChangeCallback, e));
		e.addEventListener("keydown", set_spinner.bind(this, onChangeCallback, e));
		e.addEventListener("keyup", set_spinner.bind(this, onChangeCallback, e));
		
		
		// range elements
		var set_range = function(callback, e) {
			e.previousSibling.value = parseFloat(e.value).toFixed(3);
			
			exec_call(callback, e);
		};
		
		var e = document.getElementById("INPUTID_"+name+"X_slider");
		e.addEventListener("change", set_range.bind(this, onChangeCallback, e));
		
		var e = document.getElementById("INPUTID_"+name+"Y_slider");
		e.addEventListener("change", set_range.bind(this, onChangeCallback, e));
		
		var e = document.getElementById("INPUTID_"+name+"Z_slider");
		e.addEventListener("change", set_range.bind(this, onChangeCallback, e));
	};

	/**
	 * add_colorpicker
	 * @param {HTMLElement} target
	 * @param {String} name
	 * @param {String} hexVariable
	 * @param {Function} onChangeCallback
	 */
	this.add_colorpicker = function(target, name, hexVariable, onChangeCallback) {
		var str = ''+
		'<div>'+
			'<div style="display:inline-block;width:'+firstColumWidth+';overflow:hidden;">'+
				name+
			'</div>'+
			'<div style="display:inline-block;width:'+secondColumWidth+';">'+
				'<input type="color" id="INPUTID_'+name+'" value="'+hexVariable+'" style="width:100%">'+
			'</div>'+
		'</div>';
		this.appendStringChild(str, target);
		
		var e = document.getElementById("INPUTID_"+name);
		e.addEventListener("change", (function(callback, e) {			
			callback(e.value);
		}).bind(this, onChangeCallback, e));
	}; 

	/**
	 * @callback ActionHelpers~add_imageSelection~onChangeCallback
	 * @param {HTMLImageElement} img
	 */
	/**
	 * add_imageSelection
	 * @param {HTMLElement} target
	 * @param {String} name
	 * @param {ActionHelpers~add_imageSelection~onChangeCallback} onChangeCallback
	 */
	this.add_imageSelection = function(target, name, onChangeCallback) {
		var str = ''+
		'<div>'+
			'<div style="display:inline-block;width:'+firstColumWidth+';overflow:hidden;">'+
				name+
			'</div>'+
			'<div style="display:inline-block;width:'+secondColumWidth+';">'+
				"<input id='INPUTID_"+name+"' type='file' style='display:none'/>"+
				"<div id='DIVID_"+name+"' onclick='$(this).prev().click();' style='cursor:pointer;width:16px;height:16px;border:1px solid #FFF'></div>"+
			"</div>"+
		'</div>';
		this.appendStringChild(str, target);
		
		document.getElementById('INPUTID_'+name).onchange=function() {
			var filereader = new FileReader();
			filereader.onload = function(event) {
				var img = new Image();
				img.onload = function() {
					var splitName = $('#INPUTID_'+name).val().split('/');
					splitName = splitName[splitName.length-1];								
					//img.style.width = '16px';
					//img.style.height = '16px';
					$('#DIVID_'+name).html(img);
					$('#DIVID_'+name).attr('title',splitName);
					
					onChangeCallback(img);
				};
				img.src = event.target.result; // Set src from upload, original byte sequence
			};
			filereader.readAsDataURL(this.files[0]);
		};
	}; 
};

