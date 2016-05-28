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


	/**
	* setMesh
	* @param {Mesh} mesh
	*/
	this.setMesh = function(mesh) {
		_mesh = mesh;

        comp_renderer.setGPUFor( comp_renderer.gl,
                                {   "float4*attr vertexPos": (function(){return _mesh.vertexArray;}).bind(this),
                                    "float4*attr vertexNormal": (function(){return _mesh.normalArray;}).bind(this),
                                    "float4*attr vertexTexture": (function(){return _mesh.textureArray;}).bind(this),
                                    "float*attr vertexTextureUnit": (function(){return _mesh.textureUnitArray;}).bind(this),
                                    "indices": (function(){return _mesh.indexArray;}).bind(this),
                                    "mat4 PMatrix": (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this),
                                    "mat4 cameraWMatrix": (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this),
                                    "mat4 nodeWMatrix": (function(){return node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this),
                                    'float nodesSize': (function(){return 30.0;}).bind(this),
                                    'float4* texAlbedo': (function(){return _mesh.vertexArray;}).bind(this)
                                    },
                                {"type": "GRAPHIC",
                                "config": new VFP_RGB(1).getSrc()});
        comp_renderer.setArgUpdatable("PMatrix", true);
        comp_renderer.setArgUpdatable("cameraWMatrix", true);
        comp_renderer.setArgUpdatable("nodeWMatrix", true);
        comp_renderer.getComponentBufferArg("RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS));
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
