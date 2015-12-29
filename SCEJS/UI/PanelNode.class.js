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
			if(selectedNode.getName() != undefined) $('#DIVID_StormEditNode_name').html(selectedNode.getName());
			$('#DIVID_StormEditNode_edits').html('');
			
			for(var compTypeKey in Constants.COMPONENT_TYPES) {
				for(var nodeCompKey in selectedNode.getComponents()) {
					if(nodeCompKey == Constants.COMPONENT_TYPES[compTypeKey]) {
						var str = 	"<div id='DIVID_component_"+compTypeKey+"' class='component StormShadow02 StormRound'>"+
										compTypeKey+
									"</div>";						
						$('#DIVID_StormEditNode_edits').append(str);
						
						if(nodeCompKey == Constants.COMPONENT_TYPES.RENDERER) {
							new UIComponentRenderer(compTypeKey, selectedNode);							
						} else if(nodeCompKey == Constants.COMPONENT_TYPES.SCREEN_EFFECTS) {
							new UIComponentScreenEffects(compTypeKey, selectedNode);	
						} else if(nodeCompKey == Constants.COMPONENT_TYPES.PROJECTION) {
							
						}
					}
				}	
			}
				
		
		}
	};
};


