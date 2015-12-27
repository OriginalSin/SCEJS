/**
* @class
*/
Voxelizator = function(sce) {
	"use strict";

	var _sce = sce;
	var _project = _sce.getLoadedProject();
	var _gl = _project.getActiveStage().getWebGLContext();
	var _utils = new Utils();
	
	
	
	var _makeVoxels = false;
	var _mesh;
	
	var nodes = new Node();
	nodes.setName("graph_nodes");
	_project.getActiveStage().addNode(nodes);

	// ComponentTransform
	var comp_transform = new ComponentTransform();
	nodes.addComponent(comp_transform);

	// ComponentRenderer
	var comp_renderer_node = new ComponentRenderer();
	nodes.addComponent(comp_renderer_node);
	
	comp_renderer_node.addVFP({"name": "VOXELIZATOR",
		"vfp": new VFP_VOXELIZATOR(),
		"seArgDestination": undefined,
		"drawMode": 4,
		//"geometryLength": 4,
		//"enableDepthTest": false,
		"enableBlend": true, 
		"onPostTick": (function() {
			if(_makeVoxels == true) {
				_makeVoxels = false; 

				

				//comp_renderer_node.disableVfp("VOXELIZATOR");
			}
		}).bind(this)});
	comp_renderer_node.disableVfp("VOXELIZATOR");
	
	/**
	* setMesh
	* @param {Mesh} mesh
	*/
	this.setMesh = function(mesh) {		
		_mesh = mesh;

		comp_renderer_node.setArg("vertexPos", (function(){return _mesh.vertexArray;}).bind(this));
		comp_renderer_node.setArg("vertexNormal", (function(){return _mesh.normalArray;}).bind(this));
		comp_renderer_node.setArg("vertexTexture", (function(){return _mesh.textureArray;}).bind(this));
		comp_renderer_node.setArg("vertexTextureUnit", (function(){return _mesh.textureUnitArray;}).bind(this));
		
		comp_renderer_node.setIndices((function(){return _mesh.indexArray;}).bind(this));
		
		comp_renderer_node.setArg("PMatrix", (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_node.setArgUpdatable("PMatrix", true);
		comp_renderer_node.setArg("cameraWMatrix", (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_node.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_node.setArg("nodeWMatrix", (function(){return node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_node.setArgUpdatable("nodeWMatrix", true);
		
		comp_renderer_node.setArg("texAlbedo", (function(){return _mesh.vertexArray;}).bind(this));
	};
	
	/**
	* setImage
	* @param {String} url
	*/
	this.setImage = function(url) {
		var image = new Image();
		image.onload = function() {
			comp_renderer_node.setArg("texAlbedo", (function(){return image;}).bind(this));
		};
		image.src = url;
	};
	
	/**
	 * makeVoxels
	 * @param {Mesh}
	 */
	this.makeVoxels = function() {
		_makeVoxels = true;

		comp_renderer_node.enableVfp("VOXELIZATOR");
	};
};
