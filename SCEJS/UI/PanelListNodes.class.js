/**
* @class
* @constructor
*/
PanelListNodes = function() {
	"use strict";
	
	var panel = new StormPanel({"id": 'DIVID_StormPanelListObjects',
								"paneltitle": 'LIST NODES'});
	
	/**
	* show
	* @param {Stage} stage
	* @param {Node} selectedNode
	* @param {Function} onselect
	* @param {Node} onselect.node
	*/
	this.show = function(stage, selectedNode, onselect) {
		panel.show(); 
		
		showListObjects(stage, selectedNode, onselect);
	};
	
	/**
	* showListObjects
	* @param {Array<Node>} nodes
	* @param {Node} selectedNode
	* @param {Function} onselect
	* @param {Node} onselect.node
	* @private
	*/
	var showListObjects = function(nodes, selectedNode, onselect) {	
		$('#DIVID_StormPanelListObjects_content').html("");
		var str = '';
		for(var n=0, f = nodes.length; n < f; n++) {
				var colorBg = (selectedNode != undefined && selectedNode == nodes[n]) ? '#444' : '#000';
				var colorText = (nodes[n].isEnabled() == true) ? '#FFF': '#999';
				str = "<div id='TDID_StormObjectNum_nodes"+n+"' style='background-color:"+colorBg+";color:"+colorText+";'>"+nodes[n].name+"</div>";
				$('#DIVID_StormPanelListObjects_content').append(str);
				
				var e = document.getElementById("TDID_StormObjectNum_nodes"+n);
				e.addEventListener("click", (function(e, n) {
					onselect(nodes[n]);
					
					select($(e));
				}).bind(this, e, n));
		}
		
		
		
		$("#DIVID_StormPanelListObjects_content div").css({	'cursor':'pointer',
												'border':'1px solid #444'});
		$("#DIVID_StormPanelListObjects_content div").bind('mouseover', function() {
												$(this).css({'border':'1px solid #CCC'});
											});
		$("#DIVID_StormPanelListObjects_content div").bind('mouseout', function() {
												$(this).css({'border':'1px solid #444'});
											});
	};
	/**
	* select
	* @param {HTMLDivElement} element
	* @private
	*/
	var select = function(element) {
		$("#DIVID_StormPanelListObjects_content div").css("background-color","#000");
		if(element != undefined) element.css("background-color","#444"); 
	};
};





