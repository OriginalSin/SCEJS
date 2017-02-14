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
                                    'float4* sampler_voxelColor': (function(){return null;}).bind(this),
                                    'float4* sampler_voxelPos': (function(){return null;}).bind(this),
                                    'float4* sampler_voxelNormal': (function(){return null;}).bind(this),

                                    'float4* sampler_screenColor': (function(){return null;}).bind(this),
                                    'float4* sampler_screenPos': (function(){return null;}).bind(this),
                                    'float4* sampler_screenNormal': (function(){return null;}).bind(this),

                                    'float4* sampler_GIVoxel': (function(){return null;}).bind(this),

                                    'float randX1': (function(){return null;}).bind(this),
                                    'float randY1': (function(){return null;}).bind(this),
                                    'float uTypePass': (function(){return null;}).bind(this),

                                    'float uGridsize': (function(){return null;}).bind(this),
                                    'float uResolution': (function(){return null;}).bind(this)},
                                    {"type": "GRAPHIC",
                                    "config": new VFP_RGB(1).getSrc(),
                                    "drawMode": 4,
                                    "depthTest": true,
                                    "blend": true,
                                    "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
                                    "blendSrcMode": Constants.BLENDING_MODES.SRC_ALPHA,
                                    "blendDstMode": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA},
                                    {"type": "GRAPHIC",
                                    "config": [["sampler_screenColor","sampler_screenPos","sampler_screenNormal","sampler_GIVoxel"],
                                        // vertex head
                                        'out vec4 vposition;\n'+
                                        'out vec4 vnormal;\n'+
                                        'out vec4 vposScreen;\n'+
                                        'const mat4 ScaleMatrix = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);',

                                        // vertex source
                                        'vec3 vp = vec3(vertexPos[].x, vertexPos[].y, vertexPos[].z);\n'+
                                        'vposition = nodeWMatrix * vec4(vp*vec3(1.0,1.0,1.0), 1.0);\n'+
                                        'vnormal = vec4(vertexNormal[].xyz*vec3(1.0,1.0,1.0), 1.0);\n'+

                                        'vec4 pos = PMatrix * cameraWMatrix * nodeWMatrix * vec4(vp, 1.0);'+
                                        'vposScreen = ScaleMatrix * pos;\n'+

                                        'gl_Position = pos;\n',


                                        // fragment head
                                        'in vec4 vposition;\n'+
                                        'in vec4 vnormal;\n'+
                                        'in vec4 vposScreen;\n'+

                                        new Utils().degToRadGLSLFunctionString()+
                                        new Utils().radToDegGLSLFunctionString()+
                                        new Utils().cartesianToSphericalGLSLFunctionString()+
                                        new Utils().sphericalToCartesianGLSLFunctionString()+
                                        new Utils().getVectorGLSLFunctionString()+

                                        new Utils().unpackGLSLFunctionString()+

                                        new Utils().rayTraversalInitSTR()+
                                        new Utils().rayTraversalSTR(resolution),

                                        // fragment source
                                        'vec3 pixelCoord = vposScreen.xyz / vposScreen.w;'+

                                        'float maxang=0.7;'+
                                        'float maxB = 3.0;'+

                                        'vec4 texScreenColor = sampler_screenColor[vec2(pixelCoord.x,pixelCoord.y)];\n'+
                                        'vec4 texScreenPos = sampler_screenPos[vec2(pixelCoord.x,pixelCoord.y)];\n'+
                                        'vec4 texScreenNormal = sampler_screenNormal[vec2(pixelCoord.x,pixelCoord.y)];\n'+
                                        'vec4 texScreenGIVoxel = sampler_GIVoxel[vec2(pixelCoord.x,pixelCoord.y)];\n'+

                                        'vec4 f_sampler_screenColor;'+
                                        'vec4 f_sampler_screenPos;'+
                                        'vec4 f_sampler_screenNormal;'+
                                        'vec4 f_sampler_GIVoxel;'+
                                        'vec3 ro; vec3 rd; RayTraversalResponse rayT;'+


                                        'if(texScreenNormal.a == 0.0) {'+ // start
                                            'ro = vposition.xyz*vec3(1.0,1.0,1.0);'+
                                            'rd = vnormal.xyz*vec3(1.0,1.0,1.0);'+

                                            'vec3 vectorRandom = getVector(rd, maxang, vec2(randX1,randY1));'+
                                            'rayT = rayTraversal(ro+(rd*(cs+cs)), vectorRandom);\n'+
                                        '} else if(texScreenNormal.a == 1.0) {'+
                                            'ro = texScreenPos.xyz;'+
                                            'rd = texScreenNormal.xyz;'+
                                            //'rd = reflect(normalize(ro),rd);'+

                                            'vec3 vectorRandom = getVector(rd, maxang, vec2(randX1,randY1));'+
                                            'rayT = rayTraversal(ro+(rd*(cs+cs)), vectorRandom);\n'+
                                        '}'+

                                        'if(rayT.voxelColor.a > 0.0 && f_sampler_screenPos.a < 8.0) {'+ // hit in solid
                                            'float rx = abs((randX1-0.5)*2.0);'+
                                            'float ry = abs((randY1-0.5)*2.0);'+

                                            'vec4 rtColor = rayT.voxelColor;'+
                                            'vec4 rtPos = rayT.voxelPos;'+
                                            'vec4 rtNormal = rayT.voxelNormal;'+
                                            'f_sampler_screenColor = vec4(texScreenColor.r*rtColor.r,texScreenColor.g*rtColor.g,texScreenColor.b*rtColor.b, texScreenColor.a+(rtColor.a/uGridsize));\n'+ // -(rtColor.a/uGridsize)
                                            'f_sampler_screenPos = vec4(rtPos.r,rtPos.g,rtPos.b, texScreenPos.a+1.0);\n'+
                                            'f_sampler_screenNormal = vec4(rtNormal.r,rtNormal.g,rtNormal.b, 1.0);\n'+
                                        '} else {'+ // hit in light
                                            'f_sampler_screenColor = vec4(texScreenColor.r,texScreenColor.g,texScreenColor.b, texScreenColor.a);\n'+
                                            'f_sampler_screenPos = vec4(1.0,1.0,1.0, texScreenPos.a);\n'+
                                            'f_sampler_screenNormal = vec4(1.0,1.0,1.0, 0.0);\n'+ // (make process and return to origin alpha 0.0).
                                        '}'+


                                        'if(f_sampler_screenNormal.a == 0.0) {'+ //  hit in light. make process
                                            'f_sampler_GIVoxel = vec4(f_sampler_screenPos.a, f_sampler_screenPos.a, f_sampler_screenPos.a, texScreenGIVoxel.a+1.0);'+
                                        '} else {'+ // hit in solid. do nothing
                                            'f_sampler_GIVoxel = texScreenGIVoxel;'+
                                        '}'+

                                        'return [f_sampler_screenColor, f_sampler_screenPos, f_sampler_screenNormal, f_sampler_GIVoxel];\n'
                                     ],
                                    "drawMode": 4,
                                    "depthTest": true,
                                    "blend": false,
                                    "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
                                    "blendSrcMode": Constants.BLENDING_MODES.ONE,
                                    "blendDstMode": Constants.BLENDING_MODES.ZERO});
        comp_renderer_node.getComponentBufferArg("RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS));
        comp_renderer_node.gpufG.onPreProcessGraphic(0, (function() {
            //comp_screenEffects.gl.clear(comp_screenEffects.gl.COLOR_BUFFER_BIT | comp_screenEffects.gl.DEPTH_BUFFER_BIT);
            //comp_renderer_node.gl.blendFunc(comp_renderer_node.gl[Constants.BLENDING_MODES.SRC_ALPHA], comp_renderer_node.gl[Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA]);
        }).bind(this));
        comp_renderer_node.gpufG.onPreProcessGraphic(1, (function() {
            //comp_renderer_node.gl.blendFunc(comp_renderer_node.gl[Constants.BLENDING_MODES.SRC_ALPHA], comp_renderer_node.gl[Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA]);
            if(_runGI == true) {
                comp_renderer_node.setArg("randX1", (function(){return Math.random();}).bind(this));
                comp_renderer_node.setArg("randY1", (function(){return Math.random();}).bind(this));
            }
        }).bind(this));
        comp_renderer_node.gpufG.disableGraphic(1);
				
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
		
		comp_renderer_node.setArg("indices", (function(){return mesh.indexArray;}).bind(this));
		
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
//        comp_renderer_node.addArgument("float4* sampler_GIVoxel", (function(){return null;}).bind(this), null ,"FLOAT4");

        var comp_screenEffects = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
        comp_screenEffects.getComponentBufferArg("sampler_GIVoxel", comp_renderer_node);
        comp_screenEffects.gpufG.addKernel({
            "type": "KERNEL",
            "config": ["x", undefined,
                // head
                '',
                // source
                // GI
                'vec4 textureFBGIVoxel = sampler_GIVoxel[x];\n'+
                'vec3 GIweight = vec3((textureFBGIVoxel.r/textureFBGIVoxel.a), (textureFBGIVoxel.g/textureFBGIVoxel.a), (textureFBGIVoxel.b/textureFBGIVoxel.a));'+

                'return vec4(1.0-(GIweight/8.0), 1.0);'+

                //'return vec4(textureFBGIVoxel.xyz, 1.0);'+
                ''],
            "drawMode": 4,
            "depthTest": false,
            "blend": false,
            "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
            "blendSrcMode": Constants.BLENDING_MODES.ONE,
            "blendDstMode": Constants.BLENDING_MODES.ZERO});

        var arr = new Float32Array(_sce.getDimensions().width*_sce.getDimensions().height*4);
        comp_renderer_node.setArg("sampler_screenColor", (function() {return arr;}).bind(this));
        comp_renderer_node.setArg("sampler_screenPos", (function() {return arr;}).bind(this));
        comp_renderer_node.setArg("sampler_screenNormal", (function() {return arr;}).bind(this));
        comp_renderer_node.setArg("sampler_GIVoxel", (function() {return arr;}).bind(this));

		comp_renderer_node.gpufG.fillPointerArg("sampler_screenColor", [1.0, 1.0, 1.0, 1.0]);
        comp_renderer_node.gpufG.fillPointerArg("sampler_screenPos", [1.0, 1.0, 1.0, 1.0]);
        comp_renderer_node.gpufG.fillPointerArg("sampler_screenNormal", [1.0, 1.0, 1.0, 0.0]);
        comp_renderer_node.gpufG.fillPointerArg("sampler_GIVoxel", [1.0, 1.0, 1.0, 1.0]);

        comp_renderer_node.gpufG.enableGraphic(1);
		_runGI = true;
	};

	this.getComponentRendererNode = function() {
	    return comp_renderer_node;
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
	};
	
	/**
	* resume
	*/
	this.resume = function() {
        comp_renderer_node.gpufG.fillPointerArg("sampler_screenColor", [1.0, 1.0, 1.0, 1.0]);
        comp_renderer_node.gpufG.fillPointerArg("sampler_screenPos", [1.0, 1.0, 1.0, 1.0]);
        comp_renderer_node.gpufG.fillPointerArg("sampler_screenNormal", [1.0, 1.0, 1.0, 0.0]);
        comp_renderer_node.gpufG.fillPointerArg("sampler_GIVoxel", [1.0, 1.0, 1.0, 1.0]);

		
		var comp_screenEffects = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS);
	};
};