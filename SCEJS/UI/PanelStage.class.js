/**
* @class
* @constructor
*/
PanelStage = function() {
	"use strict";
	
	var panel = new StormPanel({"id": 'DIVID_PanelStage',
								"paneltitle": 'STAGE'});
	
	/**
	 * @callback PanelStage~onselect
	 * @param {Node} node
	 */
	/**
	* show
	* @param {Array<Node>} nodes
	* @param {Node} selectedNode
	* @param {PanelStage~onselect} onselect
	*/
	this.show = function(nodes, selectedNode, onselect) {
		panel.show(); 
		
		showListObjects(nodes, selectedNode, onselect);
	};
	
	/**
	* showListObjects
	* @param {Array<Node>} nodes
	* @param {Node} selectedNode
	* @param {PanelStage~onselect} onselect
	* @private
	*/
	var showListObjects = function(nodes, selectedNode, onselect) {	
		$('#DIVID_PanelStage_content').html("");
		var str = '';
		for(var n=0, f = nodes.length; n < f; n++) {
				var colorBg = (selectedNode != undefined && selectedNode == nodes[n]) ? '#444' : '#000';
				var colorText = (nodes[n].isEnabled() == true) ? '#FFF': '#999';
				str = "<div id='TDID_StormObjectNum_nodes"+n+"' style='background-color:"+colorBg+";color:"+colorText+";'>"+nodes[n].getName()+"</div>";
				$('#DIVID_PanelStage_content').append(str);
				
				var e = document.getElementById("TDID_StormObjectNum_nodes"+n);
				e.addEventListener("click", (function(e, n) {
					onselect(nodes[n]);
					
					select($(e));
				}).bind(this, e, n));
		}
		
		
		
		$("#DIVID_PanelStage_content div").css({	'cursor':'pointer',
												'border':'1px solid #444'});
		$("#DIVID_PanelStage_content div").bind('mouseover', function() {
												$(this).css({'border':'1px solid #CCC'});
											});
		$("#DIVID_PanelStage_content div").bind('mouseout', function() {
												$(this).css({'border':'1px solid #444'});
											});
	};
	/**
	* select
	* @param {HTMLDivElement} element
	* @private
	*/
	var select = function(element) {
		$("#DIVID_PanelStage_content div").css("background-color","#000");
		if(element != undefined) element.css("background-color","#444"); 
	};
};





