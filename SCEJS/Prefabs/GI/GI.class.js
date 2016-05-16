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
        comp_renderer_node.setGPUFor(comp_renderer_node.gl,
                                    {// VFP_RGB
                                    "float4*attr vertexPos": (function(){return null;}).bind(this),
                                    "float4*attr vertexNormal": (function(){return null;}).bind(this),
                                    "float4*attr vertexTexture": (function(){return null;}).bind(this),
                                    "float*attr vertexTextureUnit": (function(){return null;}).bind(this),
                                    "indices": (function(){return null;}).bind(this),
                                    "mat4 PMatrix": (function(){return null;}).bind(this),
                                    "mat4 cameraWMatrix": (function(){return null;}).bind(this),
                                    "mat4 nodeWMatrix": (function(){return null;}).bind(this),
                                    'float nodesSize': (function(){return null;}).bind(this),
                                    'float4* texAlbedo': (function(){return null;}).bind(this),

                                    // VFP_GI
                                    'float4* sampler_voxelColor,': (function(){return null;}).bind(this),
                                    'float4* sampler_voxelPos,': (function(){return null;}).bind(this),
                                    'float4* sampler_voxelNormal,': (function(){return null;}).bind(this),

                                    'float4* sampler_screenColor,': (function(){return null;}).bind(this),
                                    'float4* sampler_screenPos,': (function(){return null;}).bind(this),
                                    'float4* sampler_screenNormal,': (function(){return null;}).bind(this),

                                    'float4* sampler_GIVoxel,': (function(){return null;}).bind(this),

                                    'float randX1,': (function(){return null;}).bind(this),
                                    'float randY1,': (function(){return null;}).bind(this),
                                    'float uTypePass,': (function(){return null;}).bind(this),

                                    'float uGridsize,': (function(){return null;}).bind(this),
                                    'float uResolution': (function(){return null;}).bind(this)},
                                    {"type": "GRAPHIC",
                                    "config": new VFP_RGB(1).getSrc()},
                                    {"type": "GRAPHIC",
                                    "config": new VFP_GI(resolution).getSrc()});
        comp_renderer_node.setGraphicArgDestination(
            [_project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS).getBuffers()["RGB"],
            comp_renderer_node.getTempBuffers()["sampler_GIVoxel"]]);

        comp_renderer_node.onPreProcessGraphic(0, (function() {
            comp_renderer_node.gl.blendFunc(comp_renderer_node.gl[Constants.BLENDING_MODES.SRC_ALPHA], comp_renderer_node.gl[Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA]);
        }).bind(this));
        comp_renderer_node.onPreProcessGraphic(1, (function() {
            if(_runGI == true) {
                comp_renderer_node.setArg("randX1", (function(){return Math.random();}).bind(this));
                comp_renderer_node.setArg("randY1", (function(){return Math.random();}).bind(this));

                comp_renderer_node.getWebCLGL().copy(comp_renderer_node.getTempBuffers()["sampler_screenColor"], comp_renderer_node.getBuffers()["sampler_screenColor"]);
                comp_renderer_node.getWebCLGL().copy(comp_renderer_node.getTempBuffers()["sampler_screenPos"], comp_renderer_node.getBuffers()["sampler_screenPos"]);
                comp_renderer_node.getWebCLGL().copy(comp_renderer_node.getTempBuffers()["sampler_screenNormal"], comp_renderer_node.getBuffers()["sampler_screenNormal"]);
                comp_renderer_node.getWebCLGL().copy(comp_renderer_node.getTempBuffers()["sampler_GIVoxel"], comp_renderer_node.getBuffers()["sampler_GIVoxel"]);

                //_currentDestinationSampler = (_currentDestinationSampler == 4) ? 0 : _currentDestinationSampler += 1;

                comp_renderer_node.setArg("uTypePass", (function(){return _currentDestinationSampler;}).bind(this));
                //comp_renderer_node.setVfpArgDestination("GI", _arrDestinationSamplers[_currentDestinationSampler]);
            }
        }).bind(this));
        comp_renderer_node.disableGraphic(1);
				
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
		
		comp_renderer_node.set("indices", (function(){return mesh.indexArray;}).bind(this));
		
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
	* @param {Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} [jsonIn.albedo=undefined]
	* @param {Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} [jsonIn.position=undefined]
	* @param {Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} [jsonIn.normal=undefined]
	*/
	this.setVoxelsArrays = function(jsonIn) {
		if(jsonIn.hasOwnProperty("albedo") == true)
			comp_renderer_node.setArg("sampler_voxelColor", (function(){return jsonIn.albedo;}).bind(this)); 
		
		if(jsonIn.hasOwnProperty("position") == true)
			comp_renderer_node.setArg("sampler_voxelPos", (function(){return jsonIn.position;}).bind(this));
		
		if(jsonIn.hasOwnProperty("normal") == true)
			comp_renderer_node.setArg("sampler_voxelNormal", (function(){return jsonIn.normal;}).bind(this));
	};
	
	/**
	* runGI
	*/
	this.runGI = function() {
		var comp_screenEffects = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
        comp_screenEffects.setGPUFor(  comp_screenEffects.gl,
            {"float4* sampler_GIVoxel": (function(){return null;}).bind(this)},
            {"type": "KERNEL",
            "config": ["x", undefined,
                        // head
                        '',

                        // source
                        // GI
                        'vec4 textureFBGIVoxel = sampler_GIVoxel[x];\n'+
                        'vec3 GIweight = vec3((textureFBGIVoxel.r/textureFBGIVoxel.a), (textureFBGIVoxel.g/textureFBGIVoxel.a), (textureFBGIVoxel.b/textureFBGIVoxel.a));'+

                        'return vec4(GIweight, 1.0);'+
                        //'out_float4 = vec4(textureFBGIVoxel.rgb, 1.0);\n'+


                        //'out_float4 = vec4(out_float4.xyz*(0.75+(length(GIVoxelsShadow)/4.0)), out_float4.a);\n'+
                        //'out_float4 = vec4(GIweight, GIweight, GIweight, 1.0);\n'+
                        '']});
        comp_screenEffects.setGraphicEnableDepthTest(false);
        comp_screenEffects.setGraphicEnableBlend(true);
        comp_renderer_nodes.setGraphicBlendSrc(Constants.BLENDING_MODES.ONE_MINUS_SRC_COLOR);
        comp_renderer_nodes.setGraphicBlendDst(Constants.BLENDING_MODES.SRC_COLOR);

        var arr = new Float32Array(_sce.getDimensions().width*_sce.getDimensions().height*4);
        comp_renderer_node.setArg("sampler_screenColor", (function() {return arr;}).bind(this));
        comp_renderer_node.setArg("sampler_screenPos", (function() {return arr;}).bind(this));
        comp_renderer_node.setArg("sampler_screenNormal", (function() {return arr;}).bind(this));
        comp_renderer_node.setArg("sampler_GIVoxel", (function() {return arr;}).bind(this));

		//comp_renderer_node.clearArg("sampler_screenNormal", [1.0, 1.0, 1.0, 0.0]);
		//comp_renderer_node.clearArg("sampler_screenPos", [1.0, 1.0, 1.0, 1.0]);
		//comp_renderer_node.clearArg("sampler_screenNormal", [1.0, 1.0, 1.0, 1.0]);
		//comp_renderer_node.clearArg("sampler_GIVoxel", [1.0, 1.0, 1.0, 1.0]);
		
		_arrDestinationSamplers = [comp_renderer_node.getTempBuffers()["sampler_screenColor"],
		                           comp_renderer_node.getTempBuffers()["sampler_screenPos"],
		                           comp_renderer_node.getTempBuffers()["sampler_screenNormal"],
		                           comp_renderer_node.getTempBuffers()["sampler_GIVoxel"]]; 
		
		
		comp_screenEffects.setSharedBufferArg("sampler_GIVoxel", comp_renderer_node);
		
		_currentDestinationSampler = 4;
		
		//comp_renderer_node.enableVfp("GI");
		//comp_screenEffects.enableKernel("sampler_GIVoxel");
		_runGI = true;
	};
	
	/**
	* isRunned
	* @returns {Bool}
	*/
	this.isRunned = function() {
		return _runGI;
	};
	
	/**
	* stop
	*/
	this.stop = function() {
		var comp_screenEffects = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
		comp_renderer_node.disableVfp("GI");
		comp_screenEffects.disableKernel("sampler_GIVoxel");
	};
	
	/**
	* resume
	*/
	this.resume = function() {
		comp_renderer_node.clearArg("sampler_screenNormal", [1.0, 1.0, 1.0, 0.0]);
		comp_renderer_node.clearArg("sampler_screenPos", [1.0, 1.0, 1.0, 0.0]);
		comp_renderer_node.clearArg("sampler_screenNormal", [1.0, 1.0, 1.0, 0.0]);
		comp_renderer_node.clearArg("sampler_GIVoxel", [1.0, 1.0, 1.0, 0.0]);
		
		comp_renderer_node.clearTempArg("sampler_screenColor", [1.0, 1.0, 1.0, 0.0]);
		comp_renderer_node.clearTempArg("sampler_screenPos", [1.0, 1.0, 1.0, 0.0]);
		comp_renderer_node.clearTempArg("sampler_screenNormal", [1.0, 1.0, 1.0, 0.0]);
		comp_renderer_node.clearTempArg("sampler_GIVoxel", [1.0, 1.0, 1.0, 0.0]);
		
		_currentDestinationSampler = 4;
		
		var comp_screenEffects = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
		comp_renderer_node.enableVfp("GI");
		comp_screenEffects.enableKernel("sampler_GIVoxel");
	};
};