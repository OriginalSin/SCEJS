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

	// Component_GPU
	var comp_renderer = new Component_GPU();
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
                                "config": new VFP_RGB(1).getSrc(),
                                "drawMode": 4,
                                "depthTest": true,
                                "blend": true,
                                "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
                                "blendSrcMode": Constants.BLENDING_MODES.SRC_ALPHA,
                                "blendDstMode": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA});
        comp_renderer.setArgUpdatable("PMatrix", true);
        comp_renderer.setArgUpdatable("cameraWMatrix", true);
        comp_renderer.setArgUpdatable("nodeWMatrix", true);
        comp_renderer.getComponentBufferArg("RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.GPU));
        comp_renderer.gpufG.onPreProcessGraphic(0, (function() {
            //comp_renderer.gl.clear(comp_renderer.gl.COLOR_BUFFER_BIT | comp_renderer.gl.DEPTH_BUFFER_BIT);
        }).bind(this));
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
