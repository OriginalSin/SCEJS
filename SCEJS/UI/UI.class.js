/**
* @class
* @constructor
*/
UI = function(project) {
	"use strict";
	
	var _project = project;
	var panel_ListNodes = null;
	var panel_Node = null;
	
	
	/**
	 * render
	 * @param {HTMLDivElement} target
	 */
	this.render = function(target) {	
		var str = ''+
		'<ul id="TopMenu">'+
	    	'<li>'+
	    		'Data'+
		        '<ul>'+
		            '<li id="TOPMENU_openFile">Open File...</li>'+
		        '</ul>'+
		    '</li>'+
		    '<li>'+
		        'View..'+
		        '<ul>'+
			        '<li class="sub">'+
			            'Panels'+
			            '<ul>'+
			                '<li id="TOPMENU_view_PanelListNodes">Panel List Nodes...</li>'+
			                '<li id="TOPMENU_view_PanelNode">Panel Node...</li>'+
			            '</ul>'+
			        '</li>'+
		        '</ul>'+
		    '</li>'+
		'</ul>';
		//target.innerHTML = "";
		new ActionHelpers().appendStringChild(str, target, "init");
		
		$('#TopMenu').fileMenu({
	        slideSpeed: 200
	    });
		document.getElementById("TopMenu").style.position = "absolute";
		document.getElementById("TopMenu").style.fontSize = "8px";
		document.getElementById("TopMenu").style.padding = "2px";
		
		//fileLoader.render(document.body);
	    
		panel_ListNodes = new PanelListNodes();
		panel_Node = new PanelNode();
		
		
		// controllers
		DGE("TopMenu").addEventListener("mouseover", (function() {
			//secMgr.getEngine().setWebGLpause(true);
		}).bind(this));	
		DGE("TopMenu").addEventListener("mouseout", (function() {
			//secMgr.getEngine().setWebGLpause(false);
		}).bind(this));
		
		
		DGE("TOPMENU_openFile").addEventListener("click", (function() {
			//fileLoader.openDialog(); 
		}).bind(this));
		
		DGE("TOPMENU_view_PanelListNodes").addEventListener("click", (function() {
			panel_ListNodes.show(_project.getActiveStage().getNodes(), _project.getActiveStage().getSelectedNode(), function(node) {
				_project.getActiveStage().setSelectedNode(node);
				
				panel_Node.show(_project.getActiveStage().getSelectedNode());
			});
		}).bind(this));
		
		DGE("TOPMENU_view_PanelNode").addEventListener("click", (function() {
			panel_Node.show(_project.getActiveStage().getSelectedNode());
		}).bind(this));
	}; 
};

