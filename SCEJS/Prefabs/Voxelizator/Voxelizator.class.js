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
	var _size,	_resolution, _cs, _chs,	_wh;	
	var _arr_VoxelsColor, _arr_VoxelsPositionX, 	_arr_VoxelsPositionY, _arr_VoxelsPositionZ,	_arr_VoxelsNormal;
	var _typeFillMode, _currentHeight, _currentOffset;
	
	var _nativePosTarget;
	var _nativePosGoal;
	var _nativeTargetDistance;
	var _nativeDimensions;
	var _ongeneratefunction;
	
	var _image3D_VoxelsColor, _image3D_VoxelsPositionX, _image3D_VoxelsPositionY, _image3D_VoxelsPositionZ, _image3D_VoxelsNormal;
	
	var nodes = new Node();
	nodes.setName("voxelizator");
	_project.getActiveStage().addNode(nodes);

	// ComponentTransform
	var comp_transform = new ComponentTransform();
	nodes.addComponent(comp_transform);

	// ComponentRenderer
	var comp_renderer_node = new ComponentRenderer();
	nodes.addComponent(comp_renderer_node);
	
	comp_renderer_node.addVFP({"name": "VOXELIZATOR",
		"vfp": new VFP_VOXELIZATOR(),
		"drawMode": 4,
		//"geometryLength": 4,
		//"enableDepthTest": false,
		"enableBlend": true, 
		"blendSrc": Constants.BLENDING_MODES.SRC_ALPHA,
		"blendDst": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA,
		"onPreTick": (function() {
			comp_renderer_node.setVfpArgDestination("VOXELIZATOR", undefined);
			if(_makeVoxels == true) {
				comp_renderer_node.setArg("uCurrentHeight", (function(){return _currentHeight;}).bind(this));
				
				var fm;
				if(_typeFillMode[0] == "albedo") fm = 0;
				else if(_typeFillMode[0] == "positionX") fm = 1;
				else if(_typeFillMode[0] == "positionY") fm = 2;
				else if(_typeFillMode[0] == "positionZ") fm = 3;
				else if(_typeFillMode[0] == "normal") fm = 4;
				comp_renderer_node.setArg("uTypeFillMode", (function(){return fm;}).bind(this));
				
				// CAMERA CURRENT HEIGHT POSITION
				var p = $V3([0.0,0.0,0.0]);  
				var pc = p.add($V3([0.0,-1.0,0.0]));
				var comp_cam_tf_target = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET);
				comp_cam_tf_target.setPositionTarget(p);
				comp_cam_tf_target.setPositionGoal(pc);
				comp_cam_tf_target.pitch(180);
				comp_cam_tf_target.yaw(-90);
				comp_cam_tf_target.setTargetDistance(0.00001);
				
				comp_renderer_node.setArg("uCurrentOffset", (function(){return _currentOffset;}).bind(this));
				if(_currentOffset == 0) {
					//_gl.clearColor(0.0,0.0,0.0,0.0); 
					//_gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
				}
			}
		}).bind(this),
		"onPostTick": (function() {
			if(_makeVoxels == true) {				
				var setadd = (function(arrOrig, addarr, id) {
					var idOrig = id/4;
					for(var n=0; n < addarr.length/4; n++) {
						var iddOrig = idOrig*4;
						var iddAdd = n*4;
						
						if(arrOrig[iddOrig+3] == 0) {
							arrOrig[iddOrig] = addarr[iddAdd];
							arrOrig[iddOrig+1] = addarr[iddAdd+1];
							arrOrig[iddOrig+2] = addarr[iddAdd+2];
							arrOrig[iddOrig+3] = addarr[iddAdd+3];
						} else {
							arrOrig[iddOrig] = arrOrig[iddOrig];
							arrOrig[iddOrig+1] = arrOrig[iddOrig+1];
							arrOrig[iddOrig+2] = arrOrig[iddOrig+2];
							arrOrig[iddOrig+3] = arrOrig[iddOrig+3];
						}
						
						idOrig++;
					}
					return arrOrig;
				}).bind(this);
				
				
				var heightImageResult = new Uint8Array(_resolution*_resolution*4);
				_gl.readPixels(0, 0, _resolution, _resolution, _gl.RGBA, _gl.UNSIGNED_BYTE, heightImageResult);

				var idx3d = (_currentHeight*(_resolution*_resolution))*4;  
				var num = idx3d/_wh;
				var col = _utils.fract(num)*_wh; 
				var row = Math.floor(num);
				if(_typeFillMode[0] == "albedo")		
					//_arr_VoxelsColor.set(heightImageResult, idx3d);		
					_arr_VoxelsColor = setadd(_arr_VoxelsColor, heightImageResult, idx3d);
				else if(_typeFillMode[0] == "positionX")
					//_arr_VoxelsPositionX.set(heightImageResult, idx3d);
					_arr_VoxelsPositionX = setadd(_arr_VoxelsPositionX, heightImageResult, idx3d);
				else if(_typeFillMode[0] == "positionY")
					//_arr_VoxelsPositionY.set(heightImageResult, idx3d);	
					_arr_VoxelsPositionY = setadd(_arr_VoxelsPositionY, heightImageResult, idx3d);				
				else if(_typeFillMode[0] == "positionZ")
					//_arr_VoxelsPositionZ.set(heightImageResult, idx3d);	
					_arr_VoxelsPositionZ = setadd(_arr_VoxelsPositionZ, heightImageResult, idx3d);				
				else if(_typeFillMode[0] == "normal")
					//_arr_VoxelsNormal.set(heightImageResult, idx3d);
					_arr_VoxelsNormal = setadd(_arr_VoxelsNormal, heightImageResult, idx3d);
					
				if(_currentOffset == 7) {
					_currentHeight++;
					_currentOffset = 0;
				} else {
					_currentOffset++;
				}
								
				if(_currentHeight == _resolution) {
					_currentHeight = 0;
					
					if(_typeFillMode[0] == "albedo")
						_setVoxels({'fillMode': 'albedo', 'arr3d':_arr_VoxelsColor, 'wh':_wh});
					else if(_typeFillMode[0] == "positionX")
						_setVoxels({'fillMode': 'positionX', 'arr3d':_arr_VoxelsPositionX, 'wh':_wh});
					else if(_typeFillMode[0] == "positionY")
						_setVoxels({'fillMode': 'positionY', 'arr3d':_arr_VoxelsPositionY, 'wh':_wh});
					else if(_typeFillMode[0] == "positionZ")
						_setVoxels({'fillMode': 'positionZ', 'arr3d':_arr_VoxelsPositionZ, 'wh':_wh});
					else if(_typeFillMode[0] == "normal")
						_setVoxels({'fillMode': 'normal', 'arr3d':_arr_VoxelsNormal, 'wh':_wh});
					
					_typeFillMode.shift();
					
					if(_typeFillMode.length == 0) {
						_makeVoxels = false; 
						comp_renderer_node.disableVfp("VOXELIZATOR");
										
						var comp_projection = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION);
						comp_projection.setNear(-1000.0);
						comp_projection.setFar(1000.0);
						comp_projection.setProjection(Constants.PROJECTION_TYPES.PERSPECTIVE);
						
						_sce.setDimensions(_nativeDimensions.width, _nativeDimensions.height);
						
						var comp_cam_tf_target = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET);
						comp_cam_tf_target.setPositionTarget(_nativePosTarget);
						comp_cam_tf_target.setPositionGoal(_nativePosGoal);
						comp_cam_tf_target.setTargetDistance(_nativeTargetDistance);
						
						if(_ongeneratefunction != undefined) _ongeneratefunction(); 
					}
				}
			}
		}).bind(this)});
	comp_renderer_node.disableVfp("VOXELIZATOR");
	
	/** @private */
	var _setVoxels = (function(jsonIn) {
		if(jsonIn.fillMode == "albedo") {
			var canvas = (jsonIn.arr3d instanceof Uint8Array) ? _utils.getCanvasFromUint8Array(jsonIn.arr3d,jsonIn.wh,jsonIn.wh) : _utils.getCanvasFromUint8Array(_utils.getUint8ArrayFromHTMLImageElement(jsonIn.arr3d),jsonIn.wh,jsonIn.wh);
			_image3D_VoxelsColor = _utils.getImageFromCanvas(canvas);
		} else if(jsonIn.fillMode == "positionX") {
			var canvas = (jsonIn.arr3d instanceof Uint8Array) ? _utils.getCanvasFromUint8Array(jsonIn.arr3d,jsonIn.wh,jsonIn.wh) : _utils.getCanvasFromUint8Array(_utils.getUint8ArrayFromHTMLImageElement(jsonIn.arr3d),jsonIn.wh,jsonIn.wh);
			_image3D_VoxelsPositionX = _utils.getImageFromCanvas(canvas);
		} else if(jsonIn.fillMode == "positionY") {
			var canvas = (jsonIn.arr3d instanceof Uint8Array) ? _utils.getCanvasFromUint8Array(jsonIn.arr3d,jsonIn.wh,jsonIn.wh) : _utils.getCanvasFromUint8Array(_utils.getUint8ArrayFromHTMLImageElement(jsonIn.arr3d),jsonIn.wh,jsonIn.wh);
			_image3D_VoxelsPositionY = _utils.getImageFromCanvas(canvas);
		} else if(jsonIn.fillMode == "positionZ") {
			var canvas = (jsonIn.arr3d instanceof Uint8Array) ? _utils.getCanvasFromUint8Array(jsonIn.arr3d,jsonIn.wh,jsonIn.wh) : _utils.getCanvasFromUint8Array(_utils.getUint8ArrayFromHTMLImageElement(jsonIn.arr3d),jsonIn.wh,jsonIn.wh);
			_image3D_VoxelsPositionZ = _utils.getImageFromCanvas(canvas);
		} else if(jsonIn.fillMode == "normal") {
			var canvas = (jsonIn.arr3d instanceof Uint8Array) ? _utils.getCanvasFromUint8Array(jsonIn.arr3d,jsonIn.wh,jsonIn.wh) : _utils.getCanvasFromUint8Array(_utils.getUint8ArrayFromHTMLImageElement(jsonIn.arr3d),jsonIn.wh,jsonIn.wh);
			_image3D_VoxelsNormal = _utils.getImageFromCanvas(canvas);
		}
	}).bind(this);
	
	
	
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
	* Generate the voxelizator
	* @param	{Object} jsonIn
	* @param {Float} [jsonIn.size=2.1] Grid size.
	* @param {Int} [jsonIn.resolution=32] Grid resolution.
	* @param {Array<String>} [jsonIn.fillmode=["albedo"]] Modes of data fill. "albedo"|"positionX"|"positionY"|"positionZ"|"normal"
	* @param {Function} [jsonIn.ongenerate] On generate event.
	*/
	this.generate = function(jsonIn) { 	
		_ongeneratefunction = jsonIn.ongenerate;
		
		_size = (jsonIn.size != undefined) ? jsonIn.size: 2.1; 
		_resolution = (jsonIn.resolution != undefined) ? jsonIn.resolution: 32;
		_cs = _size/_resolution;
		_chs = _cs/2.0;
		_wh = Math.ceil(Math.sqrt(_resolution*_resolution*_resolution));
		
		_typeFillMode = (jsonIn.fillmode == undefined) ? ["albedo"] : jsonIn.fillmode;
		_currentHeight = 0, _currentOffset = 0;
		
		var comp_projection = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION);
		comp_projection.setProjection(Constants.PROJECTION_TYPES.ORTHO); 
		comp_projection.setFov(_size/2);
		comp_projection.setNear(-_chs);
		comp_projection.setFar(_cs); 
		
		comp_renderer_node.setArg("uGridsize", (function(){return _size;}).bind(this));
		comp_renderer_node.setArg("uResolution", (function(){return _resolution;}).bind(this));
		
		
		_arr_VoxelsColor = new Uint8Array(_wh*_wh*4); 
		_arr_VoxelsPositionX = new Uint8Array(_wh*_wh*4); 
		_arr_VoxelsPositionY = new Uint8Array(_wh*_wh*4); 
		_arr_VoxelsPositionZ = new Uint8Array(_wh*_wh*4); 
		_arr_VoxelsNormal = new Uint8Array(_wh*_wh*4);
		
		var comp_cam_tf_target = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET);
		_nativePosTarget = comp_cam_tf_target.getPositionTarget();
		_nativePosGoal = comp_cam_tf_target.getPositionGoal();
		_nativeTargetDistance = comp_cam_tf_target.getTargetDistance();		
		_nativeDimensions = _sce.getDimensions();
		
		_sce.setDimensions(_resolution, _resolution);
		
		_makeVoxels = true;
		comp_renderer_node.enableVfp("VOXELIZATOR");
	};
	
	/**
	 * @typedef {Object} Voxelizator~getGeneratedArrays
	 * @property {Array<Uint8Array>} Voxelizator~getGeneratedArrays.albedo
	 * @property {Array<Uint8Array>} Voxelizator~getGeneratedArrays.positionX
	 * @property {Array<Uint8Array>} Voxelizator~getGeneratedArrays.positionY
	 * @property {Array<Uint8Array>} Voxelizator~getGeneratedArrays.positionZ
	 * @property {Array<Uint8Array>} Voxelizator~getGeneratedArrays.normal
	 */
	/**
	 * @returns {Voxelizator~getGeneratedArrays}
	 */
	this.getGeneratedArrays = function() {
		return {	"albedo": _arr_VoxelsColor,
					"positionX": _arr_VoxelsPositionX,
					"positionY": _arr_VoxelsPositionY,
					"positionZ": _arr_VoxelsPositionZ,
					"normal": _arr_VoxelsNormal};
	};
	
	/**
	 * @typedef {Object} Voxelizator~getGeneratedImages
	 * @property {HTMLImageElement} Voxelizator~getGeneratedImages.albedo
	 * @property {HTMLImageElement} Voxelizator~getGeneratedImages.positionX
	 * @property {HTMLImageElement} Voxelizator~getGeneratedImages.positionY
	 * @property {HTMLImageElement} Voxelizator~getGeneratedImages.positionZ
	 * @property {HTMLImageElement} Voxelizator~getGeneratedImages.normal
	 */
	/**
	 * @returns {Voxelizator~getGeneratedImages}
	 */
	this.getGeneratedImages = function() {
		return {	"albedo": _image3D_VoxelsColor,
					"positionX": _image3D_VoxelsPositionX,
					"positionY": _image3D_VoxelsPositionY,
					"positionZ": _image3D_VoxelsPositionZ,
					"normal": _image3D_VoxelsNormal};
	};
};
