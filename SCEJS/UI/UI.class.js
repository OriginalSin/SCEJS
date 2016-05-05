/**
* @class
* @constructor
*/
UI = function(project) {
	"use strict";
	
	var _project = project;
	var panel_Stage = null;
	var panel_Node = null;
	var panel_NumberGenerator = null;
	
	
	/**
	 * render
	 * @param {HTMLDivElement} target
	 */
	this.render = function(target, canvas) {
		var str = ''+
		'<ul id="TopMenu_'+target.id+'">'+
	    	'<li>'+
	    		'Data'+
		        '<ul>'+
		            '<li id="TOPMENU_'+target.id+'_openFile">Open File...</li>'+
		        '</ul>'+
		    '</li>'+
		    '<li>'+
		        'View..'+
		        '<ul>'+
			        '<li class="sub">'+
			            'Panels'+
			            '<ul>'+
			                '<li id="TOPMENU_'+target.id+'_view_PanelStage">Panel Stage...</li>'+
			                '<li id="TOPMENU_'+target.id+'_view_PanelNode">Panel Node...</li>'+
			                '<li id="TOPMENU_'+target.id+'_view_PanelNumberGenerator">Panel Number Generator...</li>'+
			            '</ul>'+
			        '</li>'+
		        '</ul>'+
		    '</li>'+
		'</ul>';
		//target.innerHTML = "";
		new ActionHelpers().appendStringChild(str, target, "init");
		
		$('#TopMenu_'+target.id).fileMenu({
	        slideSpeed: 0
	    });
		//document.getElementById("TopMenu_"+target.id).style.position = "absolute";
        document.getElementById("TopMenu_"+target.id).style.width = canvas.clientWidth+"px";
		document.getElementById("TopMenu_"+target.id).style.fontSize = "8px";
		document.getElementById("TopMenu_"+target.id).style.padding = "2px";
		
		//fileLoader.render(document.body);

		panel_Stage = new PanelStage();
		panel_Node = new PanelNode();
		panel_NumberGenerator = new PanelNumberGenerator();
		
		
		// controllers
		DGE("TopMenu_"+target.id).addEventListener("mouseover", (function() {
			//_project.getActiveStage().pause();
		}).bind(this));	
		DGE("TopMenu_"+target.id).addEventListener("mouseout", (function() {
			//_project.getActiveStage().render();
		}).bind(this));
		
		
		DGE("TOPMENU_"+target.id+"_openFile").addEventListener("click", (function() {
			//fileLoader.openDialog(); 
		}).bind(this));
		
		DGE("TOPMENU_"+target.id+"_view_PanelStage").addEventListener("click", (function(e) {
			e.preventDefault();
			e.stopPropagation();
			panel_Stage.show(_project.getActiveStage().getNodes(), _project.getActiveStage().getSelectedNode(), function(node) {
				_project.getActiveStage().setSelectedNode(node);
				
				panel_Node.show(_project.getActiveStage().getSelectedNode());
			});
		}).bind(this));
		
		DGE("TOPMENU_"+target.id+"_view_PanelNode").addEventListener("click", (function(e) {
			e.preventDefault();
			e.stopPropagation();
			panel_Node.show(_project.getActiveStage().getSelectedNode());
		}).bind(this));
		
		DGE("TOPMENU_"+target.id+"_view_PanelNumberGenerator").addEventListener("click", (function(e) {
			e.preventDefault();
			e.stopPropagation();
			panel_NumberGenerator.show();
		}).bind(this));
	}; 
};

