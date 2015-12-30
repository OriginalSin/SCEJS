/**
* @class
*/
GI = function(sce) {
	"use strict";

	var _sce = sce;
	var _project = _sce.getLoadedProject();
	var _gl = _project.getActiveStage().getWebGLContext();
	var _utils = new Utils();
		
	
	var nodes = new Node();
	nodes.setName("GI");
	_project.getActiveStage().addNode(nodes);

	// ComponentTransform
	var comp_transform = new ComponentTransform();
	nodes.addComponent(comp_transform);

	// ComponentRenderer
	var comp_renderer_node = new ComponentRenderer();
	nodes.addComponent(comp_renderer_node);
	
	
	var _runGI = false;	
	var _currentDestinationSampler = 4;
	var _arrDestinationSamplers;
	
		
	/**
	* setResolution
	* @param {Float} resolution
	*/
	this.setResolution = function(resolution) {
		comp_renderer_node.addVFP({"name": "NODE_RGB",
			"vfp": new VFP_RGB(1),
			"drawMode": 4,
			"onPreTick": (function() {
				comp_renderer_node.setVfpArgDestination("NODE_RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS).getBuffers()["RGB"]);
			}).bind(this)});
		comp_renderer_node.addVFP({"name": "GI",
			"vfp": new VFP_GI(resolution),
			"drawMode": 4,
			//"geometryLength": 4,
			//"enableDepthTest": false,
			"enableBlend": true, 
			"onPreTick": (function() {
				if(_runGI == true) {					
					comp_renderer_node.setArg("randX1", (function(){return Math.random();}).bind(this));
					comp_renderer_node.setArg("randY1", (function(){return Math.random();}).bind(this));
					
					if(_currentDestinationSampler == 3) {
						comp_renderer_node.getWebCLGL().copy(comp_renderer_node.getTempBuffers()["sampler_screenColor"], comp_renderer_node.getBuffers()["sampler_screenColor"]);
						comp_renderer_node.getWebCLGL().copy(comp_renderer_node.getTempBuffers()["sampler_screenPos"], comp_renderer_node.getBuffers()["sampler_screenPos"]);
						comp_renderer_node.getWebCLGL().copy(comp_renderer_node.getTempBuffers()["sampler_screenNormal"], comp_renderer_node.getBuffers()["sampler_screenNormal"]);

						
						comp_renderer_node.clearTempArg("sampler_screenColor", [1.0, 1.0, 1.0, 1.0]);
						comp_renderer_node.clearTempArg("sampler_screenPos", [1.0, 1.0, 1.0, 1.0]);
						comp_renderer_node.clearTempArg("sampler_screenNormal", [1.0, 1.0, 1.0, 1.0]);
					} else if(_currentDestinationSampler == 4) {
						comp_renderer_node.getWebCLGL().copy(comp_renderer_node.getTempBuffers()["sampler_GIVoxel"], comp_renderer_node.getBuffers()["sampler_GIVoxel"]);
					}
					
					
					_currentDestinationSampler = (_currentDestinationSampler == 4) ? 0 : _currentDestinationSampler += 1;
					
					comp_renderer_node.setArg("uTypePass", (function(){return _currentDestinationSampler;}).bind(this)); 
					comp_renderer_node.setVfpArgDestination("GI", _arrDestinationSamplers[_currentDestinationSampler]);
				}
			}).bind(this),
			"onPostTick": (function() {
				
			}).bind(this)});
		comp_renderer_node.disableVfp("GI");
		
		
				
		comp_renderer_node.setArg("uResolution", (function(){return resolution;}).bind(this));
	};
	
	/**
	* setGridSize
	* @param {Float} size
	*/
	this.setGridSize = function(size) {
		comp_renderer_node.setArg("uGridsize", (function(){return size;}).bind(this));
	}; 
	
	/**
	* setMesh
	* @param {Mesh} mesh
	*/
	this.setMesh = function(mesh) {
		comp_renderer_node.setArg("vertexPos", (function(){return mesh.vertexArray;}).bind(this));
		comp_renderer_node.setArg("vertexNormal", (function(){return mesh.normalArray;}).bind(this));
		comp_renderer_node.setArg("vertexTexture", (function(){return mesh.textureArray;}).bind(this));
		comp_renderer_node.setArg("vertexTextureUnit", (function(){return mesh.textureUnitArray;}).bind(this));
		
		comp_renderer_node.setIndices((function(){return mesh.indexArray;}).bind(this));
		
		comp_renderer_node.setArg("PMatrix", (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_node.setArgUpdatable("PMatrix", true);
		comp_renderer_node.setArg("cameraWMatrix", (function(){return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_node.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_node.setArg("nodeWMatrix", (function(){return node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_node.setArgUpdatable("nodeWMatrix", true);
		
		comp_renderer_node.setArg("texAlbedo", (function(){return mesh.vertexArray;}).bind(this));
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
	* setVoxelsArrays
	* @param {Object} jsonIn
	* @param {Object} [jsonIn.albedo=undefined]
	* @param {Object} [jsonIn.positionX=undefined]
	* @param {Object} [jsonIn.positionY=undefined]
	* @param {Object} [jsonIn.positionZ=undefined]
	* @param {Object} [jsonIn.normal=undefined]
	*/
	this.setVoxelsArrays = function(jsonIn) {
		if(jsonIn.hasOwnProperty("albedo") == true)
			comp_renderer_node.setArg("sampler_voxelColor", (function(){return jsonIn.albedo;}).bind(this));
		
		if(jsonIn.hasOwnProperty("positionX") == true)
			comp_renderer_node.setArg("sampler_voxelPosX", (function(){return jsonIn.positionX;}).bind(this));
		
		if(jsonIn.hasOwnProperty("positionY") == true)
			comp_renderer_node.setArg("sampler_voxelPosY", (function(){return jsonIn.positionY;}).bind(this));
		
		if(jsonIn.hasOwnProperty("positionZ") == true)
			comp_renderer_node.setArg("sampler_voxelPosZ", (function(){return jsonIn.positionZ;}).bind(this));
		
		if(jsonIn.hasOwnProperty("normal") == true)
			comp_renderer_node.setArg("sampler_voxelNormal", (function(){return jsonIn.normal;}).bind(this));
	};
	
	/**
	* runGI
	*/
	this.runGI = function() {
		var comp_screenEffects = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
		comp_screenEffects.addKernel({	"name": "sampler_GIVoxel",
										"kernel": new SE_GI(),			
										"width": _sce.getCanvas().width,
										"height": _sce.getCanvas().height,
										"enableDepthTest": false,
										"enableBlend": true, 
										"blendSrc": Constants.BLENDING_MODES.SRC_ALPHA,
										"blendDst": Constants.BLENDING_MODES.SRC_COLOR,
										"onPostTick": (function() {									
											//comp_screenEffects.clearArg("RGB", [0.0, 0.0, 0.0, 1.0]);
										}).bind(this)});
		
		var arr = new Float32Array(_sce.getDimensions().width*_sce.getDimensions().height*4);
		
		comp_renderer_node.setArg("sampler_screenColor", (function(){return arr;}).bind(this));
		comp_renderer_node.setArg("sampler_screenPos", (function(){return arr;}).bind(this));
		comp_renderer_node.setArg("sampler_screenNormal", (function(){return arr;}).bind(this));
		comp_renderer_node.setArg("sampler_GIVoxel", (function(){return arr;}).bind(this));
		
		comp_renderer_node.clearArg("sampler_screenNormal", [1.0, 1.0, 1.0, 1.0]);
		comp_renderer_node.clearArg("sampler_screenPos", [1.0, 1.0, 1.0, 1.0]);
		comp_renderer_node.clearArg("sampler_screenNormal", [1.0, 1.0, 1.0, 1.0]);
		comp_renderer_node.clearArg("sampler_GIVoxel", [1.0, 1.0, 1.0, 1.0]);
		
		_arrDestinationSamplers = [comp_renderer_node.getTempBuffers()["sampler_screenColor"],
		                           comp_renderer_node.getTempBuffers()["sampler_screenPos"],
		                           comp_renderer_node.getTempBuffers()["sampler_screenNormal"],
		                           comp_renderer_node.getTempBuffers()["sampler_GIVoxel"]]; 
		
		
		comp_screenEffects.setSharedBufferArg("sampler_GIVoxel", comp_renderer_node);
		
		
		comp_renderer_node.enableVfp("GI");
		_runGI = true;
	};
};