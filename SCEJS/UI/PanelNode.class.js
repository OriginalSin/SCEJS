/**
* @class
* @constructor
*/
PanelNode = function() {
	"use strict";
	
	var html = '<span style="font-weight:bold" id="DIVID_StormEditNode_name"></span>'+
				'<div id="DIVID_StormEditNode_edits"></div>';
	var panel = new StormPanel({"id": 'DIVID_StormPanelEditNode',
								"paneltitle": 'NODE',
								"html": html});
	
	/**
	 * show
	* @param {Node} selectedNode
	*/
	this.show = function(selectedNode) {
		panel.show();
		
		updateNearNode(selectedNode);
	};

	/**
	* updateNearNode
	* @param {Node} selectedNode
	* @private
	*/
	var updateNearNode = function(selectedNode) {
		if(selectedNode == undefined) {
			$('#DIVID_StormEditNode_name').html("");
			$('#DIVID_StormEditNode_edits').html('');
		} else {
			if(selectedNode.name != undefined) $('#DIVID_StormEditNode_name').html(selectedNode.getName());
			$('#DIVID_StormEditNode_edits').html('');
			
			for(var compType in Constants.COMPONENT_TYPES) {
				for(var nodeComp in selectedNode.getComponents()) {
					if(nodeComp == Constants.COMPONENT_TYPES[compType]) {
						var str = 	"<div>"+compType+"</div>";						
						$('#DIVID_StormEditNode_edits').append(str);
					}
				}	
			}
				
		
		}
	};
};


