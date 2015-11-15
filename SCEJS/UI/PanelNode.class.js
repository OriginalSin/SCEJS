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
	* @type Void
	*/
	this.show = function() {
		panel.show();
	};

	/**
	* updateNearNode
	* @private
	*/
	var updateNearNode = function() {
		if(selectedNode == undefined) {
			$('#DIVID_StormEditNode_name').html("");
			$('#DIVID_StormEditNode_edits').html('');
		} else {
			if(selectedNode.name != undefined) $('#DIVID_StormEditNode_name').html(selectedNode.name);
			$('#DIVID_StormEditNode_edits').html('');
			
			
			
		
		}
	};
};


