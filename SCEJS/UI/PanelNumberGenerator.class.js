/**
* @class
* @constructor
*/
PanelNumberGenerator = function() {
	"use strict";
	
	var panel = new StormPanel({"id": 'DIVID_PanelNumberGenerator',
								"paneltitle": 'NUMBER GENERATOR'});
	
	var ah = new ActionHelpers();
	
	/**
	* show
	* @param {Array<Node>} nodes
	* @param {Node} selectedNode
	* @param {Function} onselect
	* @param {Node} onselect.node
	*/
	this.show = function() {
		panel.show(); 
		
		showListObjects();
	};
	
	/**
	* showListObjects
	* @param {Array<Node>} nodes
	* @param {Node} selectedNode
	* @param {Function} onselect
	* @param {Node} onselect.node
	* @private
	*/
	var showListObjects = function() {	
		var eContent = document.getElementById('DIVID_PanelNumberGenerator_content');
		eContent.innerHTML = "";
		
		ah.add_imageSelection(eContent, "LOAD_IMG", function(img) {
			eContent.appendChild(img);
			eContent.innerHTML += img.width+"x"+img.height+"="+img.width*img.height;
			
			img.setAttribute("draggable", true);
			img.addEventListener('dragstart', function(evt) {
				evt.dataTransfer.effectAllowed = 'move';
				evt.dataTransfer.setData("text/plain", img.src);
			}, false);
		});
		
		
		var getArr = (function(arr, elementItems) {			
			var arrayOut = [];			
			var itemValues = [];
						
			var length = arr[0];
			for(var n=1; n < arr[1]; n++)
				length *= arr[0];
			
			var repeat = arr[2];
			
			for(var n=0; n < length*arr[2]; n++) {
				if(repeat == arr[2]) {
					repeat = 0;
					itemValues = [];
					
					for(var i=0; i < elementItems; i++)
						itemValues.push(1.0-(Math.random()*2.0));
				}
				for(var i=0; i < elementItems; i++)
					arrayOut.push(itemValues[i]);
				
				repeat++;				
			}
			
			 
			var btn = document.createElement("button");
			btn.innerHTML = "arr";
			btn.setAttribute("draggable", true);
			eContent.appendChild(btn);
			
			btn.addEventListener('dragstart', (function(arrayOut, evt) {
				console.log(arrayOut);
				evt.dataTransfer.effectAllowed = 'move';
				evt.dataTransfer.setData("text/plain", arrayOut);
			}).bind(this, arrayOut), false);
		}).bind(this);
		
		ah.add_valuesAndBtn(eContent, "CREATE_RANDOM_FLOAT", "number", ["length", "dimensions", "repeat_FLOAT"], [128, 2, 14],
				(function(arr) {
					getArr(arr, 1);
				}).bind(this));
		
		ah.add_valuesAndBtn(eContent, "CREATE_RANDOM_FLOAT4", "number", ["length", "dimensions", "repeat_FLOAT4"], [128, 2, 14], 
				(function(arr) {
					getArr(arr, 4);
				}).bind(this));
		
	};
};





