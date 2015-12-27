/**
* @class
*/
SimpleNode = function(sce) {
	"use strict";

	var _sce = sce;
	var _project = _sce.getLoadedProject();

	var node = new Node();
	_project.getActiveStage().addNode(node);

	var _mesh;

	// ComponentTransform
	var comp_transform = new ComponentTransform();
	node.addComponent(comp_transform);

	// ComponentRenderer
	var comp_renderer = new ComponentRenderer();
	node.addComponent(comp_renderer);
	comp_renderer.addVFP({"name": "NODE_RGB",
							"vfp": new VFP_RGB(1),
							"seArgDestination": "RGB",
							"drawMode": 4});


	/**
	* setMesh
	* @param {Mesh} mesh
	*/
	this.setMesh = function(mesh) {
		_mesh = mesh;

		comp_renderer.setArg("vertexPos", (function(){return _mesh.vertexArray;}).bind(this));
		comp_renderer.setArg("vertexNormal", (function(){return _mesh.normalArray;}).bind(this));
		comp_renderer.setArg("vertexTexture", (function(){return _mesh.textureArray;}).bind(this));
		comp_renderer.setArg("vertexTextureUnit", (function(){return _mesh.textureUnitArray;}).bind(this));
		
		comp_renderer.setIndices((function(){return _mesh.indexArray;}).bind(this));
		
		comp_renderer.setArg("PMatrix", (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer.setArgUpdatable("PMatrix", true);
		comp_renderer.setArg("cameraWMatrix", (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer.setArgUpdatable("cameraWMatrix", true);
		comp_renderer.setArg("nodeWMatrix", (function(){return node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer.setArgUpdatable("nodeWMatrix", true);
		
		comp_renderer.setArg("nodesSize", (function(){return 30.0;}).bind(this));
		comp_renderer.setArg("texAlbedo", (function(){return _mesh.vertexArray;}).bind(this));
	};

	/**
	* setImage
	* @param {String} url
	*/
	this.setImage = function(url) {
		var image = new Image();
		image.onload = function() {
			comp_renderer.setArg("texAlbedo", (function(){return image;}).bind(this));
		};
		image.src = url;
	};
};
