/**
* @class
*/
SimpleNode = function(sce) {	
	"use strict";
	
	var _sce = sce;
	var _project = _sce.getLoadedProject();
	
	var node = new Node();
	_project.getActiveStage().addNode(node);
	
	var mesh = new Mesh().loadBox();
	
	// ComponentTransform
	var comp_transform = new ComponentTransform();
	node.addComponent(comp_transform);
	
	// ComponentRenderer
	var comp_renderer = new ComponentRenderer();
	node.addComponent(comp_renderer);
	comp_renderer.addVFP("NODE_RGB", new VFP_RGB(1), "RGB");			
	comp_renderer.setArg("vertexPos", (function(){return mesh.vertexArray;}).bind(this));
	comp_renderer.setArg("vertexNormal", (function(){return mesh.normalArray;}).bind(this));
	comp_renderer.setArg("vertexTexture", (function(){return mesh.textureArray;}).bind(this));
	comp_renderer.setArg("vertexTextureUnit", (function(){return mesh.textureUnitArray;}).bind(this));
	comp_renderer.setIndices((function(){return mesh.indexArray;}).bind(this));
	comp_renderer.setArg("PMatrix", (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
	comp_renderer.setArgUpdatable("PMatrix", true);
	comp_renderer.setArg("cameraWMatrix", (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
	comp_renderer.setArgUpdatable("cameraWMatrix", true);
	comp_renderer.setArg("nodeWMatrix", (function(){return node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
	comp_renderer.setArgUpdatable("nodeWMatrix", true);
	comp_renderer.setArg("nodesSize", (function(){return 30.0;}).bind(this));
	comp_renderer.setArg("texAlbedo", (function(){return mesh.vertexArray;}).bind(this));
	
	this.setImage = function(url) {
		var image = new Image();
		image.onload = function() {
			comp_renderer.setArg("texAlbedo", (function(){return image;}).bind(this));
		};
		image.src = url;
	};
};