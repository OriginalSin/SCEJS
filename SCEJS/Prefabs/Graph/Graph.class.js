/**
* @class
*/
Graph = function(sce) {
	"use strict";

	var _sce = sce;
	var _project = _sce.getLoadedProject();
	var _gl = _project.getActiveStage().getWebGLContext();
	var _utils = new Utils();

	var MAX_ITEMS_PER_ARRAY = (4294967295)/*4294967295*/; // unsigned int 65535 for limit on indices of 16bit; long unsigned int 4294967295
	var NODE_IMG_COLUMNS = 8.0;
	var NODE_IMG_WIDTH = 2048;
	var NODE_IMG_SPRITE_WIDTH = NODE_IMG_WIDTH/NODE_IMG_COLUMNS;
	var OFFSET = 1000.0;


	var _nodesByName = {};
	var _nodesById = {};
	var _links = {};


    var arrAdjMatrix_STORE = [];
    var arrAdjMatrix_STORE_WCLGL = [];
    var maxItemsInSTORE = 10;
	var arrAdjMatrix = [];
	var arrAdjMatrix_WCLGL = [];
	var _ADJ_MATRIX_WIDTH = 4096;
    var _ADJ_MATRIX_WIDTH_TOTAL;
	var _currentAdjMatrix = 0;
	var _numberOfColumns;
	var _numberOfAdjMatrix;
	var _enabledForceLayout = false;
	var _buffAdjMatrix;
	var _adjMatrixTime = 100;


	
	var _customArgs = {}; // {ARG: {"arg": String, "value": Array<Float>}}

	var readPixel = false;
	var selectedId = -1;
	var _initialPosDrag;
	
	// meshes
	var circleSegments = 12;
	var nodesTextPlanes = 12;
	var mesh_nodes = new Mesh().loadQuad(4.0, 4.0);
	var mesh_arrows = new Mesh().loadTriangle({"scale": 2.0,
												"side": 0.6});
	var mesh_nodesText = new Mesh().loadQuad(4.0, 4.0);

	// nodes image
	var objNodeImages = {};
	var canvasNodeImg = document.createElement('canvas');
	canvasNodeImg.width = NODE_IMG_WIDTH;
	canvasNodeImg.height = NODE_IMG_WIDTH;
	var ctxNodeImg = canvasNodeImg.getContext('2d');
	
	var canvasNodeImgCrosshair = document.createElement('canvas');
	canvasNodeImgCrosshair.width = NODE_IMG_WIDTH;
	canvasNodeImgCrosshair.height = NODE_IMG_WIDTH;
	var ctxNodeImgCrosshair = canvasNodeImgCrosshair.getContext('2d');

	var canvasNodeImgTMP = document.createElement('canvas');
	canvasNodeImgTMP.width = NODE_IMG_SPRITE_WIDTH;
	canvasNodeImgTMP.height = NODE_IMG_SPRITE_WIDTH;
	var ctxNodeImgTMP = canvasNodeImgTMP.getContext('2d');

	var _stackNodesImg = [];
	var _makingNodesImg = false;
	var nodesImgMask = null;
	var nodesImgMaskLoaded = false;
	var nodesImgCrosshair = null;
	var nodesImgCrosshairLoaded = false;


	var FONT_IMG_COLUMNS = 7.0;
	var getLetterId = function(letter) {
		var obj = {	"A":  0, "B":  1, "C":  2, "D":  3, "E":  4, "F":  5, "G":  6,
					"H":  7, "I":  8, "J":  9, "K": 10, "L": 11, "M": 12, "N": 13,
					"Ñ": 14, "O": 15, "P": 16, "Q": 17, "R": 18, "S": 19, "T": 20,
					"U": 21, "V": 22, "W": 23, "X": 24, "Y": 25, "Z": 26, " ": 27,
					"0": 28, "1": 29, "2": 30, "3": 31, "4": 32, "5": 33, "6": 34,
					"7": 35, "8": 36, "9": 37
				};
		return obj[letter];
	};

	//**************************************************
	//  NODES
	//**************************************************
	var nodes = new Node();
	nodes.setName("graph_nodes");
	_project.getActiveStage().addNode(nodes);

	// ComponentTransform
	var comp_transform = new ComponentTransform();
	nodes.addComponent(comp_transform);

	// ComponentRenderer
	var comp_renderer_nodes = new ComponentRenderer();
	nodes.addComponent(comp_renderer_nodes);

	// ComponentMouseEvents
	var comp_mouseEvents = new ComponentMouseEvents();
	nodes.addComponent(comp_mouseEvents);
	comp_mouseEvents.onmousedown((function(evt) {
		selectedId = -1
		readPixel = true;

		comp_renderer_nodes.enableVfp("NODES_PICKDRAG");
	}).bind(this));
	comp_mouseEvents.onmouseup((function(evt) {
		if(selectedId != -1) {
			var n = _nodesById[selectedId];
			if(n != undefined && n.onmouseup != undefined) n.onmouseup(n, evt);
		}

		comp_renderer_nodes.setArg("enableDrag", (function() {return 0;}).bind(this));
		comp_renderer_links.setArg("enableDrag", (function() {return 0;}).bind(this));
		comp_renderer_arrows.setArg("enableDrag", (function() {return 0;}).bind(this));
		comp_renderer_nodesText.setArg("enableDrag", (function() {return 0;}).bind(this));
		
		if(selectedId == -1) {
			comp_renderer_nodes.setArg("idToDrag", (function() {return 0;}).bind(this));
			comp_renderer_links.setArg("idToDrag", (function() {return 0;}).bind(this));
			comp_renderer_arrows.setArg("idToDrag", (function() {return 0;}).bind(this));
			comp_renderer_nodesText.setArg("idToDrag", (function() {return 0;}).bind(this));
		}
	}).bind(this));
	comp_mouseEvents.onmousemove((function(evt, dir) {
		makeDrag(evt, dir);
	}).bind(this));
	comp_mouseEvents.onmousewheel((function(evt) {
	}).bind(this));

	// arrays
	this.splitNodes = [];
	this.splitNodesIndices = [];

	this.arrayNodeData = [];
	this.arrayNodePosXYZW = [];
	this.arrayNodeVertexPos = [];
	this.arrayNodeVertexNormal = [];
	this.arrayNodeVertexTexture = [];
	this.startIndexId = 0;
	this.arrayNodeIndices = [];

	this.arrayNodeImgId = [];

	this.arrayNodeDir = [];

	this.currentNodeId = 0;
	this.nodeArrayItemStart = 0;

	//**************************************************
	//  LINKS
	//**************************************************
	var links = new Node();
	links.setName("graph_links");
	_project.getActiveStage().addNode(links);

	// ComponentTransform
	var comp_transform = new ComponentTransform();
	links.addComponent(comp_transform);

	// ComponentRenderer
	var comp_renderer_links = new ComponentRenderer();
	links.addComponent(comp_renderer_links);

	// arrays
	this.splitLinks = [];
	this.splitLinksIndices = [];

	this.arrayLinkData = [];
	this.arrayLinkNodeName = [];
	this.arrayLinkPosXYZW = [];
	this.arrayLinkVertexPos = [];
	this.startIndexId_link = 0;
	this.arrayLinkIndices = [];

	this.currentLinkId = 0;

	//**************************************************
	//  ARROWS
	//**************************************************
	var arrows = new Node();
	arrows.setName("graph_arrows");
	_project.getActiveStage().addNode(arrows);

	// ComponentTransform
	var comp_transform = new ComponentTransform();
	arrows.addComponent(comp_transform);

	// ComponentRenderer
	var comp_renderer_arrows = new ComponentRenderer();
	arrows.addComponent(comp_renderer_arrows);

	// arrays
	this.splitArrows = [];
	this.splitArrowsIndices = [];

	this.arrayArrowData = [];
	this.arrayArrowNodeName = [];
	this.arrayArrowPosXYZW = [];
	this.arrayArrowVertexPos = [];
	this.arrayArrowVertexNormal = [];
	this.arrayArrowVertexTexture = [];
	this.startIndexId_arrow = 0;
	this.arrayArrowIndices = [];

	this.currentArrowId = 0;
	this.arrowArrayItemStart = 0;

	//**************************************************
	//  NODESTEXT
	//**************************************************
	var nodesText = new Node();
	nodesText.setName("graph_nodesText");
	_project.getActiveStage().addNode(nodesText);

	// ComponentTransform
	var comp_transform = new ComponentTransform();
	nodesText.addComponent(comp_transform);

	// ComponentRenderer
	var comp_renderer_nodesText = new ComponentRenderer();
	nodesText.addComponent(comp_renderer_nodesText);

	// arrays
	this.splitNodesText = [];
	this.splitNodesTextIndices = [];

	this.arrayNodeTextData = [];
	this.arrayNodeTextNodeName = [];
	this.arrayNodeTextPosXYZW = [];
	this.arrayNodeTextVertexPos = [];
	this.arrayNodeTextVertexNormal = [];
	this.arrayNodeTextVertexTexture = [];
	this.startIndexId_nodestext = 0;
	this.arrayNodeTextIndices = [];

	this.arrayNodeText_itemStart = [];
	this.arrayNodeTextLetterId = [];

	this.currentNodeTextId = 0;
	this.nodeTextArrayItemStart = 0;

	/**
	 * getNodeByName
	 * @param {String} name
	 * @returns {Node}
	 */
	this.getNodeByName = function(name) {
		return _nodesByName[name];
	};

	/**
	 * getNodeById
	 * @param {Int} id
	 * @returns {Node}
	 */
	this.getNodeById = function(id) {
		return _nodesById[id];
	};

	/**
	 * selectNode
	 * @param {Int} nodeId
	 */
	this.selectNode = function(nodeId) {
		selectedId = nodeId;
		makeDrag(undefined, $V3([0.0, 0.0, 0.0]));
	};

	/**
	 * getSelectedId
	 * @returns {Bool}
	 */
	this.getSelectedId = function() {
		return selectedId;
	};
	
	/**
	 * @private
	 * @param {MouseMoveEvent} [evt]
	 * @param {StormV3} dir
	 */
	var makeDrag = function(evt, dir) {
		var comp_controller_trans_target = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.CONTROLLER_TRANSFORM_TARGET)
		if(selectedId != -1) {
			comp_renderer_nodes.setArg("idToDrag", (function() {return selectedId;}).bind(this));

			if(comp_controller_trans_target.isLeftBtnActive() == true) {
				var comp_projection = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION);
				var finalPos = _initialPosDrag.add(dir.x((comp_projection.getFov()*2.0)/_sce.getCanvas().width));

				comp_renderer_nodes.setArg("enableDrag", (function() {return 1;}).bind(this));

				comp_renderer_nodes.setArg("MouseDragTranslationX", (function() {return finalPos.e[0];}).bind(this));
				comp_renderer_nodes.setArg("MouseDragTranslationY", (function() {return finalPos.e[1];}).bind(this));
				comp_renderer_nodes.setArg("MouseDragTranslationZ", (function() {return finalPos.e[2];}).bind(this));
				comp_renderer_nodes.setArg("initialPosX", (function() {return _initialPosDrag.e[0];}).bind(this));
				comp_renderer_nodes.setArg("initialPosY", (function() {return _initialPosDrag.e[1];}).bind(this));
				comp_renderer_nodes.setArg("initialPosZ", (function() {return _initialPosDrag.e[2];}).bind(this));

				comp_renderer_links.setArg("enableDrag", (function() {return 1;}).bind(this));
				comp_renderer_links.setArg("idToDrag", (function() {return selectedId;}).bind(this));
				comp_renderer_links.setArg("MouseDragTranslationX", (function() {return finalPos.e[0];}).bind(this));
				comp_renderer_links.setArg("MouseDragTranslationY", (function() {return finalPos.e[1];}).bind(this));
				comp_renderer_links.setArg("MouseDragTranslationZ", (function() {return finalPos.e[2];}).bind(this));
				comp_renderer_links.setArg("initialPosX", (function() {return _initialPosDrag.e[0];}).bind(this));
				comp_renderer_links.setArg("initialPosY", (function() {return _initialPosDrag.e[1];}).bind(this));
				comp_renderer_links.setArg("initialPosZ", (function() {return _initialPosDrag.e[2];}).bind(this));

				comp_renderer_arrows.setArg("enableDrag", (function() {return 1;}).bind(this));
				comp_renderer_arrows.setArg("idToDrag", (function() {return selectedId;}).bind(this));
				comp_renderer_arrows.setArg("MouseDragTranslationX", (function() {return finalPos.e[0];}).bind(this));
				comp_renderer_arrows.setArg("MouseDragTranslationY", (function() {return finalPos.e[1];}).bind(this));
				comp_renderer_arrows.setArg("MouseDragTranslationZ", (function() {return finalPos.e[2];}).bind(this));
				comp_renderer_arrows.setArg("initialPosX", (function() {return _initialPosDrag.e[0];}).bind(this));
				comp_renderer_arrows.setArg("initialPosY", (function() {return _initialPosDrag.e[1];}).bind(this));
				comp_renderer_arrows.setArg("initialPosZ", (function() {return _initialPosDrag.e[2];}).bind(this));

				comp_renderer_nodesText.setArg("enableDrag", (function() {return 1;}).bind(this));
				comp_renderer_nodesText.setArg("idToDrag", (function() {return selectedId;}).bind(this));
				comp_renderer_nodesText.setArg("MouseDragTranslationX", (function() {return finalPos.e[0];}).bind(this));
				comp_renderer_nodesText.setArg("MouseDragTranslationY", (function() {return finalPos.e[1];}).bind(this));
				comp_renderer_nodesText.setArg("MouseDragTranslationZ", (function() {return finalPos.e[2];}).bind(this));
				comp_renderer_nodesText.setArg("initialPosX", (function() {return _initialPosDrag.e[0];}).bind(this));
				comp_renderer_nodesText.setArg("initialPosY", (function() {return _initialPosDrag.e[1];}).bind(this));
				comp_renderer_nodesText.setArg("initialPosZ", (function() {return _initialPosDrag.e[2];}).bind(this));
			}
		} else if(selectedId == -1 && comp_controller_trans_target.isLeftBtnActive() == true) {
			comp_renderer_nodes.setArg("enableDrag", (function() {return 0;}).bind(this));
			comp_renderer_nodes.setArg("idToDrag", (function() {return 0;}).bind(this));
			comp_renderer_nodes.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
			comp_renderer_nodes.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
			comp_renderer_nodes.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));

			comp_renderer_links.setArg("enableDrag", (function() {return 0;}).bind(this));
			comp_renderer_links.setArg("idToDrag", (function() {return 0;}).bind(this));
			comp_renderer_links.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
			comp_renderer_links.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
			comp_renderer_links.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));

			comp_renderer_arrows.setArg("enableDrag", (function() {return 0;}).bind(this));
			comp_renderer_arrows.setArg("idToDrag", (function() {return 0;}).bind(this));
			comp_renderer_arrows.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
			comp_renderer_arrows.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
			comp_renderer_arrows.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));

			comp_renderer_nodesText.setArg("enableDrag", (function() {return 0;}).bind(this));
			comp_renderer_nodesText.setArg("idToDrag", (function() {return 0;}).bind(this));
			comp_renderer_nodesText.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
			comp_renderer_nodesText.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
			comp_renderer_nodesText.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));
		}
	};
	
	/**
	 * @private
	 * @param {String} url
	 * @param {Int} locationIdx
	 */
	var setNodesImage = (function(/*String*/ url, /*Int*/ locationIdx) {
		var get2Dfrom1D = function(/*Int*/ idx, /*Int*/ columns) {
			var n = idx/columns;
			var row = parseFloat(Math.round(n));
			var col = new Utils().fract(n)*columns;

			return {"col": col,
					"row": row};
		}

		if(nodesImgMaskLoaded == false) {
			nodesImgMask = new Image();
			nodesImgMask.onload = (function() {
				nodesImgMaskLoaded = true;
				setNodesImage(url, locationIdx);
			}).bind(this, url, locationIdx);
			nodesImgMask.src = sceDirectory+"/Prefabs/Graph/nodesImgMask.png";
		} else if(nodesImgCrosshairLoaded == false) {
			nodesImgCrosshair = new Image();
			nodesImgCrosshair.onload = (function() {
				nodesImgCrosshairLoaded = true;
				setNodesImage(url, locationIdx);
			}).bind(this, url, locationIdx);
			nodesImgCrosshair.src = sceDirectory+"/Prefabs/Graph/nodesImgCrosshair.png";
		} else {
			if(_makingNodesImg == false) {
				_makingNodesImg = true;
				
				var image = new Image();
				image.onload = (function(nodesImgMask, nodesImgCrosshair) {
					// draw userImg on temporal canvas reducing the thumb size
					ctxNodeImgTMP.clearRect(0, 0, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH);
					var quarter = NODE_IMG_SPRITE_WIDTH/4;
					ctxNodeImgTMP.drawImage(image, 0, 0, image.width, image.height, quarter, quarter, NODE_IMG_SPRITE_WIDTH/2, NODE_IMG_SPRITE_WIDTH/2);
	
					// apply mask to thumb image
					new Utils().getImageFromCanvas(canvasNodeImgTMP, (function(img) {
						var newImgData = new Utils().getUint8ArrayFromHTMLImageElement( img );
						
						
						var datMask = new Utils().getUint8ArrayFromHTMLImageElement(nodesImgMask);
						for(var n=0; n < datMask.length/4; n++) {
							var idx = n*4;
							if(newImgData[idx+3] > 0) newImgData[idx+3] = datMask[idx+3];
						}
						new Utils().getImageFromCanvas( new Utils().getCanvasFromUint8Array(newImgData, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH), (function(imgB) {
							// draw thumb image on atlas & update the 'nodesImg' argument
							var loc = get2Dfrom1D(locationIdx, NODE_IMG_COLUMNS);
							ctxNodeImg.drawImage(imgB, loc.col*NODE_IMG_SPRITE_WIDTH, loc.row*NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH);
	
							new Utils().getImageFromCanvas(canvasNodeImg, (function(imgAtlas) {
								comp_renderer_nodes.setArg("nodesImg", (function(){return imgAtlas;}).bind(this));
							}).bind(this));						
						}).bind(this));
						
						
						var datCrosshair = new Utils().getUint8ArrayFromHTMLImageElement(nodesImgCrosshair);
						for(var n=0; n < datCrosshair.length/4; n++) {
							var idx = n*4;
							
							newImgData[idx] = ((datCrosshair[idx]*datCrosshair[idx+3]) + (newImgData[idx]*(255-datCrosshair[idx+3])))/255;
							newImgData[idx+1] =( (datCrosshair[idx+1]*datCrosshair[idx+3]) + (newImgData[idx+1]*(255-datCrosshair[idx+3])))/255;
							newImgData[idx+2] = ((datCrosshair[idx+2]*datCrosshair[idx+3]) + (newImgData[idx+2]*(255-datCrosshair[idx+3])))/255;
							newImgData[idx+3] = ((datCrosshair[idx+3]*datCrosshair[idx+3]) + (newImgData[idx+3]*(255-datCrosshair[idx+3])))/255;						
						}					
						new Utils().getImageFromCanvas( new Utils().getCanvasFromUint8Array(newImgData, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH), (function(imgB) {
							// draw thumb image on atlas & update the 'nodesImg' argument
							var loc = get2Dfrom1D(locationIdx, NODE_IMG_COLUMNS);
							ctxNodeImgCrosshair.drawImage(imgB, loc.col*NODE_IMG_SPRITE_WIDTH, loc.row*NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH);
	
							new Utils().getImageFromCanvas(canvasNodeImgCrosshair, (function(imgAtlas) {
								comp_renderer_nodes.setArg("nodesImgCrosshair", (function(){return imgAtlas;}).bind(this));
								
								_makingNodesImg = false;
								if(_stackNodesImg.length > 0) {
									var urlT = _stackNodesImg[0].url;
									var locIdx = _stackNodesImg[0].locationIdx;
									_stackNodesImg.shift();
									setNodesImage(urlT, locIdx);
								}
							}).bind(this));						
						}).bind(this));
						
					}).bind(this));
				
				}).bind(this, nodesImgMask, nodesImgCrosshair);
				image.src = url;
			} else {
				_stackNodesImg.push({	"url": url,
										"locationIdx": locationIdx});
			}
		}
	}).bind(this);

	/**
	 * setFontsImage
	 * @param {String} url
	 */
	this.setFontsImage = function(url) {
		var image = new Image();
		image.onload = (function() {
			comp_renderer_nodesText.setArg("fontsImg", (function(){return image;}).bind(this));
		}).bind(this);
		image.src = url;
	};

	/**
	 * setNodeMesh
	 * @param {Mesh} mesh
	 */
	this.setNodeMesh = function(mesh) {
		mesh_nodes = mesh;
	};

	/**
	 * @typedef {Object} LayoutNodeData
	 * @property {Float|Array<Float4>} LayoutNodeData.ARG_NAME
	 */
	/**
	 * This callback is displayed as part of the onSelectNode
	 * @callback Graph~addNode~onmousedown
	 * @param {Node} node
	 */
	/**
	 * This callback is displayed as part of the onSelectNode
	 * @callback Graph~addNode~onmouseup
	 * @param {String} nodeData
	 * @param {MouseEvent} evt
	 */
	/**
	* Create new node for the graph
	* @param {Object} jsonIn
	* @param {String} jsonIn.name - Name of node
	* @param {String} [jsonIn.data=""] - Custom data associated to this node
	* @param {Array<Float4>} [jsonIn.position=new Array(Math.Random(), Math.Random(), Math.Random(), 1.0)] - Position of node
	* @param {String} [jsonIn.color=undefined] - URL of image
	* @param {LayoutNodeData} [jsonIn.layoutNodeArgumentData=undefined] - Data for the custom layout
	* @param {Graph~addNode~onmousedown} [jsonIn.onmousedown=undefined] - Event when mousedown
	* @param {Graph~addNode~onmouseup} [jsonIn.onmouseup=undefined] - Event when mouseup
	* @returns {String} - Name of node
	 */
	this.addNode = function(jsonIn) {
		if(_nodesByName.hasOwnProperty(jsonIn.name) == false) {
			var node = addNodeNow({	"position": jsonIn.position,
									"color": jsonIn.color,
									"layoutNodeArgumentData": jsonIn.layoutNodeArgumentData});

			// add event onmousedown & onmouseup if exists
			node.data = (jsonIn != undefined && jsonIn.data != undefined) ? jsonIn.data : undefined;
			node.onmousedown = (jsonIn != undefined && jsonIn.onmousedown != undefined) ? jsonIn.onmousedown : undefined;
			node.onmouseup = (jsonIn != undefined && jsonIn.onmouseup != undefined) ? jsonIn.onmouseup : undefined;


			/* _nodesByName[__STRING_USER_NODENAME__] = {	"nodeId": __INT_this.currentNodeId__,
																"itemStart": __INT_this.nodeArrayItemStart__,
																"data": {},
																"onmousedown": Function,
																"onmouseup": Function }*/
			_nodesByName[jsonIn.name] = node;

			/* _nodesById[__INT_this.currentNodeId__] = {	"nodeName": __STRING_USER_NODENAME__,
			  													"itemStart": __INT_this.nodeArrayItemStart__,
			  													"data": {},
			  													"onmousedown": Function,
			  													"onmouseup": Function }*/
			_nodesById[node.nodeId] = {"nodeName": jsonIn.name,
											"itemStart": node.itemStart,
											"data": node.data,
											"onmousedown": node.onmousedown,
											"onmouseup": node.onmouseup};

			/*addNodeTextNow({"name": jsonIn.name,
							"text": jsonIn.name,
							"itemStart": node.itemStart,
							"nodeId": node.nodeId,
							"layoutNodeArgumentData": jsonIn.layoutNodeArgumentData});*/

			console.log("%cnode "+(Object.keys(_nodesByName).length)+" ("+jsonIn.name+")", "color:green");
			
			return jsonIn.name;
		} else {
			console.log("node "+jsonIn.name+" already exists");
			return false;
		};
	};

	/**
	* @param {Object} jsonIn
	* @param {Array<Float4>} [jsonIn.position=[Math.Random(), Math.Random(), Math.Random(), 1.0]] - Position of node
	* @param {LayoutNodeData} [jsonIn.layoutNodeArgumentData=undefined]
	* @returns {Object}
	* @private
	*/
	var addNodeNow = (function(jsonIn) {
		var nAIS = this.nodeArrayItemStart;

		var offs = OFFSET/10;
		var pos = jsonIn.position != undefined ? jsonIn.position : [-(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), 1.0];

		var color = jsonIn.color;

		var nodeImgId = -1;
		if(color != undefined && color.constructor===String) { // color is string URL
			if(objNodeImages.hasOwnProperty(color) == false) {
				var locationIdx = Object.keys(objNodeImages).length;
				objNodeImages[color] = locationIdx;

				setNodesImage(color, locationIdx);
			}
			nodeImgId = objNodeImages[color];
		}
		for(var n=0; n < mesh_nodes.vertexArray.length/4; n++) {
			var idxVertex = n*4;

			this.arrayNodeData.push(this.currentNodeId, -1.0, 0.0, 0.0);
			this.arrayNodePosXYZW.push(pos[0], pos[1], pos[2], pos[3]);
			this.arrayNodeVertexPos.push(mesh_nodes.vertexArray[idxVertex], mesh_nodes.vertexArray[idxVertex+1], mesh_nodes.vertexArray[idxVertex+2], 1.0);
			this.arrayNodeVertexNormal.push(mesh_nodes.normalArray[idxVertex], mesh_nodes.normalArray[idxVertex+1], mesh_nodes.normalArray[idxVertex+2], 1.0);
			this.arrayNodeVertexTexture.push(mesh_nodes.textureArray[idxVertex], mesh_nodes.textureArray[idxVertex+1], mesh_nodes.textureArray[idxVertex+2], 1.0);

			this.arrayNodeImgId.push(nodeImgId);

			if(jsonIn.layoutNodeArgumentData != undefined) {
				for(var argNameKey in _customArgs) {
					var expl = _customArgs[argNameKey].arg.split("*");
					if(expl.length > 0) { // argument is type buffer
						if(jsonIn.layoutNodeArgumentData.hasOwnProperty(argNameKey) == true && jsonIn.layoutNodeArgumentData[argNameKey] != undefined) {
							if(expl[0] == "float")
								_customArgs[argNameKey].nodes_array_value.push(jsonIn.layoutNodeArgumentData[argNameKey]);
							else if(expl[0] == "float4")
								_customArgs[argNameKey].nodes_array_value.push(	jsonIn.layoutNodeArgumentData[argNameKey][0],
																				jsonIn.layoutNodeArgumentData[argNameKey][1],
																				jsonIn.layoutNodeArgumentData[argNameKey][2],
																				jsonIn.layoutNodeArgumentData[argNameKey][3]);
						}
					}
				}
			}

			this.nodeArrayItemStart++;
		}
		if(this.splitNodesIndices.length > 0 && this.arrayNodeIndices.length == this.splitNodesIndices[this.splitNodesIndices.length-1]) {
			this.startIndexId = 0;
		}
		var maxNodeIndexId = 0;
		for(var n=0; n < mesh_nodes.indexArray.length; n++) {
			var idxIndex = n;

			this.arrayNodeIndices.push(this.startIndexId+mesh_nodes.indexArray[idxIndex]);
			//console.log(this.startIndexId+bo.nodeMeshIndexArray[idxIndex]);

			if(mesh_nodes.indexArray[idxIndex] > maxNodeIndexId) {
				maxNodeIndexId = mesh_nodes.indexArray[idxIndex];
			}
		}

		if(this.startIndexId == 0) {
			if(this.splitNodes.length == 0) {
				this.splitNodesEvery = parseInt(MAX_ITEMS_PER_ARRAY/this.arrayNodeIndices.length); // 1=1 circle(12segm (3 indices per segm))= 3*12 indices
				this.splitNodes.push((this.arrayNodeData.length/4)*this.splitNodesEvery);
				this.splitNodesIndices.push(this.arrayNodeIndices.length*this.splitNodesEvery);
			} else {
				this.splitNodes.push(this.splitNodes[0]*(this.splitNodes.length+1));
				this.splitNodesIndices.push(this.splitNodesIndices[0]*(this.splitNodesIndices.length+1));
			}
		}
		this.startIndexId += (maxNodeIndexId+1);


		this.currentNodeId++; // augment node id

		//return this.currentNodeId-1;
		return {"nodeId": this.currentNodeId-1, "itemStart": nAIS, "layoutNodeArgumentData": jsonIn.layoutNodeArgumentData}; // nodeArrayItemStart
	}).bind(this);

	/**
	 * updateNodes
	 */
	this.updateNodes = function() {
		console.log((this.currentNodeId)+" nodes");
		
		comp_renderer_nodes.setArg("data", (function() {return this.arrayNodeData;}).bind(this), this.splitNodes);

		if(comp_renderer_nodes.getTempBuffers()["posXYZW"] != undefined) {
			var arr4Uint8_XYZW = comp_renderer_nodes.getWebCLGL().enqueueReadBuffer_Float4(comp_renderer_nodes.getTempBuffers()["posXYZW"]);
			//var arr4Uint8_XYZW = this.clglLayout_nodes.CLGL_bufferPosXYZW.Float4;
			for(var n = 0, f = arr4Uint8_XYZW[0].length; n < f; n++) {
				var idx = n*4;
				this.arrayNodePosXYZW[idx] = arr4Uint8_XYZW[0][n];
				this.arrayNodePosXYZW[idx+1] = arr4Uint8_XYZW[1][n];
				this.arrayNodePosXYZW[idx+2] = arr4Uint8_XYZW[2][n];
				this.arrayNodePosXYZW[idx+3] = arr4Uint8_XYZW[3][n];
			}

		}
        comp_renderer_nodes.setUpdateFromKernel("posXYZW");
		comp_renderer_nodes.setArg("posXYZW", (function() {return this.arrayNodePosXYZW;}).bind(this), this.splitNodes);

		comp_renderer_nodes.setArg("nodeVertexPos", (function() {return this.arrayNodeVertexPos;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("nodeVertexNormal", (function() {return this.arrayNodeVertexNormal;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("nodeVertexTexture", (function() {return this.arrayNodeVertexTexture;}).bind(this), this.splitNodes);

		comp_renderer_nodes.setArg("nodeImgColumns", (function() {return NODE_IMG_COLUMNS;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("nodeImgId", (function() {return this.arrayNodeImgId;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setIndices((function() {return this.arrayNodeIndices;}).bind(this), this.splitNodesIndices);

		this.arrayNodeDir = [];
		for(var n=0; n < (this.arrayNodeData.length/4); n++) {
			this.arrayNodeDir.push(0, 0, 0, 1.0);
		}
        comp_renderer_nodes.setUpdateFromKernel("dir");
		comp_renderer_nodes.setArg("dir", (function() {return this.arrayNodeDir;}).bind(this), this.splitNodes);

		comp_renderer_nodes.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_nodes.setArgUpdatable("PMatrix", true);
		comp_renderer_nodes.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_nodes.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_nodes.setArg("nodeWMatrix", (function() {return nodes.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_nodes.setArgUpdatable("nodeWMatrix", true);

		comp_renderer_nodes.setArg("isNode", (function() {return 1;}).bind(this));

		for(var argNameKey in _customArgs) {
			var expl = _customArgs[argNameKey].arg.split("*");
			if(expl.length > 0) { // argument is type buffer
				comp_renderer_nodes.setArg(argNameKey, (function() {return _customArgs[argNameKey].nodes_array_value;}).bind(this), this.splitNodes);
			}
		}

		//updateNodesText();
	};

	/**
	 * getNodesCount
	 * @returns {Int}
	 */
	this.getNodesCount = function() {
		return (this.arrayNodeData.length/4);
	};
	
	/**
	 * getLinksCount
	 * @returns {Int}
	 */
	this.getLinksCount = function() {
		return Object.keys(_links).length;
	};










	/**
	* Create new node for the graph
	* @param {Object} jsonIn
	* @param {String} jsonIn.origin - NodeName Origin for this link
	* @param {String} jsonIn.target - NodeName Target for this link
	* @param {Bool} [jsonIn.directed=false] -
	 */
	this.addLink = function(jsonIn) {
		if(_links.hasOwnProperty(jsonIn.origin+"->"+jsonIn.target) == false) {
			console.log("%clink "+jsonIn.origin+"->"+jsonIn.target, "color:green");
			
			var directed = (jsonIn != undefined && jsonIn.directed != undefined) ? jsonIn.directed : false;

			var json = {
					"origin_nodeName": jsonIn.origin,
					"target_nodeName": jsonIn.target,
					"origin_nodeId": _nodesByName[jsonIn.origin].nodeId,
					"target_nodeId": _nodesByName[jsonIn.target].nodeId,
					"origin_itemStart": _nodesByName[jsonIn.origin].itemStart,
					"target_itemStart": _nodesByName[jsonIn.target].itemStart,
					"origin_layoutNodeArgumentData": _nodesByName[jsonIn.origin].layoutNodeArgumentData,
					"target_layoutNodeArgumentData": _nodesByName[jsonIn.target].layoutNodeArgumentData,
					"directed": directed
					};

			var blId = addLinkNow(json);
			if(directed == true) addArrowNow(json);

			// ADD LINK TO ARRAY LINKS
			_links[jsonIn.origin+"->"+jsonIn.target] = json;
			//console.log("link "+jsonIn.origin+"->"+jsonIn.target);
			
			
			//
			for(var n=0; n < (this.arrayNodeData.length/4); n++) {
				var id = n*4;
				if(this.arrayNodeData[id] == _nodesByName[jsonIn.origin].nodeId) {
					this.arrayNodeData[id+1] = _nodesByName[jsonIn.target].nodeId;
					this.arrayNodeData[id+2] = this.arrayNodeData[id+2];
					this.arrayNodeData[id+3] = this.arrayNodeData[id+3]+1.0;
				}
				if(this.arrayNodeData[id] == _nodesByName[jsonIn.target].nodeId) {
					this.arrayNodeData[id+1] = _nodesByName[jsonIn.origin].nodeId;
					this.arrayNodeData[id+2] = this.arrayNodeData[id+2]+1.0;
					this.arrayNodeData[id+3] = this.arrayNodeData[id+3]+1.0;
				}
			}
			
		} else {
			console.log("link "+jsonIn.origin+"->"+jsonIn.target+" already exists");
			return false;
		}
	};
	/**
	* Create new link for the graph
	* @param {Object} jsonIn
	* @param {Int} jsonIn.origin_nodeName
	* @param {Int} jsonIn.target_nodeName
	* @param {Int} jsonIn.origin_nodeId
	* @param {Int} jsonIn.target_nodeId
	* @param {Int} jsonIn.origin_itemStart
	* @param {Int} jsonIn.target_itemStart
	* @param {Int} jsonIn.origin_layoutNodeArgumentData
	* @param {Int} jsonIn.target_layoutNodeArgumentData
	* @param {Bool} [jsonIn.directed=false]
	* @returns {Int}
	* @private
	 */
	var addLinkNow = (function(jsonIn) {
		// (origin)
		this.arrayLinkData.push(jsonIn.origin_nodeId, jsonIn.target_nodeId, 0.0, 0.0);
		this.arrayLinkNodeName.push(jsonIn.origin_nodeName);
		this.arrayLinkPosXYZW.push(	0.0, 0.0, 0.0, 1.0);
		this.arrayLinkVertexPos.push(0.0, 0.0, 0.0, 1.0);
		if(jsonIn.origin_layoutNodeArgumentData != undefined) {
			for(var argNameKey in _customArgs) {
				var expl = _customArgs[argNameKey].arg.split("*");
				if(expl.length > 0) { // argument is type buffer
					if(jsonIn.origin_layoutNodeArgumentData.hasOwnProperty(argNameKey) == true && jsonIn.origin_layoutNodeArgumentData[argNameKey] != undefined) {
						if(expl[0] == "float")
							_customArgs[argNameKey].links_array_value.push(jsonIn.origin_layoutNodeArgumentData[argNameKey]);
						else if(expl[0] == "float4")
							_customArgs[argNameKey].links_array_value.push(	jsonIn.origin_layoutNodeArgumentData[argNameKey][0],
																			jsonIn.origin_layoutNodeArgumentData[argNameKey][1],
																			jsonIn.origin_layoutNodeArgumentData[argNameKey][2],
																			jsonIn.origin_layoutNodeArgumentData[argNameKey][3]);
					}
				}
			}
		}

		// (target)
		this.arrayLinkData.push(jsonIn.target_nodeId, jsonIn.origin_nodeId, 1.0, 0.0);
		this.arrayLinkNodeName.push(jsonIn.target_nodeName);
		this.arrayLinkPosXYZW.push(	0.0, 0.0, 0.0, 1.0);
		this.arrayLinkVertexPos.push(0.0, 0.0, 0.0, 1.0);
		if(jsonIn.target_layoutNodeArgumentData != undefined) {
			for(var argNameKey in _customArgs) {
				var expl = _customArgs[argNameKey].arg.split("*");
				if(expl.length > 0) { // argument is type buffer
					if(jsonIn.target_layoutNodeArgumentData.hasOwnProperty(argNameKey) == true && jsonIn.target_layoutNodeArgumentData[argNameKey] != undefined) {
						if(expl[0] == "float")
							_customArgs[argNameKey].links_array_value.push(jsonIn.target_layoutNodeArgumentData[argNameKey]);
						else if(expl[0] == "float4")
							_customArgs[argNameKey].links_array_value.push(	jsonIn.target_layoutNodeArgumentData[argNameKey][0],
																			jsonIn.target_layoutNodeArgumentData[argNameKey][1],
																			jsonIn.target_layoutNodeArgumentData[argNameKey][2],
																			jsonIn.target_layoutNodeArgumentData[argNameKey][3]);
					}
				}
			}
		}


		if(this.splitLinksIndices.length > 0 && this.arrayLinkIndices.length == this.splitLinksIndices[this.splitLinksIndices.length-1]) {
			this.startIndexId_link = 0;
		}
		this.arrayLinkIndices.push(this.startIndexId_link, this.startIndexId_link+1);

		if(this.startIndexId_link == 0) {
			if(this.splitLinks.length == 0) {
				this.splitLinksEvery = parseInt(MAX_ITEMS_PER_ARRAY/this.arrayLinkIndices.length); // 1=1 link=2 indices
				this.splitLinks.push((this.arrayLinkData.length/4)*this.splitLinksEvery);
				this.splitLinksIndices.push(this.arrayLinkIndices.length*this.splitLinksEvery);
			} else {
				this.splitLinks.push(this.splitLinks[0]*(this.splitLinks.length+1));
				this.splitLinksIndices.push(this.splitLinksIndices[0]*(this.splitLinksIndices.length+1));
			}
		}
		this.startIndexId_link += 2;


		this.currentLinkId += 2; // augment link id

		return this.currentLinkId-2;
	}).bind(this);

	/**
	 * updateLinks
	 */
	this.updateLinks = function() {
		console.log(Object.keys(_links).length+" links");
		

		
		
		comp_renderer_nodes.setArg("data", (function() {return this.arrayNodeData;}).bind(this), this.splitNodes);
		comp_renderer_links.setArg("data", (function() {return this.arrayLinkData;}).bind(this), this.splitLinks);
		comp_renderer_links.setSharedBufferArg("posXYZW", comp_renderer_nodes);
		comp_renderer_links.setArg("nodeVertexPos", (function() {return this.arrayLinkVertexPos;}).bind(this), this.splitLinks);
		comp_renderer_links.setIndices((function() {return this.arrayLinkIndices;}).bind(this), this.splitLinksIndices);

		comp_renderer_links.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_links.setArgUpdatable("PMatrix", true);
		comp_renderer_links.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_links.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_links.setArg("nodeWMatrix", (function() {return nodes.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_links.setArgUpdatable("nodeWMatrix", true);

		comp_renderer_links.setArg("isLink", (function() {return 1;}).bind(this));

		for(var argNameKey in _customArgs) {
			var expl = _customArgs[argNameKey].arg.split("*");
			if(expl.length > 0) { // argument is type buffer
				comp_renderer_links.setArg(argNameKey, (function() {return _customArgs[argNameKey].links_array_value;}).bind(this), this.splitLinks);
			}
		}

		updateArrows();
	};
	
	/**
	 * clear
	 */
	this.clear = function() {
		_project.getActiveStage().removeNode(nodes);
		_project.getActiveStage().removeNode(links);
		_project.getActiveStage().removeNode(arrows);
		_project.getActiveStage().removeNode(nodesText);
		
		/*_nodesByName = {};
		_nodesById = {};
		_links = {};
		adjacencyMatrix = null;
		
		_customArgs = {}; // {ARG: {"arg": String, "value": Array<Float>}}

		// nodes image
		objNodeImages = {};
		canvasNodeImg = document.createElement('canvas');
		canvasNodeImg.width = NODE_IMG_WIDTH;
		canvasNodeImg.height = NODE_IMG_WIDTH;
		ctxNodeImg = canvasNodeImg.getContext('2d');

		canvasNodeImgTMP = document.createElement('canvas');
		canvasNodeImgTMP.width = NODE_IMG_SPRITE_WIDTH;
		canvasNodeImgTMP.height = NODE_IMG_SPRITE_WIDTH;
		ctxNodeImgTMP = canvasNodeImgTMP.getContext('2d');

		nodesImgMask = null;
		nodesImgMaskLoaded = false;
		
		//**************************************************
		//  NODES
		//**************************************************
		this.splitNodes = [];
		this.splitNodesIndices = [];

		this.arrayNodeData = [];
		this.arrayNodePosXYZW = [];
		this.arrayNodeVertexPos = [];
		this.arrayNodeVertexNormal = [];
		this.arrayNodeVertexTexture = [];
		this.startIndexId = 0;
		this.arrayNodeIndices = [];

		this.arrayNodeImgId = [];

		this.arrayNodeDir = [];

		this.currentNodeId = 0;
		this.nodeArrayItemStart = 0;

		//**************************************************
		//  LINKS
		//**************************************************
		this.splitLinks = [];
		this.splitLinksIndices = [];

		this.arrayLinkData = [];
		this.arrayLinkNodeName = [];
		this.arrayLinkPosXYZW = [];
		this.arrayLinkVertexPos = [];
		this.startIndexId_link = 0;
		this.arrayLinkIndices = [];

		this.currentLinkId = 0;

		//**************************************************
		//  ARROWS
		//**************************************************
		this.splitArrows = [];
		this.splitArrowsIndices = [];

		this.arrayArrowData = [];
		this.arrayArrowNodeName = [];
		this.arrayArrowPosXYZW = [];
		this.arrayArrowVertexPos = [];
		this.arrayArrowVertexNormal = [];
		this.arrayArrowVertexTexture = [];
		this.startIndexId_arrow = 0;
		this.arrayArrowIndices = [];

		this.currentArrowId = 0;
		this.arrowArrayItemStart = 0;

		//**************************************************
		//  NODESTEXT
		//**************************************************
		this.splitNodesText = [];
		this.splitNodesTextIndices = [];

		this.arrayNodeTextData = [];
		this.arrayNodeTextNodeName = [];
		this.arrayNodeTextPosXYZW = [];
		this.arrayNodeTextVertexPos = [];
		this.arrayNodeTextVertexNormal = [];
		this.arrayNodeTextVertexTexture = [];
		this.startIndexId_nodestext = 0;
		this.arrayNodeTextIndices = [];

		this.arrayNodeText_itemStart = [];
		this.arrayNodeTextLetterId = [];

		this.currentNodeTextId = 0;
		this.nodeTextArrayItemStart = 0;*/
	};

	var setAdjMat = function(id) {
		var num = id/_ADJ_MATRIX_WIDTH_TOTAL;
		var idX = new Utils().fract(num)*_ADJ_MATRIX_WIDTH_TOTAL;
		var idY = Math.floor(num);


		var x = idX/_ADJ_MATRIX_WIDTH;
		var xx = Math.floor(x);

		var y = idY/_ADJ_MATRIX_WIDTH;
		var yy = Math.floor(y);


		var currentItemArrayAdjMatrix = (yy*_numberOfColumns)+xx;

		var iX = new Utils().fract(x)*_ADJ_MATRIX_WIDTH;
		var iY = new Utils().fract(y)*_ADJ_MATRIX_WIDTH;

		var currentItemAdjMatrix = (iY*_ADJ_MATRIX_WIDTH)+iX;


		//arrAdjMatrix[currentItemArrayAdjMatrix][Math.round(currentItemAdjMatrix)] = 1;

        var idSTORE = currentItemArrayAdjMatrix/maxItemsInSTORE;
        arrAdjMatrix_STORE[Math.floor(idSTORE)][currentItemArrayAdjMatrix-Math.floor(idSTORE*maxItemsInSTORE)][Math.round(currentItemAdjMatrix)] = 1;
	};

	/**
	 * enableForceLayout
	 */
	this.enableForceLayout = function() {


		/*var width = 2; //  this.currentNodeId
		
		var adjMatrixSize = 5000;
		for(var n=0, fn=Math.ceil(this.currentNodeId/adjMatrixSize)*2; n < fn; n++) {
			arrAdjMatrix[n] = new Float32Array(adjMatrixSize*adjMatrixSize);
		}
		adjacencyMatrix = new Float32Array(width*width);
		for(var key in _links) {
			var origin = _links[key].origin_nodeId;
			var target = _links[key].target_nodeId;
			
			adjacencyMatrix[(origin*width)+target] = 1;
			adjacencyMatrix[(target*width)+origin] = 1;
		}*/






		// new
		_numberOfColumns = Math.ceil(this.currentNodeId/_ADJ_MATRIX_WIDTH);
		_numberOfAdjMatrix = _numberOfColumns*_numberOfColumns;
        _ADJ_MATRIX_WIDTH_TOTAL = _numberOfColumns*_ADJ_MATRIX_WIDTH;

        arrAdjMatrix_STORE = [];
        arrAdjMatrix = [];
        arrAdjMatrix_WCLGL = [];


		// creating adjMatrixArray
		for(var n=0; n < _numberOfAdjMatrix; n++) {
            var idSTORE = n/maxItemsInSTORE;
            if(arrAdjMatrix_STORE[Math.floor(idSTORE)] == undefined)
                arrAdjMatrix_STORE[Math.floor(idSTORE)] = [];

            arrAdjMatrix_STORE[Math.floor(idSTORE)][n-Math.floor(idSTORE*maxItemsInSTORE)] = new Float32Array(_ADJ_MATRIX_WIDTH*_ADJ_MATRIX_WIDTH);
		}

		// walk relations and adding in corresponding adjMatrixArray item
		for(var key in _links) {
			var origin = _links[key].origin_nodeId;
			var target = _links[key].target_nodeId;

			var id = (origin*_ADJ_MATRIX_WIDTH_TOTAL)+target;
			var idSymmetrical = (target*_ADJ_MATRIX_WIDTH_TOTAL)+origin;


			// id
			setAdjMat(id);
			setAdjMat(idSymmetrical);
		}

        // creating adjMatrixArray
        /*for(var n=0; n < _numberOfAdjMatrix; n++) {
            var idSTORE = n/maxItemsInSTORE;
            if(arrAdjMatrix_STORE_WCLGL[Math.floor(idSTORE)] == undefined)
                arrAdjMatrix_STORE_WCLGL[Math.floor(idSTORE)] = [];

            arrAdjMatrix_STORE_WCLGL[Math.floor(idSTORE)][n-Math.floor(idSTORE*maxItemsInSTORE)] = comp_renderer_nodes.setArg("adjacencyMatrix", (function(nn) {return arrAdjMatrix_STORE[idSTORE][nn-(idSTORE*maxItemsInSTORE)];}).bind(this, n));
        }*/




		comp_renderer_nodes.setArg("widthAdjMatrix", (function() {return _ADJ_MATRIX_WIDTH;}).bind(this));
		comp_renderer_nodes.setArg("enableForceLayout", (function() {return 1.0;}).bind(this));

		comp_renderer_nodes.setArg("adjacencyMatrix", (function() {return arrAdjMatrix_STORE[0][0];}).bind(this));
		comp_renderer_nodes.setArg("currentAdjMatrix", (function() {return _currentAdjMatrix;}).bind(this));
		comp_renderer_nodes.setArg("numberOfColumns", (function() {return _numberOfColumns;}).bind(this));

		_enabledForceLayout = true;

		for(var n=0; n < _numberOfAdjMatrix; n++) {
            var idSTORE = n/maxItemsInSTORE;
			this.adjacencyMatrixToImage(arrAdjMatrix_STORE[Math.floor(idSTORE)][n-Math.floor(idSTORE*maxItemsInSTORE)], _ADJ_MATRIX_WIDTH, (function(img) {
			    document.body.appendChild(img);
            }).bind(this));
        }

		_buffAdjMatrix = comp_renderer_nodes.getBuffers()["adjacencyMatrix"];
	};
	
	/**
	 * disableForceLayout
	 */
	this.disableForceLayout = function() {
		comp_renderer_nodes.setArg("enableForceLayout", (function() {return 0.0;}).bind(this));
	};
	
	/**
	 * enableForceLayoutCollision
	 */
	this.enableForceLayoutCollision = function() {
		comp_renderer_nodes.setArg("enableForceLayoutCollision", (function() {return 1.0;}).bind(this));
	};
	
	/**
	 * disableForceLayoutCollision
	 */
	this.disableForceLayoutCollision = function() {
		comp_renderer_nodes.setArg("enableForceLayoutCollision", (function() {return 0.0;}).bind(this));
	};
	
	/**
	 * enableForceLayoutRepulsion
	 */
	this.enableForceLayoutRepulsion = function() {
		comp_renderer_nodes.setArg("enableForceLayoutRepulsion", (function() {return 1.0;}).bind(this));
	};
	
	/**
	 * disableForceLayoutRepulsion
	 */
	this.disableForceLayoutRepulsion = function() {
		comp_renderer_nodes.setArg("enableForceLayoutRepulsion", (function() {return 0.0;}).bind(this));
	};

	/**
	 * @callback Graph~adjacencyMatrixToImage~onload
	 * @param {HTMLImageElement} img
	 */
	/**
	 * adjacencyMatrixToImage
     * @param {Float32Array} adjMat
	 * @param {Graph~adjacencyMatrixToImage~onload} onload
	 */
	this.adjacencyMatrixToImage = function(adjMat, width, onload) {
		var toArrF = (function(arr) {
			var arrO = new Uint8Array(arr.length*4);
			for(var n=0; n < arr.length; n++) {
				var idO = n*4;
				arrO[idO] = arr[n]*255;
				arrO[idO+1] = arr[n]*255;
				arrO[idO+2] = arr[n]*255;
				arrO[idO+3] = 255;
			}
			
			return arrO;
		}).bind(this);
		
		var toImage = (function(fn, arrO, w, h) {			
			var canvas = new Utils().getCanvasFromUint8Array(arrO, w, h);
			new Utils().getImageFromCanvas(canvas, (function(fn, im) {
				fn(im);
			}).bind(this, fn));
		}).bind(this, onload);
		
		//var width = this.currentNodeId;
		
		var arrF = toArrF(adjMat);
		toImage(arrF, width, width);
	};
	
	/**
	 * loadRBFromFile
	 * @param {String} fileurl
	 * @param {Callback} [onload=undefined]
	 */
	this.loadRBFromFile = function(fileurl, onload) {
		var req = new XHR();
		req.open("GET", fileurl, true);
		req.addEventListener("load", (function(onload, evt) {
			console.log("RB file Loaded");
			this.loadRBFromStr(evt.target.responseText);
			
			if(onload != undefined) onload();
		}).bind(this, onload));
		
		req.addEventListener("error", (function(evt) { 
			console.log(evt);
		}).bind(this));
		
	    req.send(null);
	};

	/**
	 * loadRBFromStr
	 * @param {String} str
	 */
	this.loadRBFromStr = function(str) {
		var _sourceText = str;
		var lines = _sourceText.split("\r\n");
		if(lines.length == 1) lines = _sourceText.split("\n");
		
		//if(lines[0].match(/OBJ/gim) == null) {alert('Not OBJ file');	return;}
		var line0 = lines[0].replace(/(\s|\t)+/gi, ' ').trim().split(" ");
		var title = (line0[0] != undefined) ? line0[0] : null; // Title
		var key = (line0[1] != undefined) ? line0[1] : null; // Key
		console.log(line0);
		
		var line1 = lines[1].replace(/(\s|\t)+/gi, ' ').trim().split(" ");
		var tLines = (line1[0] != undefined) ? parseInt(line1[0]) : null; // Total number of lines excluding header (TOTCRD)
		var tLinesPointers = (line1[1] != undefined) ? parseInt(line1[1]) : null; // Number of lines for pointers (PTRCRD)
		var tLinesRowIndices = (line1[2] != undefined) ? parseInt(line1[2]) : null; // Number of lines for row (or variable) indices (INDCRD)
		var tLinesValues = (line1[3] != undefined) ? parseInt(line1[3]) : null; // Number of lines for numerical values (VALCRD)
		var tLinesRH = (line1[4] != undefined) ? parseInt(line1[4]) : null; // Number of lines for right-hand sides (RHSCRD)		
		console.log(line1);
		
		
		var line2 = lines[2].replace(/(\s|\t)+/gi, ' ').trim().split(" ");
		var matType = (line2[0] != undefined) ? line2[0] : null; // Matrix type (see below) (MXTYPE)
		var rowCount = (line2[1] != undefined) ? parseInt(line2[1]) : null; // Number of rows (or variables) (NROW)
		var colCount = (line2[2] != undefined) ? parseInt(line2[2]) : null; // Number of columns (or elements) (NCOL)
		var rowIndCount = (line2[3] != undefined) ? parseInt(line2[3]) : null; // Number of row (or variable) indices (NNZERO)		(equal to number of entries for assembled matrices)
		var matEntCount = (line2[4] != undefined) ? parseInt(line2[4]) : null; // Number of elemental matrix entries (NELTVL)		(zero in the case of assembled matrices)
		console.log(line2);
		
		var line3 = lines[3].replace(/(\s|\t)+/gi, ' ').trim().split(" ");
		var pointerFormat = (line3[0] != undefined) ? line3[0] : null; // Format for pointers (PTRFMT)
		var rowIndFormat = (line3[1] != undefined) ? line3[1] : null; // Format for row (or variable) indices (INDFMT)
		var valuesFormat = (line3[2] != undefined) ? line3[2] : null; // Format for numerical values of coefficient matrix (VALFMT)
		var RHFormat = (line3[3] != undefined) ? line3[3] : null; // Format for numerical values of right-hand sides (RHSFMT)
		console.log(line3);
		
		
		var offs = 1000/10;
		for(var n = 0; n < rowCount; n++) {
			var pos = [-(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), 1.0];

			var node = this.addNode({
				"name": n.toString(),
				"data": n.toString(),
				"position": pos,
				"color": ((n % 2) ? "../_RESOURCES/lena_128x128.jpg" : "../_RESOURCES/cartman08.jpg"),
				"layoutNodeArgumentData": {
											// dir
											"ndirect": [0.0, 0.0, 0.0, 1.0],
											// pp
											"particlePolarity": 0.0,
											// destination
											"dest": [0.0, 0.0, 0.0, 0.0],
											// lifeDistance
											"initPos": pos, "initDir": [0.0, 0.0, 0.0, 0.0],
											// nodeColor
											"nodeColor": [Math.random(), Math.random(), Math.random(), 1.0],
											// lock
											"nodeLock": 0.0},
				"onmouseup": (function(nodeData) {

				}).bind(this)});
		}
		
		this.updateNodes();

		
		var startValues = 4;
		var str = "";
		for(var n = startValues; n < startValues+tLinesPointers; n++) {
			str += lines[n];
		}
		console.log(str);
		var pointers = str.replace(/(\s|\t)+/gi, ' ').trim().split(" ");
		
		str = "";
		for(var n = startValues+tLinesPointers; n < startValues+tLinesPointers+tLinesRowIndices; n++) {
			str += lines[n];
		}
		console.log(str);		
		var rowIndices = str.replace(/(\s|\t)+/gi, ' ').trim().split(" ");
		
		
		
		
		var yy = 0;
		for(var n=0, fn = pointers.length; n < fn; n++) {
			var pointer = parseInt(pointers[n])-1;
			var nextPointer = parseInt(pointers[n+1])-1;
			
			for(var nb=0, fnb = nextPointer-pointer; nb < fnb; nb++) {
				var xx = parseInt(rowIndices[pointer+nb])-1;  
				
				this.addLink({	"origin": xx,
								"target": yy,
								"directed": true});
			}
			
			yy++;
		}
		this.updateLinks();
		
		
		
		
		/*this.adjacencyMatrixToImage(function(im) {
			document.body.appendChild(im);
			im.style.border = "1px solid red";
		})*/
	};










	/**
	* Create new arrow for the graph
	* @param {Object} jsonIn
	* @param {Int} jsonIn.origin_nodeName
	* @param {Int} jsonIn.target_nodeName
	* @param {Int} jsonIn.origin_nodeId
	* @param {Int} jsonIn.target_nodeId
	* @param {Int} jsonIn.origin_itemStart
	* @param {Int} jsonIn.target_itemStart
	* @param {Int} jsonIn.origin_layoutNodeArgumentData
	* @param {Int} jsonIn.target_layoutNodeArgumentData
	* @param {Bool} [jsonIn.directed=false]
	* @param {Mesh} [jsonIn.node] - Node with the mesh for the node
	* @returns {Int}
	* @private
	 */
	var addArrowNow = (function(jsonIn) {
		if(jsonIn != undefined && jsonIn.node != undefined)
			mesh_arrows = jsonIn.node;

		var oppositeId = 0;

		for(var o=0; o < 2; o++) {
			for(var n=0; n < mesh_arrows.vertexArray.length/4; n++) {
				var idxVertex = n*4;
				if(o == 0) oppositeId = this.arrowArrayItemStart;

				this.arrayArrowPosXYZW.push(0.0, 0.0, 0.0, 1.0);
				//this.arrayArrowPosXYZW_opposite.push(0.0, 0.0, 0.0, 1.0);
				this.arrayArrowVertexPos.push(mesh_arrows.vertexArray[idxVertex], mesh_arrows.vertexArray[idxVertex+1], mesh_arrows.vertexArray[idxVertex+2], 1.0);
				this.arrayArrowVertexNormal.push(mesh_arrows.normalArray[idxVertex], mesh_arrows.normalArray[idxVertex+1], mesh_arrows.normalArray[idxVertex+2], 1.0);
				this.arrayArrowVertexTexture.push(mesh_arrows.textureArray[idxVertex], mesh_arrows.textureArray[idxVertex+1], mesh_arrows.textureArray[idxVertex+2], 1.0);
				if(o == 0) {
					this.arrayArrowData.push(jsonIn.origin_nodeId, jsonIn.target_nodeId, 0.0, 0.0);
					this.arrayArrowNodeName.push(jsonIn.origin_nodeName);
					if(jsonIn.origin_layoutNodeArgumentData != undefined) {
						for(var argNameKey in _customArgs) {
							var expl = _customArgs[argNameKey].arg.split("*");
							if(expl.length > 0) { // argument is type buffer
								if(jsonIn.origin_layoutNodeArgumentData.hasOwnProperty(argNameKey) == true && jsonIn.origin_layoutNodeArgumentData[argNameKey] != undefined) {
									if(expl[0] == "float")
										_customArgs[argNameKey].arrows_array_value.push(jsonIn.origin_layoutNodeArgumentData[argNameKey]);
									else if(expl[0] == "float4")
										_customArgs[argNameKey].arrows_array_value.push(jsonIn.origin_layoutNodeArgumentData[argNameKey][0],
																						jsonIn.origin_layoutNodeArgumentData[argNameKey][1],
																						jsonIn.origin_layoutNodeArgumentData[argNameKey][2],
																						jsonIn.origin_layoutNodeArgumentData[argNameKey][3]);
								}
							}
						}
					}
				} else {
					this.arrayArrowData.push(jsonIn.target_nodeId, jsonIn.origin_nodeId, 1.0, 0.0);
					this.arrayArrowNodeName.push(jsonIn.target_nodeName);
					if(jsonIn.target_layoutNodeArgumentData != undefined) {
						for(var argNameKey in _customArgs) {
							var expl = _customArgs[argNameKey].arg.split("*");
							if(expl.length > 0) { // argument is type buffer
								if(jsonIn.target_layoutNodeArgumentData.hasOwnProperty(argNameKey) == true && jsonIn.target_layoutNodeArgumentData[argNameKey] != undefined) {
									if(expl[0] == "float")
										_customArgs[argNameKey].arrows_array_value.push(jsonIn.target_layoutNodeArgumentData[argNameKey]);
									else if(expl[0] == "float4")
										_customArgs[argNameKey].arrows_array_value.push(jsonIn.target_layoutNodeArgumentData[argNameKey][0],
																						jsonIn.target_layoutNodeArgumentData[argNameKey][1],
																						jsonIn.target_layoutNodeArgumentData[argNameKey][2],
																						jsonIn.target_layoutNodeArgumentData[argNameKey][3]);
								}
							}
						}
					}
				}

				this.arrowArrayItemStart++;
			}
			if(this.splitArrowsIndices.length > 0 && this.arrayArrowIndices.length == this.splitArrowsIndices[this.splitArrowsIndices.length-1]) {
				this.startIndexId_arrow = 0;
			}
			var maxArrowIndexId = 0;
			for(var n=0; n < mesh_arrows.indexArray.length; n++) {
				var idxIndex = n;

				this.arrayArrowIndices.push(this.startIndexId_arrow+mesh_arrows.indexArray[idxIndex]);
				//console.log(this.startIndexId+bo.nodeMeshIndexArray[idxIndex]);

				if(mesh_arrows.indexArray[idxIndex] > maxArrowIndexId) {
					maxArrowIndexId = mesh_arrows.indexArray[idxIndex];
				}
			}

			if(this.startIndexId_arrow == 0) {
				if(this.splitArrows.length == 0) {
					this.splitArrowsEvery = parseInt(MAX_ITEMS_PER_ARRAY/(this.arrayArrowIndices.length*2.0)); // 2=2 triangle=6 indices
					this.splitArrows.push((this.arrayArrowData.length/4)*this.splitArrowsEvery);
					this.splitArrowsIndices.push(this.arrayArrowIndices.length*this.splitArrowsEvery);
				} else {
					this.splitArrows.push(this.splitArrows[0]*(this.splitArrows.length+1));
					this.splitArrowsIndices.push(this.splitArrowsIndices[0]*(this.splitArrowsIndices.length+1));
				}
			}
			this.startIndexId_arrow += (maxArrowIndexId+1);


			this.currentArrowId++; // augment arrow id
		}
	}).bind(this);
	/** @private */
	var updateArrows = (function() {
		comp_renderer_arrows.setArg("data", (function() {return this.arrayArrowData;}).bind(this), this.splitArrows);
		comp_renderer_arrows.setSharedBufferArg("posXYZW", comp_renderer_nodes);

		comp_renderer_arrows.setArg("nodeVertexPos", (function() {return this.arrayArrowVertexPos;}).bind(this), this.splitArrows);
		comp_renderer_arrows.setArg("nodeVertexNormal", (function() {return this.arrayArrowVertexNormal;}).bind(this), this.splitArrows);
		comp_renderer_arrows.setArg("nodeVertexTexture", (function() {return this.arrayArrowVertexTexture;}).bind(this), this.splitArrows);
		comp_renderer_arrows.setIndices((function() {return this.arrayArrowIndices;}).bind(this), this.splitArrowIndices);

		comp_renderer_arrows.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_arrows.setArgUpdatable("PMatrix", true);
		comp_renderer_arrows.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_arrows.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_arrows.setArg("nodeWMatrix", (function() {return nodes.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_arrows.setArgUpdatable("nodeWMatrix", true);

		comp_renderer_arrows.setArg("isArrow", (function() {return 1.0;}).bind(this));
		//comp_renderer_arrows.setArg("isLink", (function() {return 1.0;}).bind(this));

		for(var argNameKey in _customArgs) {
			var expl = _customArgs[argNameKey].arg.split("*");
			if(expl.length > 0) { // argument is type buffer
				comp_renderer_arrows.setArg(argNameKey, (function() {return _customArgs[argNameKey].arrows_array_value;}).bind(this), this.splitArrows);
			}
		}
	}).bind(this);















	/** @private */
	var addNodeTextNow = (function(jsonIn) {
		for(var i = 0; i < nodesTextPlanes; i++) {
			var letterId;
			if(jsonIn.text[i] != undefined) {
				letterId = getLetterId(jsonIn.text[i]);

				if(letterId == undefined)
					letterId = getLetterId(" ");
			} else {
				letterId = getLetterId(" ");
			}

			for(var n=0; n < mesh_nodesText.vertexArray.length/4; n++) {
				var idxVertex = n*4;

				this.arrayNodeTextData.push(jsonIn.nodeId, this.currentNodeTextId, 0.0, 0.0);
				this.arrayNodeTextPosXYZW.push(0.0, 0.0, 0.0, 1.0);
				this.arrayNodeTextVertexPos.push(mesh_nodesText.vertexArray[idxVertex]+(i*0.5), mesh_nodesText.vertexArray[idxVertex+1], mesh_nodesText.vertexArray[idxVertex+2], 1.0);
				this.arrayNodeTextVertexNormal.push(mesh_nodesText.normalArray[idxVertex], mesh_nodesText.normalArray[idxVertex+1], mesh_nodesText.normalArray[idxVertex+2], 1.0);
				this.arrayNodeTextVertexTexture.push(mesh_nodesText.textureArray[idxVertex], mesh_nodesText.textureArray[idxVertex+1], mesh_nodesText.textureArray[idxVertex+2], 1.0);

				this.arrayNodeTextNodeName.push(jsonIn.name);

				this.arrayNodeText_itemStart.push(jsonIn.itemStart);

				this.arrayNodeTextLetterId.push(letterId);

				if(jsonIn.layoutNodeArgumentData != undefined) {
					for(var argNameKey in _customArgs) {
						var expl = _customArgs[argNameKey].arg.split("*");
						if(expl.length > 0) { // argument is type buffer
							if(jsonIn.layoutNodeArgumentData.hasOwnProperty(argNameKey) == true && jsonIn.layoutNodeArgumentData[argNameKey] != undefined) {
								if(expl[0] == "float")
									_customArgs[argNameKey].nodestext_array_value.push(jsonIn.layoutNodeArgumentData[argNameKey]);
								else if(expl[0] == "float4")
									_customArgs[argNameKey].nodestext_array_value.push(	jsonIn.layoutNodeArgumentData[argNameKey][0],
																						jsonIn.layoutNodeArgumentData[argNameKey][1],
																						jsonIn.layoutNodeArgumentData[argNameKey][2],
																						jsonIn.layoutNodeArgumentData[argNameKey][3]);
							}
						}
					}
				}
			}
			if(this.splitNodesTextIndices.length > 0 && this.arrayNodeTextIndices.length == this.splitNodesTextIndices[this.splitNodesTextIndices.length-1]) {
				this.startIndexId_nodestext = 0;
			}
			var maxNodeIndexId = 0;
			for(var n=0; n < mesh_nodesText.indexArray.length; n++) {
				var idxIndex = n;

				this.arrayNodeTextIndices.push(this.startIndexId_nodestext+mesh_nodesText.indexArray[idxIndex]);
				//console.log(this.startIndexId+bo.nodeMeshIndexArray[idxIndex]);

				if(mesh_nodesText.indexArray[idxIndex] > maxNodeIndexId) {
					maxNodeIndexId = mesh_nodesText.indexArray[idxIndex];
				}
			}
		}
		if(this.startIndexId_nodestext == 0) {
			if(this.splitNodesText.length == 0) {
				this.splitNodesTextEvery = parseInt(MAX_ITEMS_PER_ARRAY/this.arrayNodeTextIndices.length); // 1=12 planes (6 indices per plane) = 6*12 indices
				this.splitNodesText.push((this.arrayNodeTextData.length/4)*this.splitNodesTextEvery);
				this.splitNodesTextIndices.push(this.arrayNodeTextIndices.length*this.splitNodesTextEvery);
			} else {
				this.splitNodesText.push(this.splitNodesText[0]*(this.splitNodesText.length+1));
				this.splitNodesTextIndices.push(this.splitNodesTextIndices[0]*(this.splitNodesTextIndices.length+1));
			}
		}
		this.startIndexId_nodestext += (maxNodeIndexId+1);

		this.currentNodeTextId++; // augment node id
	}).bind(this);
	/** @private */
	var updateNodesText = (function() {
		comp_renderer_nodesText.setArg("data", (function() {return this.arrayNodeTextData;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setSharedBufferArg("posXYZW", comp_renderer_nodes);

		comp_renderer_nodesText.setArg("nodeVertexPos", (function() {return this.arrayNodeTextVertexPos;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setArg("nodeVertexNormal", (function() {return this.arrayNodeTextVertexNormal;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setArg("nodeVertexTexture", (function() {return this.arrayNodeTextVertexTexture;}).bind(this), this.splitNodesText);

		comp_renderer_nodesText.setArg("fontImgColumns", (function() {return FONT_IMG_COLUMNS;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setArg("letterId", (function() {return this.arrayNodeTextLetterId;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setIndices((function() {return this.arrayNodeTextIndices;}).bind(this), this.splitNodesTextIndices);

		comp_renderer_nodesText.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_nodesText.setArgUpdatable("PMatrix", true);
		comp_renderer_nodesText.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_nodesText.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_nodesText.setArg("nodeWMatrix", (function() {return nodes.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_nodesText.setArgUpdatable("nodeWMatrix", true);

		comp_renderer_nodesText.setArg("isNodeText", (function() {return 1;}).bind(this));

		for(var argNameKey in _customArgs) {
			var expl = _customArgs[argNameKey].arg.split("*");
			if(expl.length > 0) { // argument is type buffer
				comp_renderer_nodesText.setArg(argNameKey, (function() {return _customArgs[argNameKey].nodestext_array_value;}).bind(this), this.splitNodesText);
			}
		}
	}).bind(this);



	/**
	 * applyLayout
	 * @param {Object} jsonIn
	 * @param {String} jsonIn.argsDirection - example "float4* argA, float* argB, mat4 argC, float4 argD, float argE"
	 * @param {String} jsonIn.codeDirection
	 * @param {String} jsonIn.argsPosition - example "float4* argA, float* argB, mat4 argC, float4 argD, float argE"
	 * @param {String} jsonIn.codePosition
	 * @param {String} jsonIn.argsObject - example "float4* argA, float* argB, mat4 argC, float4 argD, float argE"
	 * @param {String} jsonIn.codeObject
	 */
	this.applyLayout = function(jsonIn) {
		var createArgs = (function(obj, arr) {
			for(var n=0, fn = arr.length; n < fn; n++) {
				obj[arr[n].trim().split(" ")[1]] = {"arg": arr[n].trim(),
													"nodes_array_value": [],
													"links_array_value": [],
													"arrows_array_value": [],
													"nodestext_array_value": []};
			}
			return obj;
		}).bind(this);
		_customArgs = {};
		if(jsonIn.argsDirection != undefined) _customArgs = createArgs(_customArgs, jsonIn.argsDirection.split(","));
		if(jsonIn.argsPosition != undefined) _customArgs = createArgs(_customArgs, jsonIn.argsPosition.split(","));
		if(jsonIn.argsObject != undefined) _customArgs = createArgs(_customArgs, jsonIn.argsObject.split(","));

		// nodes
		comp_renderer_nodes.addKernel({	"name": "dir",
										"geometryLength": 4,
										"kernel": new KERNEL_DIR(jsonIn.argsDirection, jsonIn.codeDirection),
										"onPreTick": (function() {

											if(this.currentNodeId > 0 && _enabledForceLayout == true) {
                                                if(_currentAdjMatrix == _numberOfAdjMatrix) {
                                                    comp_renderer_nodes.setArg("performFL", (function() {return 1;}).bind(this));
                                                } else {
                                                    comp_renderer_nodes.setArg("performFL", (function() {return 0;}).bind(this));


													var idSTORE = _currentAdjMatrix/maxItemsInSTORE;
													if(_numberOfAdjMatrix > 1)
														_buffAdjMatrix.items[0].writeWebGLTextureBuffer(arrAdjMatrix_STORE[Math.floor(idSTORE)][_currentAdjMatrix-Math.floor(idSTORE*maxItemsInSTORE)]);
													//comp_renderer_nodes.setArg("adjacencyMatrix", arrAdjMatrix_STORE_WCLGL[Math.floor(idSTORE)][_currentAdjMatrix-Math.floor(idSTORE*maxItemsInSTORE)]);

													comp_renderer_nodes.setArg("currentAdjMatrix", (function() {return _currentAdjMatrix;}).bind(this));
													comp_renderer_nodes.setArg("numberOfColumns", (function() {return _numberOfColumns;}).bind(this));
                                                }



                                                //console.log(_currentAdjMatrix);

												_currentAdjMatrix++;
                                                if(_currentAdjMatrix == _numberOfAdjMatrix+1) {
													if(_adjMatrixTime == 0) {
														_adjMatrixTime = 100;
														_currentAdjMatrix = 0;
													} else {
														_adjMatrixTime--;
														_currentAdjMatrix--;
													}
                                                }
											}
										}).bind(this)});
		comp_renderer_nodes.addKernel({	"name": "posXYZW",
										"geometryLength": 4,
										"kernel": new KERNEL_POSBYDIR(jsonIn.argsPosition, jsonIn.codePosition),
										"onPostTick": (function() {
											comp_renderer_nodes.getWebCLGL().copy(comp_renderer_nodes.getTempBuffers()["dir"], comp_renderer_nodes.getBuffers()["dir"]);
											comp_renderer_nodes.getWebCLGL().copy(comp_renderer_nodes.getTempBuffers()["posXYZW"], comp_renderer_nodes.getBuffers()["posXYZW"]);
										}).bind(this)});
		comp_renderer_nodes.addVFP({"name": "NODES_RGB",
									"vfp": new VFP_NODE(jsonIn.argsObject, jsonIn.codeObject),
									"drawMode": 4,
									"geometryLength": 4,
									"enableDepthTest": false,
									"enableBlend": true,
									"blendSrc": Constants.BLENDING_MODES.SRC_ALPHA,
									"blendDst": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA,
									"onPreTick": (function() {
										 comp_renderer_nodes.setVfpArgDestination("NODES_RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS).getBuffers()["RGB"]);
										 //_gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT); 
									}).bind(this)});
		comp_renderer_nodes.addVFP({"name": "NODES_PICKDRAG",
									"vfp": new VFP_NODEPICKDRAG(),
									"drawMode": 4,
									"geometryLength": 4,
									"enableDepthTest": false,
									"enableBlend": true, 
									"onPreTick": (function() {
										comp_renderer_nodes.setVfpArgDestination("NODES_PICKDRAG", undefined);
									}).bind(this),
									"onPostTick": (function() {
										if(readPixel == true) {
											readPixel = false;

											var arrayPick = new Uint8Array(4);
											var mousePos = _sce.getEvents().getMousePosition();
											_gl.readPixels(mousePos.x, (_sce.getCanvas().height-(mousePos.y)), 1, 1, _gl.RGBA, _gl.UNSIGNED_BYTE, arrayPick);

											var unpackValue = _utils.unpack([arrayPick[0]/255, arrayPick[1]/255, arrayPick[2]/255, arrayPick[3]/255]); // value from 0.0 to 1.0
											selectedId = Math.round(unpackValue*1000000.0)-1.0;
											console.log("selectedId: "+selectedId);
											if(selectedId != -1) {
												var node = _nodesById[selectedId];
												if(node != undefined && node.onmousedown != undefined) node.onmousedown(node);
												
												
												var arr4Uint8_XYZW = comp_renderer_nodes.getWebCLGL().enqueueReadBuffer_Float4(comp_renderer_nodes.getTempBuffers()["posXYZW"]);
												var x = arr4Uint8_XYZW[0][_nodesById[selectedId].itemStart];
												var y = arr4Uint8_XYZW[1][_nodesById[selectedId].itemStart];
												var z = arr4Uint8_XYZW[2][_nodesById[selectedId].itemStart];
												var w = arr4Uint8_XYZW[3][_nodesById[selectedId].itemStart];
												_initialPosDrag = $V3([x,y,z]);
												
												makeDrag(undefined, $V3([0.0, 0.0, 0.0]));
											}
											
											comp_renderer_nodes.disableVfp("NODES_PICKDRAG");
										}
									}).bind(this)});
		comp_renderer_nodes.disableVfp("NODES_PICKDRAG");
		
		// links
		comp_renderer_links.addVFP({"name": "LINKS_RGB",
									"vfp": new VFP_NODE(jsonIn.argsObject, jsonIn.codeObject),
									"drawMode": 1,
									"geometryLength": 4,
									"onPreTick": (function() {	
										comp_renderer_links.setVfpArgDestination("LINKS_RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS).getBuffers()["RGB"]);
									}).bind(this)});

		// arrows
		comp_renderer_arrows.addVFP({	"name": "ARROWS_RGB",
										"vfp": new VFP_NODE(jsonIn.argsObject, jsonIn.codeObject),
										"drawMode": 4,
										"geometryLength": 4,
										"enableBlend": true,
										"blendSrc": Constants.BLENDING_MODES.SRC_ALPHA,
										"blendDst": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA,
										"onPreTick": (function() {	
											comp_renderer_arrows.setVfpArgDestination("ARROWS_RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS).getBuffers()["RGB"]);
										}).bind(this)});

		// nodestext
		/*comp_renderer_nodesText.addVFP({"name": "NODESTEXT_RGB",
										"vfp": new VFP_NODE(jsonIn.argsObject, jsonIn.codeObject),
										"drawMode": 4,
										"geometryLength": 4,
										"enableBlend": true,
										"blendSrc": Constants.BLENDING_MODES.SRC_ALPHA,
										"blendDst": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA,
										"onPreTick": (function() {	
											comp_renderer_nodesText.setVfpArgDestination("NODESTEXT_RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.SCREEN_EFFECTS).getBuffers()["RGB"]);
										}).bind(this)});*/
	};

	/**
	 * setLayoutArgumentData
	 * @param {Object} jsonIn
	 * @param {String} jsonIn.argName
	 * @param {Float|Array<Float4>} jsonIn.value
	 */
	this.setLayoutArgumentData = function(jsonIn) {
		_customArgs[jsonIn.argName]["nodes_array_value"] = jsonIn.value;
		_customArgs[jsonIn.argName]["links_array_value"] = jsonIn.value;
		_customArgs[jsonIn.argName]["arrows_array_value"] = jsonIn.value;
		_customArgs[jsonIn.argName]["nodestext_array_value"] = jsonIn.value;
		comp_renderer_nodes.setArg(jsonIn.argName, (function(value) {return value;}).bind(this, jsonIn.value));
		comp_renderer_links.setArg(jsonIn.argName, (function(value) {return value;}).bind(this, jsonIn.value));
		comp_renderer_arrows.setArg(jsonIn.argName, (function(value) {return value;}).bind(this, jsonIn.value));
		comp_renderer_nodesText.setArg(jsonIn.argName, (function(value) {return value;}).bind(this, jsonIn.value));
	};

	/**
	 * getLayoutNodeArgumentData
	 * @param {Object} jsonIn
	 * @param {String} jsonIn.nodeName
	 * @param {String} jsonIn.argName
	 * @returns {Float|Array<Float4>}
	 */
	this.getLayoutNodeArgumentData = function(jsonIn) {
		var node = _nodesByName[jsonIn.nodeName];
		var expl = _customArgs[jsonIn.argName].arg.split("*");
		var type = expl[0]; // float or float4

		for(var n=0; n < (this.arrayNodeData.length/4); n++) {
			if(jsonIn.nodeName != undefined && this.arrayNodeData[n*4] == node.nodeId) {
				if(type == "float") {
					var id = n;
					if(_customArgs[jsonIn.argName]["nodes_array_value"][id] != undefined)
						return _customArgs[jsonIn.argName]["nodes_array_value"][id];
				} else {
					var id = n*4;
					if(_customArgs[jsonIn.argName]["nodes_array_value"][id] != undefined)
						return [_customArgs[jsonIn.argName]["nodes_array_value"][id],
						        _customArgs[jsonIn.argName]["nodes_array_value"][id+1],
						        _customArgs[jsonIn.argName]["nodes_array_value"][id+2],
						        _customArgs[jsonIn.argName]["nodes_array_value"][id+3]];
				}
			}
		}
	};
	/**
	 * setLayoutNodeArgumentData
	 * @param {Object} jsonIn
	 * @param {String} [jsonIn.nodeName=undefined] - If undefined then value is setted in all nodes
	 * @param {String} jsonIn.argName
	 * @param {Float|Array<Float4>} jsonIn.value
	 */
	this.setLayoutNodeArgumentData = function(jsonIn) {
		var node = _nodesByName[jsonIn.nodeName];
		var expl = _customArgs[jsonIn.argName].arg.split("*");
		var type = expl[0]; // float or float4

		/**
		 * @private
		 * @param {String} type - "float" | "float4"
		 * @param {String} argName -
		 * @param {String} targetArray - "nodes_array_value" | "links_array_value" | "arrows_array_value" | "nodestext_array_value"
		 * @param {Int} n
		 * @param {Float} value
		 */
		var setVal = (function(type, argName, targetArray, n, value) {
			if(type == "float") {
				var id = n;
				_customArgs[argName][targetArray][id] = value;
			} else {
				var id = n*4;
				_customArgs[argName][targetArray][id] = value[0];
				_customArgs[argName][targetArray][id+1] = value[1];
				_customArgs[argName][targetArray][id+2] = value[2];
				_customArgs[argName][targetArray][id+3] = value[3];
			}
		}).bind(this);

		// nodes id
		for(var n=0; n < (this.arrayNodeData.length/4); n++) {
			if(jsonIn.nodeName == undefined || (jsonIn.nodeName != undefined && this.arrayNodeData[n*4] == node.nodeId))
				setVal(type, jsonIn.argName, "nodes_array_value", n, jsonIn.value);
			else {
				var id = (type == "float") ? n : n*4;
				if(_customArgs[jsonIn.argName]["nodes_array_value"][id] == undefined) {
					if(type == "float")
						setVal(type, jsonIn.argName, "nodes_array_value", n, 0.0);
					else 
						setVal(type, jsonIn.argName, "nodes_array_value", n, [0.0,0.0,0.0,0.0]);
				}
			}
		}
		comp_renderer_nodes.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].nodes_array_value;}).bind(this), this.splitNodes);

		// link id
		for(var n=0; n < (this.arrayLinkData.length/4); n++) {
			if(jsonIn.nodeName == undefined || (jsonIn.nodeName != undefined && this.arrayLinkData[n*4] == node.nodeId))
				setVal(type, jsonIn.argName, "links_array_value", n, jsonIn.value);
			else {
				var id = (type == "float") ? n : n*4;
				if(_customArgs[jsonIn.argName]["links_array_value"][id] == undefined) {
					if(type == "float")
						setVal(type, jsonIn.argName, "links_array_value", n, 0.0);
					else 
						setVal(type, jsonIn.argName, "links_array_value", n, [0.0,0.0,0.0,0.0]);
				}
			}
		}
		comp_renderer_links.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].links_array_value;}).bind(this), this.splitLinks);

		// arrow id
		for(var n=0; n < (this.arrayArrowData.length/4); n++) {
			if(jsonIn.nodeName == undefined || (jsonIn.nodeName != undefined && this.arrayArrowData[n*4] == node.nodeId))
				setVal(type, jsonIn.argName, "arrows_array_value", n, jsonIn.value);
			else {
				var id = (type == "float") ? n : n*4;
				if(_customArgs[jsonIn.argName]["arrows_array_value"][id] == undefined) {
					if(type == "float")
						setVal(type, jsonIn.argName, "arrows_array_value", n, 0.0);
					else 
						setVal(type, jsonIn.argName, "arrows_array_value", n, [0.0,0.0,0.0,0.0]);
				}
			}
		}
		comp_renderer_arrows.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].arrows_array_value;}).bind(this), this.splitArrows);

		// nodeText id
		for(var n=0; n < (this.arrayNodeTextData.length/4); n++) {
			var id = n;
			if(jsonIn.nodeName == undefined || (jsonIn.nodeName != undefined && this.arrayNodeTextData[n*4] == node.nodeId))
				setVal(type, jsonIn.argName, "nodestext_array_value", n, jsonIn.value);
			else {
				var id = (type == "float") ? n : n*4;
				if(_customArgs[jsonIn.argName]["nodestext_array_value"][id] == undefined) {
					if(type == "float")
						setVal(type, jsonIn.argName, "nodestext_array_value", n, 0.0);
					else 
						setVal(type, jsonIn.argName, "nodestext_array_value", n, [0.0,0.0,0.0,0.0]);
				}
			}
		}
		comp_renderer_nodesText.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].nodestext_array_value;}).bind(this), this.splitNodesText);
	};

	/**
	 * setLayoutNodeArgumentArrayData
	 * @param {Object} jsonIn
	 * @param {String} jsonIn.argName
	 * @param {Array<Float>|Array<Float4>} jsonIn.value
	 */
	this.setLayoutNodeArgumentArrayData = function(jsonIn) {
		var expl = _customArgs[jsonIn.argName].arg.split("*");
		var type = expl[0]; // float or float4

		// nodes
		var currentId = -1;
		var x = 0, y = 0, z = 0, w = 0;
		_customArgs[jsonIn.argName].nodes_array_value = [];
		for(var n=0; n < (this.arrayNodeData.length/4); n++) {
			if(currentId != this.arrayNodeData[n*4]) {
				currentId = this.arrayNodeData[n*4];

				if(type == "float") {
					x = parseFloat(jsonIn.value[currentId]);
					_customArgs[jsonIn.argName].nodes_array_value.push(x);
				} else {
					x = parseFloat(jsonIn.value[(currentId*4)]);
					y = parseFloat(jsonIn.value[(currentId*4)+1]);
					z = parseFloat(jsonIn.value[(currentId*4)+2]);
					w = parseFloat(jsonIn.value[(currentId*4)+3]);
					_customArgs[jsonIn.argName].nodes_array_value.push(x, y, z, w);
				}
			} else {
				if(type == "float")
					_customArgs[jsonIn.argName].nodes_array_value.push(x);
				else
					_customArgs[jsonIn.argName].nodes_array_value.push(x, y, z, w);
			}
		}
		comp_renderer_nodes.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].nodes_array_value;}).bind(this), this.splitNodes);


		// links
		_customArgs[jsonIn.argName].links_array_value = [];
		for(var n=0; n < this.arrayLinkNodeName.length; n++) {
			var currentLinkNodeName = this.arrayLinkNodeName[n];
			var nodeNameItemStart = _nodesByName[currentLinkNodeName].itemStart;

			if(type == "float") {
				_customArgs[jsonIn.argName].links_array_value.push(	_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart)]);
			} else {
				_customArgs[jsonIn.argName].links_array_value.push(	_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)],
																	_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)+1],
																	_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)+2],
																	_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)+3]);
			}
		}
		comp_renderer_links.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].links_array_value;}).bind(this), this.splitLinks);

		// arrows
		/*_customArgs[jsonIn.argName].arrows_array_value = [];
		for(var n=0; n < this.arrayArrowNodeName.length; n++) {
			var currentArrowNodeName = this.arrayArrowNodeName[n];
			var nodeNameItemStart = _nodesByName[currentArrowNodeName].itemStart;

			if(type == "float") {
				_customArgs[jsonIn.argName].arrows_array_value.push(_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart)]);
			} else {
				_customArgs[jsonIn.argName].arrows_array_value.push(_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)],
																	_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)+1],
																	_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)+2],
																	_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)+3]);
			}
		}
		comp_renderer_arrows.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].arrows_array_value;}).bind(this), this.splitArrows);

		// nodestext
		_customArgs[jsonIn.argName].nodestext_array_value = [];
		for(var n=0; n < this.arrayNodeTextNodeName.length; n++) {
			var currentNodeTextNodeName = this.arrayNodeTextNodeName[n];
			var nodeNameItemStart = _nodesByName[currentNodeTextNodeName].itemStart;

			if(type == "float") {
				_customArgs[jsonIn.argName].nodestext_array_value.push(	_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart)]);
			} else {
				_customArgs[jsonIn.argName].nodestext_array_value.push( _customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)],
																		_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)+1],
																		_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)+2],
																		_customArgs[jsonIn.argName].nodes_array_value[(nodeNameItemStart*4)+3]);
			}
		}
		comp_renderer_nodesText.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].nodestext_array_value;}).bind(this), this.splitNodesText);*/
	};

	/**
	 * setOffset
	 * @param {Float} offset
	 */
	this.setOffset = function(offset) {
		OFFSET = offset;
	};


};
