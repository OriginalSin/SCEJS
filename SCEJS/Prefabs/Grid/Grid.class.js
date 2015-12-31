/**
* @class
*/
Grid = function(sce) {	
	"use strict";
	
	var _sce = sce;
	var _project = _sce.getLoadedProject();
	var _gl = _project.getActiveStage().getWebGLContext();
	var _utils = new Utils();
	
	var node = new Node();
	node.setName("grid");
	_project.getActiveStage().addNode(node);
	
	var mesh = new Mesh().loadBox();
	
	// ComponentTransform
	var comp_transform = new ComponentTransform();
	node.addComponent(comp_transform);
	
	// ComponentRenderer
	var comp_renderer = new ComponentRenderer();
	node.addComponent(comp_renderer);
	
	this.gridColor = $V3([0.3,0.3,0.3]);
	
	/**
	* Show the grid
	* @type Void
	* @param {Float} [separation=1.0] separation of the grid
	*/
	this.generate = function(gridsize, separation) {  
		this.gridEnabled = true;
		
		this.size = (gridsize != undefined) ? gridsize : this.size;
		this.separation = (separation != undefined) ? separation : this.separation;
		
		this.countLines = (this.size/this.separation)+1;
		this.countLines *= 2;
		
		var startX = -(this.size/2);
		var endX = (this.size/2);
		
		var startZ = -(this.size/2);
		var endZ = (this.size/2);	
		
		var currentX = startX;
		var currentZ = startZ;
		
		
		// generate lines for the grid
		var linesVertexArray = [];
		var linesVertexLocArray = [];
		var linesIndexArray = [];
		this.id = 0;
		for(var n = 0, f = this.countLines; n < f; n++) {
			
			
			if(currentZ <= endZ) {
				// generate lines in Z
				linesVertexArray.push(	startX, 0.0, currentZ, 1.0,
										endX, 0.0, currentZ, 1.0);	
				
				currentZ += this.separation;
			} else {
				// generate lines in X
				linesVertexArray.push(	currentX, 0.0, startZ, 1.0,
										currentX, 0.0, endZ, 1.0);
					
				currentX += this.separation;
			}
			
			linesVertexLocArray.push(this.gridColor.e[0], this.gridColor.e[1], this.gridColor.e[2], 1.0,
									this.gridColor.e[0], this.gridColor.e[1], this.gridColor.e[2], 1.0);
			linesIndexArray.push(this.id, this.id+1);
			
			this.id += 2;
		}
		
		// generate lines for axis
		// X
		linesVertexArray.push(	0.0, 0.0, 0.0, 1.0,
								10.0, 0.0, 0.0, 1.0);
		linesVertexLocArray.push(1.0, 0.0, 0.0, 1.0,
								1.0, 0.0, 0.0, 1.0);
		linesIndexArray.push(this.id, this.id+1);
		this.id += 2;
		
		// Y
		linesVertexArray.push(	0.0, 0.0, 0.0, 1.0,
								0.0, 10.0, 0.0, 1.0);
		linesVertexLocArray.push(0.0, 1.0, 0.0, 1.0,
								0.0, 1.0, 0.0, 1.0);
		linesIndexArray.push(this.id, this.id+1);
		this.id += 2;
		
		// Z
		linesVertexArray.push(	0.0, 0.0, 0.0, 1.0,
								0.0, 0.0, 10.0, 1.0);
		linesVertexLocArray.push(0.0, 0.0, 1.0, 1.0,
								0.0, 0.0, 1.0, 1.0);
		linesIndexArray.push(this.id, this.id+1);
		
		
		comp_renderer.addVFP({	"name": "GRID",
								"vfp": new VFP_GRID(),
								"drawMode": 1, 
								"onPreTick": (function() {
									 comp_renderer.setVfpArgDestination("GRID", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS).getBuffers()["RGB"]);
								}).bind(this)});			
		comp_renderer.setArg("vertexPos", (function(){return linesVertexArray;}).bind(this));
		comp_renderer.setArg("vertexColor", (function(){return linesVertexLocArray;}).bind(this));
		comp_renderer.setIndices((function(){return linesIndexArray;}).bind(this));
		comp_renderer.setArg("PMatrix", (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer.setArgUpdatable("PMatrix", true);
		comp_renderer.setArg("cameraWMatrix", (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer.setArgUpdatable("cameraWMatrix", true);
		comp_renderer.setArg("nodeWMatrix", (function(){return node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer.setArgUpdatable("nodeWMatrix", true);
	};
};