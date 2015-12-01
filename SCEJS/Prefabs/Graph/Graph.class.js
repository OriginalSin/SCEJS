/**
* @class
*/
Graph = function(sce) {	
	"use strict";
	
	var _sce = sce;
	var _project = _sce.getLoadedProject();
	var _gl = _project.getActiveStage().getWebGLContext();
	var _utils = new Utils();
		
	this.arrPP = [];
	this.arrF = [];
	this.selfShadows = true;
	this.offset = 1000.0;
	
	var readPixel = false;
	
	var selectedId = -1;
	
	
	var meshBox = new Mesh().loadQuad();
	var meshArrow = new Mesh().loadTriangle();
	var meshQuad = new Mesh().loadQuad();	
	
	//**************************************************
	//  NODES
	//**************************************************
	var nodes = new Node();
	_project.getActiveStage().addNode(nodes);
	
	// ComponentTransform
	var comp_transform = new ComponentTransform();
	nodes.addComponent(comp_transform);
		
	// ComponentRenderer
	var comp_renderer_nodes = new ComponentRenderer();
	nodes.addComponent(comp_renderer_nodes);
	comp_renderer_nodes.addKernel(new KERNEL_DIR(this.arrPP, this.arrF), "dir");
	comp_renderer_nodes.addKernel(new KERNEL_POSBYDIR(), "posXYZW");	
	comp_renderer_nodes.addVFP({"name": "NODES_RGB",
								"vfp": new VFP_NODE(),
								"seArgDestination": "RGB",
								"drawMode": 4,
								"blendSrc": Constants.BLENDING_MODES.SRC_ALPHA,
								"blendDst": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA}); 
	comp_renderer_nodes.addVFP({"name": "NODES_PICKDRAG",
								"vfp": new VFP_NODEPICKDRAG(),
								"seArgDestination": undefined,
								"drawMode": 4,
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
											var n = this._nodesById[selectedId];
											if(n != undefined && n.onmousedown != undefined) n.onmousedown(n.data);
										}
										
										comp_renderer_nodes.disableVfp("NODES_PICKDRAG");
									}
								}).bind(this)});	 
	
	// ComponentMouseEvents 
	var comp_mouseEvents = new ComponentMouseEvents();
	nodes.addComponent(comp_mouseEvents);
	comp_mouseEvents.onmousedown = (function(evt) {
		readPixel = true;
		
		comp_renderer_nodes.enableVfp("NODES_PICKDRAG");
	}).bind(this);
	comp_mouseEvents.onmouseup = (function(evt) {
		if(selectedId != -1) {
			var n = this._nodesById[selectedId];
			if(n != undefined && n.onmouseup != undefined) n.onmouseup(n.data);
		}
		
		selectedId = -1;
		
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
	}).bind(this);
	comp_mouseEvents.onmousemove = (function(evt, dir) {
		if(selectedId != -1) {
			comp_renderer_nodes.setArg("enableDrag", (function() {return 1;}).bind(this));
			comp_renderer_nodes.setArg("idToDrag", (function() {return selectedId;}).bind(this));
			comp_renderer_nodes.setArg("MouseDragTranslationX", (function() {return dir.e[0];}).bind(this));
			comp_renderer_nodes.setArg("MouseDragTranslationY", (function() {return dir.e[1];}).bind(this));
			comp_renderer_nodes.setArg("MouseDragTranslationZ", (function() {return dir.e[2];}).bind(this));
			
			comp_renderer_links.setArg("enableDrag", (function() {return 1;}).bind(this));
			comp_renderer_links.setArg("idToDrag", (function() {return selectedId;}).bind(this));
			comp_renderer_links.setArg("MouseDragTranslationX", (function() {return dir.e[0];}).bind(this));
			comp_renderer_links.setArg("MouseDragTranslationY", (function() {return dir.e[1];}).bind(this));
			comp_renderer_links.setArg("MouseDragTranslationZ", (function() {return dir.e[2];}).bind(this));
			
			comp_renderer_arrows.setArg("enableDrag", (function() {return 1;}).bind(this));
			comp_renderer_arrows.setArg("idToDrag", (function() {return selectedId;}).bind(this));
			comp_renderer_arrows.setArg("MouseDragTranslationX", (function() {return dir.e[0];}).bind(this));
			comp_renderer_arrows.setArg("MouseDragTranslationY", (function() {return dir.e[1];}).bind(this));
			comp_renderer_arrows.setArg("MouseDragTranslationZ", (function() {return dir.e[2];}).bind(this));
			
			comp_renderer_nodesText.setArg("enableDrag", (function() {return 1;}).bind(this));
			comp_renderer_nodesText.setArg("idToDrag", (function() {return selectedId;}).bind(this));
			comp_renderer_nodesText.setArg("MouseDragTranslationX", (function() {return dir.e[0];}).bind(this));
			comp_renderer_nodesText.setArg("MouseDragTranslationY", (function() {return dir.e[1];}).bind(this));
			comp_renderer_nodesText.setArg("MouseDragTranslationZ", (function() {return dir.e[2];}).bind(this));
			
			setTimeout(function() {
				comp_renderer_nodes.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
				comp_renderer_nodes.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
				comp_renderer_nodes.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));
				
				comp_renderer_links.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
				comp_renderer_links.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
				comp_renderer_links.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));
				
				comp_renderer_arrows.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
				comp_renderer_arrows.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
				comp_renderer_arrows.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));
				
				comp_renderer_nodesText.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
				comp_renderer_nodesText.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
				comp_renderer_nodesText.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));
			}, 10);
		}
	}).bind(this);
	comp_mouseEvents.onmousewheel = (function(evt) {
	}).bind(this);	
	
	//**************************************************
	//  LINKS
	//**************************************************
	var links = new Node();
	_project.getActiveStage().addNode(links);
	
	// ComponentTransform
	var comp_transform = new ComponentTransform();
	links.addComponent(comp_transform);
	
	// ComponentRenderer
	var comp_renderer_links = new ComponentRenderer();
	links.addComponent(comp_renderer_links);
	comp_renderer_links.addKernel(new KERNEL_DIR(this.arrPP, this.arrF), "dir");
	comp_renderer_links.addKernel(new KERNEL_POSBYDIR(), "posXYZW");	
	comp_renderer_links.addVFP({"name": "LINKS_RGB",
								"vfp": new VFP_NODE(),
								"seArgDestination": "RGB",
								"drawMode": 1});	 
	
	
	
	//**************************************************
	//  ARROWS
	//**************************************************
	var arrows = new Node();
	_project.getActiveStage().addNode(arrows);
	
	// ComponentTransform
	var comp_transform = new ComponentTransform();
	arrows.addComponent(comp_transform);
	
	// ComponentRenderer
	var comp_renderer_arrows = new ComponentRenderer();
	arrows.addComponent(comp_renderer_arrows);
	comp_renderer_arrows.addKernel(new KERNEL_DIR(this.arrPP, this.arrF), "dir");
	comp_renderer_arrows.addKernel(new KERNEL_POSBYDIR(), "posXYZW");
	comp_renderer_arrows.addKernel(new KERNEL_POS_OPPOSITE(), "posXYZW_opposite");	
	comp_renderer_arrows.addVFP({	"name": "ARROWS_RGB",
									"vfp": new VFP_NODE(),
									"seArgDestination": "RGB",
									"drawMode": 4,
									"blendSrc": Constants.BLENDING_MODES.SRC_ALPHA,
									"blendDst": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA});	 
	
	
	
	
	//**************************************************
	//  NODESTEXT
	//**************************************************
	var nodesText = new Node();
	_project.getActiveStage().addNode(nodesText);
	
	// ComponentTransform
	var comp_transform = new ComponentTransform();
	nodesText.addComponent(comp_transform);
	
	// ComponentRenderer
	var comp_renderer_nodesText = new ComponentRenderer();
	nodesText.addComponent(comp_renderer_nodesText);
	comp_renderer_nodesText.addKernel(new KERNEL_DIR(this.arrPP, this.arrF), "dir");
	comp_renderer_nodesText.addKernel(new KERNEL_POSBYDIR(), "posXYZW");	
	comp_renderer_nodesText.addVFP({"name": "NODESTEXT_RGB",
									"vfp": new VFP_NODE(),
									"seArgDestination": "RGB",
									"drawMode": 4,
									"blendSrc": Constants.BLENDING_MODES.SRC_ALPHA,
									"blendDst": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA});	
	
	
	
	
	
	
	
	this.splitNodes = [];
	this.splitNodesIndices = [];
	this.splitNodesEvery = parseInt((256*256)/6); // 36 box indices 
	
	this.arrayNodeId = [];
	this.arrayNodePosXYZW = [];
	this.arrayNodeVertexPos = [];
	this.arrayNodeVertexNormal = [];
	this.arrayNodeVertexTexture = [];
	this.arrayNodeVertexColor = [];
	this.startIndexId = 0;
	this.arrayNodeIndices = [];
	
	this.arrayNodeImgId = [];
	
	this.arrayNodeDir = [];
	this.arrayNodePolaritys = [];
	this.arrayNodeDestination = [];
	
	this.currentNodeId = 0;	
	this.nodeArrayItemStart = 0;
	
	
	
	
	
	this.splitLinks = [];
	this.splitLinksIndices = [];
	this.splitLinksEvery = parseInt((256*256)/2); // 2 line indices
	
	this.arrayLinkId = [];
	this.arrayLinkNodeName = [];
	this.arrayLinkNodeId = [];
	this.arrayLinkPosXYZW = [];
	this.arrayLinkVertexPos = [];
	this.arrayLinkVertexColor = [];
	this.startIndexId_link = 0;
	this.arrayLinkIndices = [];
	
	this.arrayLinkDir = [];
	this.arrayLinkPolaritys = [];
	this.arrayLinkDestination = [];
	
	this.currentLinkId = 0;
	
	
	
	
	
	this.splitArrows = [];
	this.splitArrowsIndices = [];
	this.splitArrowsEvery = parseInt((256*256)/6); // 6 arrow indices
	
	this.arrayArrowId = [];
	this.arrayArrowNodeName = [];
	this.arrayArrowNodeId = [];
	this.arrayArrowPosXYZW = [];
	this.arrayArrowPosXYZW_opposite = [];
	this.arrayArrow_oppositeId = [];	
	this.arrayArrowVertexPos = [];
	this.arrayArrowVertexNormal = [];
	this.arrayArrowVertexTexture = [];
	this.arrayArrowVertexColor = [];
	this.startIndexId_arrow = 0;
	this.arrayArrowIndices = [];
	
	this.arrayArrowDir = [];
	this.arrayArrowPolaritys = [];
	this.arrayArrowDestination = [];
	
	this.currentArrowId = 0;	
	this.arrowArrayItemStart = 0;
	
	
	
	
	
	
	
	this.splitNodesText = [];
	this.splitNodesTextIndices = [];
	this.splitNodesTextEvery = parseInt((256*256)/(6*12)); // 36 box indices 
	
	this.arrayNodeTextId = [];
	this.arrayNodeTextNodeName = [];
	this.arrayNodeTextNodeId = [];
	this.arrayNodeTextPosXYZW = [];
	this.arrayNodeTextVertexPos = [];
	this.arrayNodeTextVertexNormal = [];
	this.arrayNodeTextVertexTexture = [];
	this.arrayNodeTextVertexColor = [];	
	this.startIndexId_nodestext = 0;
	this.arrayNodeTextIndices = [];
	
	this.arrayNodeText_itemStart = [];
	this.arrayNodeTextLetterId = [];
	
	this.arrayNodeTextDir = [];
	this.arrayNodeTextPolaritys = [];
	this.arrayNodeTextDestination = [];
	
	this.currentNodeTextId = 0;	
	this.nodeTextArrayItemStart = 0;
	
	
	
	
	
	
	
	
	
	this._nodesByName = {};
	this._nodesById = {};
	this._links = {};
	
	this.enDestination = 0;
	this.polarity = 1; // positive
	this.lifeDistance = 0.0;
	this.pointSize = 1.0;
	this.destinationForce = 0.5;
	
	
	
	var objNodeImages = {};
	var can2 = document.createElement('canvas');
	can2.width = 2048;
	can2.height = 2048;
	var ctx = can2.getContext('2d');
	
	/**
	 * setNodesImage
	 * @param {String} url
	 */
	this.setNodesImage = function(url) {
		var image = new Image();
		image.onload = (function() {
			console.log(image);
			ctx.drawImage(image, 0, 0, 64, 64); 
			var img = new Utils().getImageFromCanvas(can2);
			comp_renderer_nodes.setArg("nodesImg", (function(){return img;}).bind(this));
		}).bind(this);
		image.src = url;
	};
	
	/**
	 * This callback is displayed as part of the onSelectNode
	 * @callback Graph~addNode~onmousedown
	 */
	/**
	 * This callback is displayed as part of the onSelectNode
	 * @callback Graph~addNode~onmouseup
	 * @param {String} nodeData
	 */
	/**
	* Create new node for the graph
	* @param	{Object} jsonIn
	* @param {String} jsonIn.name Name of node
	* @param {Object} [jsonIn.data=""]
	* @param {StormV3} [jsonIn.position=$V3([Math.Random(), Math.Random(), Math.Random()])] - Position of node
	* @param {StormNode} [jsonIn.node] - Node with the mesh for the node
	* @param {StormV3|String} [jsonIn.color=$V3([1.0, 1.0, 1.0])] - Color of the node (values from 0.0 to 1.0)
	* @param {Graph~addNode~onmousedown} [jsonIn.onmousedown=undefined]
	* @param {Graph~addNode~onmouseup} [jsonIn.onmouseup=undefined]
	* @returns {String}
	 */
	this.addNode = function(jsonIn) {
		if(this._nodesByName.hasOwnProperty(jsonIn.name) == false) {
			var node = this.addNodeNow({"position": jsonIn.position,
										"node": jsonIn.node,
										"color": jsonIn.color});
				
			// add event onmousedown & onmouseup if exists
			node.data = (jsonIn != undefined && jsonIn.data != undefined) ? jsonIn.data : undefined;
			node.onmousedown = (jsonIn != undefined && jsonIn.onmousedown != undefined) ? jsonIn.onmousedown : undefined;
			node.onmouseup = (jsonIn != undefined && jsonIn.onmouseup != undefined) ? jsonIn.onmouseup : undefined;
			
			
			/* this._nodesByName[__STRING_USER_NODENAME__] = {	"nodeId": __INT_this.currentNodeId__,
																"itemStart": __INT_this.nodeArrayItemStart__,
																"data": {},
																"onmousedown": Function,
																"onmouseup": Function }*/
			this._nodesByName[jsonIn.name] = node;
			
			/* this._nodesById[__INT_this.currentNodeId__] = {	"nodeName": __STRING_USER_NODENAME__,
			  													"itemStart": __INT_this.nodeArrayItemStart__,
			  													"data": {},
			  													"onmousedown": Function,
			  													"onmouseup": Function }*/
			this._nodesById[node.nodeId] = {"nodeName": jsonIn.name,
											"itemStart": node.itemStart,
											"data": node.data,
											"onmousedown": node.onmousedown,
											"onmouseup": node.onmouseup};
			
			this.addNodeTextNow({	"name": jsonIn.name,
									"text": jsonIn.name,
									"itemStart": node.itemStart,
									"nodeId": node.nodeId});
			
			return jsonIn.name;
		} else console.log("node "+jsonIn.name+" already exists");
	};
	/**
	* @param {Object} jsonIn
	* @param {StormV3} [jsonIn.position=$V3([Math.Random(), Math.Random(), Math.Random()])] - Position of node
	* @param {Mesh} [jsonIn.node] Node with the mesh for the node
	* @param {StormV3|String} [jsonIn.color=$V3([1.0, 1.0, 1.0])] - Color of the node (values from 0.0 to 1.0)
	* @returns {Object}
	* @private
	*/
	this.addNodeNow = function(jsonIn) { 
		var nAIS = this.nodeArrayItemStart;
		
		// assign position for this node
		var nodePosX = (jsonIn != undefined && jsonIn.position != undefined) ? jsonIn.position.e[0] : Math.random()*this.offset;
		var nodePosY = (jsonIn != undefined && jsonIn.position != undefined) ? jsonIn.position.e[1] : Math.random()*this.offset;
		var nodePosZ = (jsonIn != undefined && jsonIn.position != undefined) ? jsonIn.position.e[2] : Math.random()*this.offset;
		// assign mesh for this node
		if(jsonIn != undefined && jsonIn.node != undefined) meshBox = jsonIn.node;
		// assign color for this node
		var color = (jsonIn != undefined && jsonIn.color != undefined) ? jsonIn.color : $V3([1.0, 1.0, 1.0]);
			
		
		//*******************************************************************************************************************
		// FILL ARRAYS
		//*******************************************************************************************************************
		var nodeImgId = -1;
		if(color.constructor===String) { // color is string URL
			if(objNodeImages.hasOwnProperty(color) == false) {
				objNodeImages[color] = objNodeImages.length-1;
				
				this.setNodesImage(color);
			}
			nodeImgId = objNodeImages[color];
		}
		for(var n=0; n < meshBox.vertexArray.length/4; n++) {
			var idxVertex = n*4;
			
			this.arrayNodeId.push(this.currentNodeId);
			this.arrayNodePosXYZW.push(nodePosX, nodePosY, nodePosZ, 1.0);
			this.arrayNodeVertexPos.push(meshBox.vertexArray[idxVertex], meshBox.vertexArray[idxVertex+1], meshBox.vertexArray[idxVertex+2], 1.0);
			this.arrayNodeVertexNormal.push(meshBox.normalArray[idxVertex], meshBox.normalArray[idxVertex+1], meshBox.normalArray[idxVertex+2], 1.0);
			this.arrayNodeVertexTexture.push(meshBox.textureArray[idxVertex], meshBox.textureArray[idxVertex+1], meshBox.textureArray[idxVertex+2], 1.0);
			//console.log(bo.nodeMeshVertexArray[idxVertex]);
			if(color instanceof StormV3)
				this.arrayNodeVertexColor.push(color.e[0], color.e[1], color.e[2], 1.0);
			else 
				this.arrayNodeVertexColor.push(1.0, 0.0, 0.0, 1.0);
			
			this.arrayNodeImgId.push(nodeImgId);
			
			this.nodeArrayItemStart++;
		}
			
		var maxNodeIndexId = 0;
		for(var n=0; n < meshBox.indexArray.length; n++) {
			var idxIndex = n;
			
			this.arrayNodeIndices.push(this.startIndexId+meshBox.indexArray[idxIndex]);
			//console.log(this.startIndexId+bo.nodeMeshIndexArray[idxIndex]);
			
			if(meshBox.indexArray[idxIndex] > maxNodeIndexId) {
				maxNodeIndexId = meshBox.indexArray[idxIndex];			
			}
		}
		if(this.arrayNodeIndices.length == this.splitNodesIndices[this.splitNodesIndices.length-1]) { 
			this.startIndexId = 0;
		}
		if(this.startIndexId == 0) {
			if(this.splitNodes == undefined) {
				this.splitNodes.push(this.arrayNodeId.length*this.splitNodesEvery);
				this.splitNodesIndices.push(this.arrayNodeIndices.length*this.splitNodesEvery);
			} else {
				this.splitNodes.push(this.splitNodes[0]*(this.splitNodes.length+1));
				this.splitNodesIndices.push(this.splitNodesIndices[0]*(this.splitNodesIndices.length+1)); 
			}		
		}
		this.startIndexId += (maxNodeIndexId+1);
		
		
		this.currentNodeId++; // augment node id
		
		//return this.currentNodeId-1;
		return {"nodeId": this.currentNodeId-1, "itemStart": nAIS}; // nodeArrayItemStart
	};
	/** @private */
	this.updateNodes = function() {
		//this.updateForcesAndPP(comp_renderer_nodes);
		
		comp_renderer_nodes.setArg("idx", (function() {return this.arrayNodeId;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("nodeId", (function() {return this.arrayNodeId;}).bind(this), this.splitNodes);
		
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
		comp_renderer_nodes.setArg("posXYZW", (function() {return this.arrayNodePosXYZW;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("initPos", (function() {return this.arrayNodePosXYZW;}).bind(this), this.splitNodes);
				
		comp_renderer_nodes.setArg("nodeVertexPos", (function() {return this.arrayNodeVertexPos;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("nodeVertexNormal", (function() {return this.arrayNodeVertexNormal;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("nodeVertexTexture", (function() {return this.arrayNodeVertexTexture;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("nodeVertexCol", (function() {return this.arrayNodeVertexColor;}).bind(this), this.splitNodes);
		
		comp_renderer_nodes.setArg("nodeImagesWidth", (function() {return 32.0;}).bind(this), this.splitNodes); 
		comp_renderer_nodes.setArg("nodeImgId", (function() {return this.arrayNodeImgId;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setIndices((function() {return this.arrayNodeIndices;}).bind(this), this.splitNodesIndices);
		
		this.arrayNodeDir = [];	
		for(var n=0; n < this.arrayNodeId.length; n++) {
			this.arrayNodeDir.push(0, 0, 0, 255);
		}
		comp_renderer_nodes.setArg("dir", (function() {return this.arrayNodeDir;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("initDir", (function() {return this.arrayNodeDir;}).bind(this), this.splitNodes);
		
		this.arrayNodePolaritys = [];	
		for(var n=0; n < this.arrayNodeId.length; n++) {
			this.arrayNodePolaritys.push(1);
		}
		comp_renderer_nodes.setArg("particlePolarity", (function() {return this.arrayNodePolaritys;}).bind(this), this.splitNodes);
		
		this.arrayNodeDestination = [];	
		for(var n=0; n < this.arrayNodeId.length; n++) {
			this.arrayNodeDestination.push(0, 0, 0, 255);
		}
		comp_renderer_nodes.setArg("dest", (function() {return this.arrayNodeDestination;}).bind(this), this.splitNodes);
		
		comp_renderer_nodes.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_nodes.setArgUpdatable("PMatrix", true);
		comp_renderer_nodes.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_nodes.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_nodes.setArg("nodeWMatrix", (function() {return node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_nodes.setArgUpdatable("nodeWMatrix", true);
		comp_renderer_nodes.setArg("nodesSize", (function() {return parseFloat(this.currentNodeId-1);}).bind(this));
		comp_renderer_nodes.setArg("sunPos", (function() {return [0.2, -0.5, 0.4, 1.0];}).bind(this));
		comp_renderer_nodes.setArg("selfShadows", (function() {return ((this.selfShadows == true)?1.0:0.0);}).bind(this));
		comp_renderer_nodes.setArg("ambientColor", (function() {return [0.2, 0.2, 0.2, 1.0];}).bind(this));
		
		comp_renderer_nodes.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
		comp_renderer_nodes.setArg("destinationForce", (function() {return this.destinationForce;}).bind(this));
		comp_renderer_nodes.setArg("lifeDistance", (function() {return this.lifeDistance;}).bind(this));
		comp_renderer_nodes.setArg("pointSize", (function() {return this.pointSize;}).bind(this));
		comp_renderer_nodes.setArg("enableDrag", (function() {return 0;}).bind(this));
		comp_renderer_nodes.setArg("idToDrag", (function() {return 0;}).bind(this));
		comp_renderer_nodes.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
		comp_renderer_nodes.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
		comp_renderer_nodes.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));
		comp_renderer_nodes.setArg("isNode", (function() {return 1;}).bind(this));
		
		
		this.updateNodesText();
	}; 
	
	
	
	
	
	
	
	
	
	
	
	/**
	* Create new node for the graph
	* @param {Object} jsonIn
	* @param {String} jsonIn.origin - NodeName Origin for this link
	* @param {String} jsonIn.target - NodeName Target for this link
	* @param {Array<Float>} [jsonIn.origin_color=[1.0, 0.0, 0.0]] - Vector3F for the origin color
	* @param {Array<Float>} [jsonIn.target_color=[0.0, 1.0, 0.0]] - Vector3F for the target color
	* @param {Bool} [jsonIn.directed=false] - 
	 */
	this.addLink = function(jsonIn) {
		if(this._links.hasOwnProperty(jsonIn.origin+"->"+jsonIn.target) == false) {
			var orig_color = (jsonIn != undefined && jsonIn.origin_color != undefined) ? jsonIn.origin_color : [1.0, 0.0, 0.0];
			var targ_color = (jsonIn != undefined && jsonIn.target_color != undefined) ? jsonIn.target_color : [0.0, 1.0, 0.0];
			var directed = (jsonIn != undefined && jsonIn.directed != undefined) ? jsonIn.directed : false;
			
			var json = {
					"origin_nodeName": jsonIn.origin,
					"target_nodeName": jsonIn.target,
					"origin_nodeId": this._nodesByName[jsonIn.origin].nodeId,
					"target_nodeId": this._nodesByName[jsonIn.target].nodeId,
					"origin_itemStart": this._nodesByName[jsonIn.origin].itemStart,
					"target_itemStart": this._nodesByName[jsonIn.target].itemStart,
					"origin_color": orig_color,
					"target_color": targ_color,
					"directed": directed
					};
			
			var blId = this.addLinkNow(json);
			if(directed == true) this.addArrowNow(json);
			
			// ADD LINK TO ARRAY LINKS
			this._links[jsonIn.origin+"->"+jsonIn.target] = json;
					
		} else console.log("link "+jsonIn.origin+"->"+jsonIn.target+" already exists");
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
	* @param {Array<Float>} [jsonIn.origin_color=[1.0, 0.0, 0.0]] - Vector3F for the origin color
	* @param {Array<Float>} [jsonIn.target_color=[0.0, 1.0, 0.0]] - Vector3F for the target color
	* @param {Bool} [jsonIn.directed=false]
	* @returns {Int}
	* @private
	 */
	this.addLinkNow = function(jsonIn) {
		// (origin)
		this.arrayLinkId.push(this.currentLinkId);
		this.arrayLinkNodeName.push(jsonIn.origin_nodeName);
		this.arrayLinkNodeId.push(jsonIn.origin_nodeId);
		this.arrayLinkPosXYZW.push(	0.0, 0.0, 0.0, 1.0);
		this.arrayLinkVertexPos.push(0.0, 0.0, 0.0, 1.0);
		this.arrayLinkVertexColor.push(jsonIn.origin_color[0], jsonIn.origin_color[1], jsonIn.origin_color[2], 1.0);
		
		// (target)
		this.arrayLinkId.push(this.currentLinkId+1);
		this.arrayLinkNodeName.push(jsonIn.target_nodeName);
		this.arrayLinkNodeId.push(jsonIn.target_nodeId);
		this.arrayLinkPosXYZW.push(	0.0, 0.0, 0.0, 1.0);	
		this.arrayLinkVertexPos.push(0.0, 0.0, 0.0, 1.0);
		this.arrayLinkVertexColor.push(jsonIn.target_color[0], jsonIn.target_color[1], jsonIn.target_color[2], 1.0);
		
		this.arrayLinkIndices.push(this.startIndexId_link, this.startIndexId_link+1);
		if(this.arrayLinkIndices.length == this.splitLinksIndices[this.splitLinksIndices.length-1]) { 
			this.startIndexId_link = 0;
		}
		if(this.startIndexId_link == 0) {
			if(this.splitLinks == undefined) {
				this.splitLinks.push(this.arrayLinkId.length*this.splitLinksEvery);
				this.splitLinksIndices.push(this.arrayLinkIndices.length*this.splitLinksEvery);
			} else {
				this.splitLinks.push(this.splitLinks[0]*(this.splitLinks.length+1));
				this.splitLinksIndices.push(this.splitLinksIndices[0]*(this.splitLinksIndices.length+1)); 
			}	
		}
		this.startIndexId_link += 2;
		
		
		this.currentLinkId += 2; // augment link id
		
		return this.currentLinkId-2;
	};
	/** @private */
	this.updateLinks = function() {
		//this.updateForcesAndPP(comp_renderer_links);
		
		comp_renderer_links.setArg("idx", (function() {return this.arrayLinkId;}).bind(this), this.splitLinks); 
		comp_renderer_links.setArg("nodeId", (function() {return this.arrayLinkNodeId;}).bind(this), this.splitLinks);
		
		if(comp_renderer_nodes.getTempBuffers()["posXYZW"] != undefined) {
			var arr4Uint8_XYZW = comp_renderer_nodes.getWebCLGL().enqueueReadBuffer_Float4(comp_renderer_nodes.getTempBuffers()["posXYZW"]);
			//var arr4Uint8_XYZW = this.clglLayout_nodes.CLGL_bufferPosXYZW.Float4;
			var n = 0;
			for(var key in this._links) {
			     var idx = n*8;
				this.arrayLinkPosXYZW[idx+0] = arr4Uint8_XYZW[0][this._links[key].origin_itemStart];
				this.arrayLinkPosXYZW[idx+1] = arr4Uint8_XYZW[1][this._links[key].origin_itemStart];
				this.arrayLinkPosXYZW[idx+2] = arr4Uint8_XYZW[2][this._links[key].origin_itemStart];
				this.arrayLinkPosXYZW[idx+3] = arr4Uint8_XYZW[3][this._links[key].origin_itemStart];
				
				this.arrayLinkPosXYZW[idx+4] = arr4Uint8_XYZW[0][this._links[key].target_itemStart];
				this.arrayLinkPosXYZW[idx+5] = arr4Uint8_XYZW[1][this._links[key].target_itemStart];
				this.arrayLinkPosXYZW[idx+6] = arr4Uint8_XYZW[2][this._links[key].target_itemStart];
				this.arrayLinkPosXYZW[idx+7] = arr4Uint8_XYZW[3][this._links[key].target_itemStart];
				
				n++;
			}
		}
		
		comp_renderer_links.setArg("posXYZW", (function() {return this.arrayLinkPosXYZW;}).bind(this), this.splitLinks);	
		comp_renderer_links.setArg("initPos", (function() {return this.arrayLinkPosXYZW;}).bind(this), this.splitLinks);
		comp_renderer_links.setArg("nodeVertexPos", (function() {return this.arrayLinkVertexPos;}).bind(this), this.splitLinks);
		comp_renderer_links.setArg("nodeVertexCol", (function() {return this.arrayLinkVertexColor;}).bind(this), this.splitLinks);
		
		comp_renderer_links.setIndices((function() {return this.arrayLinkIndices;}).bind(this), this.splitLinksIndices);
		
		this.arrayLinkDir = [];	
		for(var n=0; n < this.arrayLinkId.length; n++) {
			this.arrayLinkDir.push(0, 0, 0, 255);
		}
		comp_renderer_links.setArg("dir", (function() {return this.arrayLinkDir;}).bind(this), this.splitLinks);
		comp_renderer_links.setArg("initDir", (function() {return this.arrayLinkDir;}).bind(this), this.splitLinks);
		
		this.arrayLinkPolaritys = [];	
		for(var n=0; n < this.arrayLinkId.length; n++) {
			this.arrayLinkPolaritys.push(1);
		}
		comp_renderer_links.setArg("particlePolarity", (function() {return this.arrayLinkPolaritys;}).bind(this), this.splitLinks);
		
		this.arrayLinkDestination = [];	
		for(var n=0; n < this.arrayLinkId.length; n++) {
			this.arrayLinkDestination.push(0, 0, 0, 255);
		}
		comp_renderer_links.setArg("dest", (function() {return this.arrayLinkDestination;}).bind(this), this.splitLinks);
		
		comp_renderer_links.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_links.setArgUpdatable("PMatrix", true);
		comp_renderer_links.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_links.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_links.setArg("nodeWMatrix", (function() {return node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_links.setArgUpdatable("nodeWMatrix", true);
		comp_renderer_links.setArg("nodesSize", (function() {return this.currentLinkId-2;}).bind(this));
		comp_renderer_links.setArg("sunPos", (function() {return [0.2, -0.5, 0.4, 1.0];}).bind(this));
		comp_renderer_links.setArg("selfShadows", (function() {return 0.0;}).bind(this));
		comp_renderer_links.setArg("ambientColor", (function() {return [0.2, 0.2, 0.2, 1.0];}).bind(this));
		
		comp_renderer_links.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
		comp_renderer_links.setArg("destinationForce", (function() {return this.destinationForce;}).bind(this));
		comp_renderer_links.setArg("lifeDistance", (function() {return this.lifeDistance;}).bind(this));
		comp_renderer_links.setArg("pointSize", (function() {return this.pointSize;}).bind(this));
		comp_renderer_links.setArg("enableDrag", (function() {return 0;}).bind(this));
		comp_renderer_links.setArg("idToDrag", (function() {return 0;}).bind(this));
		comp_renderer_links.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
		comp_renderer_links.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
		comp_renderer_links.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));
		comp_renderer_links.setArg("isLink", (function() {return 1;}).bind(this));
		
		
		this.updateArrows();
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
	* @param {Array<Float>} [jsonIn.origin_color=[1.0, 0.0, 0.0]] - Vector3F for the origin color
	* @param {Array<Float>} [jsonIn.target_color=[0.0, 1.0, 0.0]] - Vector3F for the target color
	* @param {Bool} [jsonIn.directed=false]
	* @param {Mesh} [jsonIn.node] - Node with the mesh for the node
	* @returns {Int}
	* @private
	 */
	this.addArrowNow = function(jsonIn) {		
		if(jsonIn != undefined && jsonIn.node != undefined) 
			meshArrow = jsonIn.node;
		
		var oppositeId = 0;
		
		for(var o=0; o < 2; o++) {			
			for(var n=0; n < meshArrow.vertexArray.length/4; n++) {
				var idxVertex = n*4;
				if(o == 0) oppositeId = this.arrowArrayItemStart; 
				this.arrayArrowId.push(this.currentArrowId);
				
				this.arrayArrowPosXYZW.push(0.0, 0.0, 0.0, 1.0);
				this.arrayArrowPosXYZW_opposite.push(0.0, 0.0, 0.0, 1.0);
				this.arrayArrow_oppositeId.push(oppositeId);
				this.arrayArrowVertexPos.push(meshArrow.vertexArray[idxVertex], meshArrow.vertexArray[idxVertex+1], meshArrow.vertexArray[idxVertex+2], 1.0);
				this.arrayArrowVertexNormal.push(meshArrow.normalArray[idxVertex], meshArrow.normalArray[idxVertex+1], meshArrow.normalArray[idxVertex+2], 1.0);
				this.arrayArrowVertexTexture.push(meshArrow.textureArray[idxVertex], meshArrow.textureArray[idxVertex+1], meshArrow.textureArray[idxVertex+2], 1.0);
				//console.log(bo.nodeMeshVertexArray[idxVertex]);
				if(o == 0) {
					this.arrayArrowNodeName.push(jsonIn.origin_nodeName);
					this.arrayArrowNodeId.push(jsonIn.origin_nodeId);
					this.arrayArrowVertexColor.push(jsonIn.origin_color[0], jsonIn.origin_color[1], jsonIn.origin_color[2], 0.0);
				} else {
					this.arrayArrowNodeName.push(jsonIn.target_nodeName);
					this.arrayArrowNodeId.push(jsonIn.target_nodeId);
					this.arrayArrowVertexColor.push(jsonIn.target_color[0], jsonIn.target_color[1], jsonIn.target_color[2], 1.0);
				}
				
				this.arrowArrayItemStart++;
			}
				
			var maxArrowIndexId = 0;
			for(var n=0; n < meshArrow.indexArray.length; n++) {
				var idxIndex = n;
				
				this.arrayArrowIndices.push(this.startIndexId_arrow+meshArrow.indexArray[idxIndex]);
				//console.log(this.startIndexId+bo.nodeMeshIndexArray[idxIndex]);
				
				if(meshArrow.indexArray[idxIndex] > maxArrowIndexId) {
					maxArrowIndexId = meshArrow.indexArray[idxIndex];			
				}
			}
			if(this.arrayArrowIndices.length == this.splitArrowsIndices[this.splitArrowsIndices.length-1]) { 
				this.startIndexId_arrow = 0;
			}
			if(this.startIndexId_arrow == 0) {
				if(this.splitArrows == undefined) {
					this.splitArrows.push(this.arrayArrowId.length*this.splitArrowsEvery);
					this.splitArrowsIndices.push(this.arrayArrowIndices.length*this.splitArrowsEvery);
				} else {
					this.splitArrows.push(this.splitArrows[0]*(this.splitArrows.length+1));
					this.splitArrowsIndices.push(this.splitArrowsIndices[0]*(this.splitArrowsIndices.length+1)); 
				}		
			}
			this.startIndexId_arrow += (maxArrowIndexId+1);
			
			
			this.currentArrowId++; // augment arrow id
		}
	};
	/** @private */
	this.updateArrows = function() {
		//this.updateForcesAndPP(comp_renderer_arrows);
		
		comp_renderer_arrows.setArg("idx", (function() {return this.arrayArrowId;}).bind(this), this.splitArrows); 
		comp_renderer_arrows.setArg("nodeId", (function() {return this.arrayArrowNodeId;}).bind(this), this.splitArrows);
		
		if(comp_renderer_nodes.getTempBuffers()["posXYZW"] != undefined) {
			this.arrayArrowPosXYZW = [];
			var arr4Uint8_XYZW = comp_renderer_nodes.getWebCLGL().enqueueReadBuffer_Float4(comp_renderer_nodes.getTempBuffers()["posXYZW"]);
			//var arr4Uint8_XYZW = this.clglLayout_nodes.CLGL_bufferPosXYZW.Float4;
			for(var key in this._links) {
				for(var o=0; o < 2; o++) {
					for(var n=0; n < meshArrow.vertexArray.length/4; n++) {
						if(o == 0) {
							this.arrayArrowPosXYZW.push(arr4Uint8_XYZW[0][this._links[key].origin_itemStart],
														arr4Uint8_XYZW[1][this._links[key].origin_itemStart],
														arr4Uint8_XYZW[2][this._links[key].origin_itemStart],
														arr4Uint8_XYZW[3][this._links[key].origin_itemStart]);
						} else {
							this.arrayArrowPosXYZW.push(arr4Uint8_XYZW[0][this._links[key].target_itemStart],
														arr4Uint8_XYZW[1][this._links[key].target_itemStart],
														arr4Uint8_XYZW[2][this._links[key].target_itemStart],
														arr4Uint8_XYZW[3][this._links[key].target_itemStart]);
						}
					}
				}
			}
		}
		
		comp_renderer_arrows.setArg("posXYZW", (function() {return this.arrayArrowPosXYZW;}).bind(this), this.splitArrows);
		comp_renderer_arrows.setArg("posXYZW_opposite", (function() {return this.arrayArrowPosXYZW_opposite;}).bind(this), this.splitArrows);	 
		comp_renderer_arrows.setArg("oppositeId", (function() {return this.arrayArrow_oppositeId;}).bind(this), this.splitArrows);	
		
		comp_renderer_arrows.setArg("bufferWidth", (function() {return comp_renderer_arrows.getBuffers()["posXYZW"].items[0].W;}).bind(this));
		comp_renderer_arrows.setArg("bufferHeight", (function() {return comp_renderer_arrows.getBuffers()["posXYZW"].items[0].H;}).bind(this));
		 
		comp_renderer_arrows.setArg("initPos", (function() {return this.arrayArrowPosXYZW;}).bind(this), this.splitArrows);
		comp_renderer_arrows.setArg("nodeVertexPos", (function() {return this.arrayArrowVertexPos;}).bind(this), this.splitArrows);
		comp_renderer_arrows.setArg("nodeVertexNormal", (function() {return this.arrayArrowVertexNormal;}).bind(this), this.splitArrows);
		comp_renderer_arrows.setArg("nodeVertexTexture", (function() {return this.arrayArrowVertexTexture;}).bind(this), this.splitArrows);
		comp_renderer_arrows.setArg("nodeVertexCol", (function() {return this.arrayArrowVertexColor;}).bind(this), this.splitArrows);
		
		comp_renderer_arrows.setIndices((function() {return this.arrayArrowIndices;}).bind(this), this.splitArrowIndices);
		
		this.arrayArrowDir = [];	
		for(var n=0; n < this.arrayArrowId.length; n++) {
			this.arrayArrowDir.push(0, 0, 0, 255);
		}
		comp_renderer_arrows.setArg("dir", (function() {return this.arrayArrowDir;}).bind(this), this.splitArrows);
		comp_renderer_arrows.setArg("initDir", (function() {return this.arrayArrowDir;}).bind(this), this.splitArrows);
		
		this.arrayArrowPolaritys = [];	
		for(var n=0; n < this.arrayArrowId.length; n++) {
			this.arrayArrowPolaritys.push(1);
		}
		comp_renderer_arrows.setArg("particlePolarity", (function() {return this.arrayArrowPolaritys;}).bind(this), this.splitArrows);
		
		this.arrayArrowDestination = [];	
		for(var n=0; n < this.arrayArrowId.length; n++) {
			this.arrayArrowDestination.push(0, 0, 0, 255);
		}
		comp_renderer_arrows.setArg("dest", (function() {return this.arrayArrowDestination;}).bind(this), this.splitArrows);
		
		comp_renderer_arrows.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_arrows.setArgUpdatable("PMatrix", true);
		comp_renderer_arrows.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_arrows.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_arrows.setArg("nodeWMatrix", (function() {return node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_arrows.setArgUpdatable("nodeWMatrix", true);
		comp_renderer_arrows.setArg("nodesSize", (function() {return this.currentArrowId-1;}).bind(this));
		comp_renderer_arrows.setArg("sunPos", (function() {return [0.2, -0.5, 0.4, 1.0];}).bind(this));
		comp_renderer_arrows.setArg("selfShadows", (function() {return 0.0;}).bind(this));
		comp_renderer_arrows.setArg("ambientColor", (function() {return [0.2, 0.2, 0.2, 1.0];}).bind(this));
		
		comp_renderer_arrows.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
		comp_renderer_arrows.setArg("destinationForce", (function() {return this.destinationForce;}).bind(this));
		comp_renderer_arrows.setArg("lifeDistance", (function() {return this.lifeDistance;}).bind(this));
		comp_renderer_arrows.setArg("pointSize", (function() {return this.pointSize;}).bind(this));
		comp_renderer_arrows.setArg("enableDrag", (function() {return 0;}).bind(this));
		comp_renderer_arrows.setArg("idToDrag", (function() {return 0;}).bind(this));
		comp_renderer_arrows.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
		comp_renderer_arrows.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
		comp_renderer_arrows.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));
		comp_renderer_arrows.setArg("isArrow", (function() {return 1.0;}).bind(this));
		comp_renderer_arrows.setArg("isLink", (function() {return 1.0;}).bind(this));
	}; 
	
	
	
	
	
	
	
	
	
	
	
	
	
	var fontImagesWidth = 7.0;
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
	
	
	this.addNodeTextNow = function(jsonIn) {
		//*******************************************************************************************************************
		// FILL ARRAYS
		//*******************************************************************************************************************
		for(var i = 0; i < 12; i++) {
			var letterId;
			if(jsonIn.text[i] != undefined) {
				letterId = getLetterId(jsonIn.text[i]);
				
				if(letterId == undefined)
					letterId = getLetterId(" ");					
			} else {
				letterId = getLetterId(" ");
			}
			
			for(var n=0; n < meshQuad.vertexArray.length/4; n++) {
				var idxVertex = n*4;
				
				this.arrayNodeTextId.push(this.currentNodeTextId);
				this.arrayNodeTextPosXYZW.push(0.0, 0.0, 0.0, 1.0);
				this.arrayNodeTextVertexPos.push(meshQuad.vertexArray[idxVertex]+(i*0.5), meshQuad.vertexArray[idxVertex+1], meshQuad.vertexArray[idxVertex+2], 1.0);
				this.arrayNodeTextVertexNormal.push(meshQuad.normalArray[idxVertex], meshQuad.normalArray[idxVertex+1], meshQuad.normalArray[idxVertex+2], 1.0);
				this.arrayNodeTextVertexTexture.push(meshQuad.textureArray[idxVertex], meshQuad.textureArray[idxVertex+1], meshQuad.textureArray[idxVertex+2], 1.0);
				
				this.arrayNodeTextNodeName.push(jsonIn.name);
				this.arrayNodeTextNodeId.push(jsonIn.nodeId);
				
				this.arrayNodeTextVertexColor.push(1.0, 1.0, 1.0, 1.0);
				
				this.arrayNodeText_itemStart.push(jsonIn.itemStart);
				
				this.arrayNodeTextLetterId.push(letterId);
			}
				
			var maxNodeIndexId = 0;
			for(var n=0; n < meshQuad.indexArray.length; n++) {
				var idxIndex = n;
				
				this.arrayNodeTextIndices.push(this.startIndexId_nodestext+meshQuad.indexArray[idxIndex]);
				//console.log(this.startIndexId+bo.nodeMeshIndexArray[idxIndex]);
				
				if(meshQuad.indexArray[idxIndex] > maxNodeIndexId) {
					maxNodeIndexId = meshQuad.indexArray[idxIndex];			
				}
			}
			if(this.arrayNodeTextIndices.length == this.splitNodesTextIndices[this.splitNodesTextIndices.length-1]) { 
				this.startIndexId_nodestext = 0;
			}
			if(this.startIndexId_nodestext == 0) {
				if(this.splitNodesText == undefined) {
					this.splitNodesText.push(this.arrayNodeTextId.length*this.splitNodesTextEvery);
					this.splitNodesTextIndices.push(this.arrayNodeTextIndices.length*this.splitNodesTextEvery);
				} else {
					this.splitNodesText.push(this.splitNodesText[0]*(this.splitNodesText.length+1));
					this.splitNodesTextIndices.push(this.splitNodesTextIndices[0]*(this.splitNodesTextIndices.length+1)); 
				}		
			}
			this.startIndexId_nodestext += (maxNodeIndexId+1);
		}
		
		this.currentNodeTextId++; // augment node id
	};
	/** @private */
	this.updateNodesText = function() {
		//this.updateForcesAndPP(comp_renderer_nodesText);
		
		comp_renderer_nodesText.setArg("idx", (function() {return this.arrayNodeTextId;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setArg("nodeId", (function() {return this.arrayNodeTextId;}).bind(this), this.splitNodesText); 
		
		if(comp_renderer_nodes.getTempBuffers()["posXYZW"] != undefined) {
			var arr4Uint8_XYZW = comp_renderer_nodes.getWebCLGL().enqueueReadBuffer_Float4(comp_renderer_nodes.getTempBuffers()["posXYZW"]);
			//var arr4Uint8_XYZW = this.clglLayout_nodes.CLGL_bufferPosXYZW.Float4;
			for(var n = 0, f = this.arrayNodeTextId.length; n < f; n++) {
				var idx = n*4;
				this.arrayNodeTextPosXYZW[idx] = arr4Uint8_XYZW[0][this.arrayNodeText_itemStart[n]];
				this.arrayNodeTextPosXYZW[idx+1] = arr4Uint8_XYZW[1][this.arrayNodeText_itemStart[n]];
				this.arrayNodeTextPosXYZW[idx+2] = arr4Uint8_XYZW[2][this.arrayNodeText_itemStart[n]];
				this.arrayNodeTextPosXYZW[idx+3] = arr4Uint8_XYZW[3][this.arrayNodeText_itemStart[n]];
			}
		}
		comp_renderer_nodesText.setArg("posXYZW", (function() {return this.arrayNodeTextPosXYZW;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setArg("initPos", (function() {return this.arrayNodeTextPosXYZW;}).bind(this), this.splitNodesText);
				
		comp_renderer_nodesText.setArg("nodeVertexPos", (function() {return this.arrayNodeTextVertexPos;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setArg("nodeVertexNormal", (function() {return this.arrayNodeTextVertexNormal;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setArg("nodeVertexTexture", (function() {return this.arrayNodeTextVertexTexture;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setArg("nodeVertexCol", (function() {return this.arrayNodeTextVertexColor;}).bind(this), this.splitNodesText);
		
		comp_renderer_nodesText.setArg("fontImagesWidth", (function() {return fontImagesWidth;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setArg("letterId", (function() {return this.arrayNodeTextLetterId;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setIndices((function() {return this.arrayNodeTextIndices;}).bind(this), this.splitNodesTextIndices);
		
		this.arrayNodeTextDir = [];	
		for(var n=0; n < this.arrayNodeTextId.length; n++) {
			this.arrayNodeTextDir.push(0, 0, 0, 255);
		}
		comp_renderer_nodesText.setArg("dir", (function() {return this.arrayNodeTextDir;}).bind(this), this.splitNodesText);
		comp_renderer_nodesText.setArg("initDir", (function() {return this.arrayNodeTextDir;}).bind(this), this.splitNodesText);
		
		this.arrayNodeTextPolaritys = [];	
		for(var n=0; n < this.arrayNodeTextId.length; n++) {
			this.arrayNodeTextPolaritys.push(1);
		}
		comp_renderer_nodesText.setArg("particlePolarity", (function() {return this.arrayNodeTextPolaritys;}).bind(this), this.splitNodesText);
		
		this.arrayNodeTextDestination = [];	
		for(var n=0; n < this.arrayNodeTextId.length; n++) {
			this.arrayNodeTextDestination.push(0, 0, 0, 255);
		}
		comp_renderer_nodesText.setArg("dest", (function() {return this.arrayNodeTextDestination;}).bind(this), this.splitNodesText);
		
		comp_renderer_nodesText.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_nodesText.setArgUpdatable("PMatrix", true);
		comp_renderer_nodesText.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_nodesText.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_nodesText.setArg("nodeWMatrix", (function() {return node.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_nodesText.setArgUpdatable("nodeWMatrix", true);
		
		comp_renderer_nodesText.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
		comp_renderer_nodesText.setArg("destinationForce", (function() {return this.destinationForce;}).bind(this));
		comp_renderer_nodesText.setArg("lifeDistance", (function() {return this.lifeDistance;}).bind(this));
		comp_renderer_nodesText.setArg("enableDrag", (function() {return 0;}).bind(this));
		comp_renderer_nodesText.setArg("idToDrag", (function() {return 0;}).bind(this));
		comp_renderer_nodesText.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
		comp_renderer_nodesText.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
		comp_renderer_nodesText.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));
		comp_renderer_nodesText.setArg("isNodeText", (function() {return 1;}).bind(this));
	}; 
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	/**
	 * setFontsImage
	 * @param {String} url
	 */
	this.setFontsImage = function(url) {
		var image = new Image();
		image.onload = (function() {
			console.log(image); 
			comp_renderer_nodesText.setArg("fontsImg", (function(){return image;}).bind(this));
		}).bind(this);
		image.src = url;
	};
	
	
	/**
	 * Set self shadows
	 * @param {Bool} [bselfShadows=true]
	 */
	this.setSelfShadows = function(bselfShadows) {
		var ss = (bselfShadows != undefined) ? bselfShadows : true;
		this.selfShadows = ss;
		
		comp_renderer_nodes.setArg("selfShadows", (function() {return ((this.selfShadows == true)?1.0:0.0);}).bind(this));
		comp_renderer_links.setArg("selfShadows", (function() {return ((this.selfShadows == true)?1.0:0.0);}).bind(this));
		comp_renderer_arrows.setArg("selfShadows", (function() {return ((this.selfShadows == true)?1.0:0.0);}).bind(this));
		comp_renderer_nodesText.setArg("selfShadows", (function() {return ((this.selfShadows == true)?1.0:0.0);}).bind(this));
	};

	/**
	 * Split nodes buffer every 
	 * @param {Int} value
	 */
	this.setNodesSplitEvery = function(value) {
		this.splitNodesEvery = value;
	};

	/**
	 * Split links buffer every
	 * @param {Int} value
	 */
	this.setLinksSplitEvery = function(value) {
		this.splitLinksEvery = value;
	};
	
	/**
	 * Split arrows buffer every
	 * @param {Int} value
	 */
	this.setArrowsSplitEvery = function(value) {
		this.splitArrowsEvery = value;
	};

	/** @private **/
	/*this.updateForcesAndPP = function(clglwork) {
		// POLARITY POINTS
		this.arrPP = [];
		for(var n = 0, f = this._sec.polarityPoints.length; n < f; n++) {
			for(var nb = 0, fb = this._sec.polarityPoints[n].nodesProc.length; nb < fb; nb++) {
				if(this.objectType == this._sec.polarityPoints[n].nodesProc[nb].objectType && this.idNum == this._sec.polarityPoints[n].nodesProc[nb].idNum) {
					var oper = this.MPOS.x(this._sec.polarityPoints[n].getPosition());
					
					this.arrPP.push({"x": oper.e[0], "y": oper.e[1], "z": oper.e[2],
								"polarity": this._sec.polarityPoints[n].polarity,
								"orbit": this._sec.polarityPoints[n].orbit,
								"force": this._sec.polarityPoints[n].force});
				}
			}
		}
		// FORCES
		this.arrF = [];
		for(var n = 0, f = this._sec.forceFields.length; n < f; n++) {
			for(var nb = 0, fb = this._sec.forceFields[n].nodesProc.length; nb < fb; nb++) {
				if(this.objectType == this._sec.forceFields[n].nodesProc[nb].objectType && this.idNum == this._sec.forceFields[n].nodesProc[nb].idNum) {
					var oper = this._sec.forceFields[n].direction;
					
					this.arrF.push({"x": oper.e[0], "y": oper.e[1], "z": oper.e[2]});
				}
			}
		}
		
		var kernel = clglwork.getKernel("dir");
		kernel.setKernelSource(this.source_direction());
		clglwork.addKernel(kernel, "dir");
		
		for(var n = 0, f = this.arrPP.length; n < f; n++) {
			clglwork.setArg('pole'+n+'X', this.arrPP[n].x);
			clglwork.setArg('pole'+n+'Y', this.arrPP[n].y); 
			clglwork.setArg('pole'+n+'Z', this.arrPP[n].z); 
			clglwork.setArg('pole'+n+'Polarity', this.arrPP[n].polarity); 
			clglwork.setArg('pole'+n+'Orbit', this.arrPP[n].orbit); 
			clglwork.setArg('pole'+n+'Force', this.arrPP[n].force); 
		}
		for(var n = 0, f = this.arrF.length; n < f; n++) {
			clglwork.setArg('force'+n+'X', this.arrF[n].x); 
			clglwork.setArg('force'+n+'Y', this.arrF[n].y); 
			clglwork.setArg('force'+n+'Z', this.arrF[n].z);
		}
	};*/
	/**
	* Destination force
	* @param	{Float} force
	* @type Void
	*/
	this.set_destinationForce = function(value) { 
		this.destinationForce = value;
		comp_renderer_nodes.setArg("destinationForce", (function() {return this.destinationForce;}).bind(this));
		comp_renderer_links.setArg("destinationForce", (function() {return this.destinationForce;}).bind(this));
		comp_renderer_arrows.setArg("destinationForce", (function() {return this.destinationForce;}).bind(this));
		comp_renderer_nodesText.setArg("destinationForce", (function() {return this.destinationForce;}).bind(this));
	};
	/**
	* Disable destination
	* @type Void
	*/
	this.set_disableDestination = function() { 	
		this.enDestination = 0;	
		comp_renderer_nodes.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
		comp_renderer_links.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
		comp_renderer_arrows.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
		comp_renderer_nodesText.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
	};
	/**
	* Enable destination
	* @type Void
	*/
	this.set_enableDestination = function() { 	
		this.enDestination = 1;	
		comp_renderer_nodes.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
		comp_renderer_links.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
		comp_renderer_arrows.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
		comp_renderer_nodesText.setArg("enableDestination", (function() {return this.enDestination;}).bind(this));
	};
	/**
	* Life distance
	* @param {Float} distance
	* @type Void
	*/
	this.set_lifeDistance = function(value) { 
		this.lifeDistance = value;
		comp_renderer_nodes.setArg("lifeDistance", (function() {return this.lifeDistance;}).bind(this));
		comp_renderer_links.setArg("lifeDistance", (function() {return this.lifeDistance;}).bind(this));
		comp_renderer_arrows.setArg("lifeDistance", (function() {return this.lifeDistance;}).bind(this));
		comp_renderer_nodesText.setArg("lifeDistance", (function() {return this.lifeDistance;}).bind(this));
	};
	/**
	* Point size
	* @param {Float} size
	* @type Void
	*/
	this.set_pointSize = function(value) { 
		this.pointSize = value;
		comp_renderer_nodes.setArg("pointSize", (function() {return this.pointSize;}).bind(this));
		comp_renderer_links.setArg("pointSize", (function() {return this.pointSize;}).bind(this));
		comp_renderer_arrows.setArg("pointSize", (function() {return this.pointSize;}).bind(this));
		comp_renderer_nodesText.setArg("pointSize", (function() {return this.pointSize;}).bind(this));
	};
	/**
	* Polarity
	* @param {Array<Float>} polarity
	* @type Void
	*/
	this.set_polarity = function(arr) {
		this.arrayNodePolaritys = arr;
		this.arrayLinkPolaritys = arr;
		this.arrayArrowPolaritys = arr;
		this.arrayNodeTextPolaritys = arr;
		comp_renderer_nodes.setArg("particlePolarity", (function() {return this.arrayNodePolaritys;}).bind(this), this.splitNodes);
		comp_renderer_links.setArg("particlePolarity", (function() {return this.arrayLinkPolaritys;}).bind(this), this.splitLinks);
		comp_renderer_arrows.setArg("particlePolarity", (function() {return this.arrayArrowPolaritys;}).bind(this), this.splitArrows);
		comp_renderer_nodesText.setArg("particlePolarity", (function() {return this.arrayNodeTextPolaritys;}).bind(this), this.splitNodesText);
	};

	/**
	* Set color
	* @type Void
	* @param {StormV3|HTMLImageElement} color Vector3 or HTMLImageElement
	*/
	this.set_color = function(color) {
		var arr;
		if(color != undefined && color instanceof HTMLImageElement) {
			arr = new Utils().getUint8ArrayFromHTMLImageElement(color);
		} else if(color != undefined && color instanceof StormV3) {
			arr = new Uint8Array([color.e[0]*255, color.e[1]*255, color.e[2]*255, 255]);
		} else {
			arr = new Uint8Array([255, 255, 255, 255]);
		}
		
		this.arrayNodeVertexColor = []; 
		
		var currentNodeId = -1;
		var x = 0;
		var y = 0;
		var z = 0;
		var w = 0;
		for(var n = 0, f = this.arrayNodeId.length; n < f; n++) {
			if(currentNodeId != this.arrayNodeId[n]) {
				currentNodeId = this.arrayNodeId[n];
				
				if(arr.length > 4) {
					x = parseFloat(arr[(currentNodeId*4)]/255);
					y = parseFloat(arr[(currentNodeId*4)+1]/255);
					z = parseFloat(arr[(currentNodeId*4)+2]/255);
					w = parseFloat(arr[(currentNodeId*4)+3]/255);
				} else {
					x = parseFloat(arr[0]/255);
					y = parseFloat(arr[1]/255);
					z = parseFloat(arr[2]/255);
					w = parseFloat(arr[3]/255);
				}
				
				this.arrayNodeVertexColor.push(x, y, z, w);
			} else {
				this.arrayNodeVertexColor.push(x, y, z, w);
			}
		}	
		
		comp_renderer_nodes.setArg("nodeVertexCol", (function() {return this.arrayNodeVertexColor;}).bind(this), this.splitNodes);
	};

	/**
	* Set link color
	* @param {Array<Float4>|Array<Float8>|HTMLImageElement} color Vector3 or HTMLImageElement
	*/
	this.set_linkColor = function(color) {
		var arr, arrTarget;
		var origin = true;
		
		if(color != undefined && color instanceof HTMLImageElement) {
			arr = new Utils().getUint8ArrayFromHTMLImageElement(color);
		} else if(color != undefined && color.constructor === Array) {
			arr = new Uint8Array([color[0]*255, color[1]*255, color[2]*255, color[3]*255]);
			arrTarget = new Uint8Array([color[4]*255, color[5]*255, color[6]*255, color[7]*255]);
		} else {
			arr = new Uint8Array([255, 255, 255, 255]);
			arrTarget = new Uint8Array([250.0, 250.0, 250.0, 255.0]);
		}
		
		this.arrayLinkVertexColor = []; 
		
		var currentLinkId = -1;
		var x = 0;
		var y = 0;
		var z = 0;
		var w = 0;
		for(var n = 0, f = this.arrayLinkId.length; n < f; n++) {
			if(currentLinkId != this.arrayLinkId[n]) {
				currentLinkId = this.arrayLinkId[n];
				
				if(color != undefined && color instanceof HTMLImageElement) {
					x = parseFloat(arr[(currentLinkId*4)]/255);
					y = parseFloat(arr[(currentLinkId*4)+1]/255);
					z = parseFloat(arr[(currentLinkId*4)+2]/255);
					w = parseFloat(arr[(currentLinkId*4)+3]/255);
				} else {
					if(origin == true) {
						x = parseFloat(arr[0]/255);
						y = parseFloat(arr[1]/255);
						z = parseFloat(arr[2]/255);
						w = parseFloat(arr[3]/255);
					} else {
						x = parseFloat(arrTarget[0]/255);
						y = parseFloat(arrTarget[1]/255);
						z = parseFloat(arrTarget[2]/255);
						w = parseFloat(arrTarget[3]/255);
					}					
					origin = !origin;
				}
				
				this.arrayLinkVertexColor.push(x, y, z, w);
			} else {
				this.arrayLinkVertexColor.push(x, y, z, w);
			}
		}	
		
		comp_renderer_links.setArg("nodeVertexCol", (function() {return this.arrayLinkVertexColor;}).bind(this), this.splitLinks);
	};

	/**
	* Destination by array XYZ
	* @type Void
	* @param {Array<Float3>} arr 
	* @param {Float} spacing
	*/
	this.set_destinationArray = function(arr, spacing) {
		this.set_enableDestination();
		this.set_destinationForce(0.1);
			
		this.arrayNodeDestination = [];	
		
		var currentNodeId = -1;
		var x = 0;
		var y = 0;
		var z = 0;
		var spac = (spacing != undefined) ? spacing : 0.01; 
		for(var n=0; n < this.arrayNodeId.length; n++) {
			if(currentNodeId != this.arrayNodeId[n]) {
				currentNodeId = this.arrayNodeId[n];
			
				x = parseFloat(arr[(currentNodeId*3)]);
				y = parseFloat(arr[(currentNodeId*3)+1]);
				z = parseFloat(arr[(currentNodeId*3)+2]);
				
				this.arrayNodeDestination.push(x*spac, y*spac, z*spac, 255);	
			} else {
				this.arrayNodeDestination.push(x*spac, y*spac, z*spac, 255);
			}
		}
		comp_renderer_nodes.setArg("dest", (function() {return this.arrayNodeDestination;}).bind(this), this.splitNodes);
		
		this.setLinksDestinationToNodesDestination();	
		this.setArrowsDestinationToNodesDestination();
		this.setNodeTextDestinationToNodesDestination();
	};
	/**
	* Destination by width and height
	* @param {Object} position For make a square or spherical disposal
	* @param {Float} position.width - width
	* @param {Float} position.height - height
	* @param {Float} [position.spacing=0.01] - Spacing
	*/
	this.set_destinationWidthHeight = function(jsonIn) {
		this.set_enableDestination();
		this.set_destinationForce(0.5);
			
		this.arrayNodeDestination = [];	
		
		var totalNodes = this.currentNodeId;
		var totalDestinations = jsonIn.width*jsonIn.height;
		var nodesPerCell = totalNodes/totalDestinations;
		var nodesInCell = 0;	
		var currentNodeId = -1;
		var x = 0;
		var z = 0;
		var spacing = (jsonIn.spacing != undefined) ? jsonIn.spacing : 0.01;
		for(var n=0; n < this.arrayNodeId.length; n++) {
			if(currentNodeId != this.arrayNodeId[n]) {
				currentNodeId = this.arrayNodeId[n];
				
				if(nodesInCell >= nodesPerCell) {				
					x++;
					if(x > jsonIn.width-1) {
						x = 0;
						z++;
					}
					nodesInCell -= nodesPerCell;
				}
				nodesInCell += 1;
				
				this.arrayNodeDestination.push(x*spacing, 0, z*spacing, 255);			
			} else {
				this.arrayNodeDestination.push(x*spacing, 0, z*spacing, 255);
			}
		}
		comp_renderer_nodes.setArg("dest", (function() {return this.arrayNodeDestination;}).bind(this), this.splitNodes);
		
		this.setLinksDestinationToNodesDestination();	
		this.setArrowsDestinationToNodesDestination();
		this.setNodeTextDestinationToNodesDestination();
	};
	/**
	* Destination to voxel volume
	* @param {StormVoxelizator} voxelizator
	* @type Void
	*/
	this.set_destinationVolume = function(voxelizator) {
		this.set_enableDestination();
		this.set_destinationForce(0.5);
			
		this.arrayNodeDestination = [];	
		this.arrayNodeVertexColor = [];
		
		this.vo = voxelizator;
		if(this.vo instanceof StormVoxelizator == false) { alert("You must select a voxelizator object with albedo fillmode enabled."); return false;}
		if(this.vo.image3D_VoxelsColor == undefined) { alert("You must select a voxelizator object with albedo fillmode enabled."); return false;}
		this.data = this.vo.clglBuff_VoxelsColor.items[0].inData;
		
		var numActCells = 0;
		for(var n = 0, f = this.data.length/4; n < f; n++) { // num of active cells
			var id = n*4;
			//if(data[id] > 30 && data[id+1] > 30 && data[id+2] > 30)
			if(this.data[id+3] > 0) {
				numActCells++;
			}
		}
		var totalNodes = this.currentNodeId-1;
		var nodesPerCell = totalNodes/numActCells;
		
		this.incremNodesCell = 0;	
		var currentNodeId = -1;
		
		this.currentVoxelCell;
		this.CCX=0,this.CCY=0,this.CCZ=0;
		this.CCXMAX=this.vo.resolution-1, this.CCYMAX=this.vo.resolution-1, this.CCZMAX=this.vo.resolution-1;
		var separation = 1.0;
		var p;
		var c;
		var make = false;
		
		var next = (function() {
			while(true) {
				if(this.CCX == this.CCXMAX && this.CCZ == this.CCZMAX && this.CCY == this.CCYMAX) {
					break;
				} else {
					if(this.CCX == this.CCXMAX && this.CCZ == this.CCZMAX) {
						this.CCX=0;this.CCZ=0;this.CCY++;
					} else {
						if(this.CCX == this.CCXMAX) {
							this.CCX=0;this.CCZ++;
						} else {
							this.CCX++;
						}
					}
				}
				
				this.currentVoxelCell = (this.CCY*(this.vo.resolution*this.vo.resolution)) + (this.CCZ*(this.vo.resolution)) + this.CCX;
				
				if(this.data[(this.currentVoxelCell*4)+3] > 0) {
					this.incremNodesCell += nodesPerCell;
					if(this.incremNodesCell >= 1.0) {
						this.incremNodesCell -= 1.0;
						break;
					}
				}
			}
		}).bind(this);
		
		for(var n=0; n < this.arrayNodeId.length; n++) {
			if(currentNodeId != this.arrayNodeId[n]) {
				currentNodeId = this.arrayNodeId[n];
									
				if(this.incremNodesCell >= 1.0) {
					this.incremNodesCell -= 1.0;
				} else {
					next();
				}
				
				// position
				p = $V3([0.0,0.0,0.0]).add($V3([-(this.vo.size/2.0), -(this.vo.size/2.0), -(this.vo.size/2.0)]));  
				p = p.add($V3([ this.vo.cs*this.CCX*separation, this.vo.cs*this.CCY*separation, this.vo.cs*(this.CCZMAX-this.CCZ)*separation ])); 
				p = p.add($V3([ this.vo.cs*Math.random(), this.vo.cs*Math.random(), this.vo.cs*Math.random() ]));
				
				// color
				c = $V3([ this.data[(this.currentVoxelCell*4)]/255, this.data[(this.currentVoxelCell*4)+1]/255, this.data[(this.currentVoxelCell*4)+2]/255 ]);
				
				this.arrayNodeDestination.push(p.e[0], p.e[1], p.e[2], 1.0);	
				this.arrayNodeVertexColor.push(c.e[0], c.e[1], c.e[2], 1.0);
			} else {
				this.arrayNodeDestination.push(p.e[0], p.e[1], p.e[2], 1.0);
				this.arrayNodeVertexColor.push(c.e[0], c.e[1], c.e[2], 1.0);
			}
		}
		comp_renderer_nodes.setArg("dest", (function() {return this.arrayNodeDestination;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("nodeVertexCol", (function() {return this.arrayNodeVertexColor;}).bind(this), this.splitNodes);
		
		this.setLinksDestinationToNodesDestination();
		this.setArrowsDestinationToNodesDestination();
		this.setNodeTextDestinationToNodesDestination();
	};
	/**
	* Set Destination of links to actual destination of nodes
	* @type Void
	*/
	this.setLinksDestinationToNodesDestination = function() {
		// update destination for links
		this.arrayLinkDestination = [];	
		for(var n=0; n < this.arrayLinkId.length; n++) {
			var currentLinkNodeName = this.arrayLinkNodeName[n];		
			var nodeNameItemStart = this._nodesByName[currentLinkNodeName].itemStart;
			
			this.arrayLinkDestination.push(this.arrayNodeDestination[(nodeNameItemStart*4)],
											this.arrayNodeDestination[(nodeNameItemStart*4)+1],
											this.arrayNodeDestination[(nodeNameItemStart*4)+2],
											1.0);
		}
		comp_renderer_links.setArg("dest", (function() {return this.arrayLinkDestination;}).bind(this), this.splitLinks);
	};
	/**
	* Set Destination of arrows to actual destination of nodes
	* @type Void
	*/
	this.setArrowsDestinationToNodesDestination = function() {
		// update destination for arrows
		this.arrayArrowDestination = [];	
		for(var n=0; n < this.arrayArrowId.length; n++) {
			var currentArrowNodeName = this.arrayArrowNodeName[n];		
			var nodeNameItemStart = this._nodesByName[currentArrowNodeName].itemStart;
			
			this.arrayArrowDestination.push(this.arrayNodeDestination[(nodeNameItemStart*4)],
											this.arrayNodeDestination[(nodeNameItemStart*4)+1],
											this.arrayNodeDestination[(nodeNameItemStart*4)+2],
											1.0);
		}
		comp_renderer_arrows.setArg("dest", (function() {return this.arrayArrowDestination;}).bind(this), this.splitArrows);
	};
	/**
	* Set Destination of nodesText to actual destination of nodes
	* @type Void
	*/
	this.setNodeTextDestinationToNodesDestination = function() {
		// update destination for arrows
		this.arrayNodeTextDestination = [];	
		for(var n=0; n < this.arrayNodeTextId.length; n++) {
			var currentNodeTextNodeName = this.arrayNodeTextNodeName[n];		
			var nodeNameItemStart = this._nodesByName[currentNodeTextNodeName].itemStart;
			
			this.arrayNodeTextDestination.push(	this.arrayNodeDestination[(nodeNameItemStart*4)],
												this.arrayNodeDestination[(nodeNameItemStart*4)+1],
												this.arrayNodeDestination[(nodeNameItemStart*4)+2],
												1.0);
		}
		comp_renderer_nodesText.setArg("dest", (function() {return this.arrayNodeTextDestination;}).bind(this), this.splitNodesText);
	};

	/**
	* Set direction 
	* @type Void
	* @param {String|StormV3} [direction=undefined] 'random', StormV3 or undefined(0.0) 
	*/
	this.set_dir = function(direction) { 	
		this.arrayNodeDir = []; 
		var currentNodeId = -1;
		var currNodeDirection = -1;
		for(var n=0; n < this.arrayNodeId.length; n++) {
			if(currentNodeId != this.arrayNodeId[n]) {
				currentNodeId = this.arrayNodeId[n];
				
				if(direction == undefined) {
					currNodeDirection = [0.0, 0.0, 0.0, 0.0];
				} else if(direction == 'random') {
					currNodeDirection = [1.0-(Math.random()*2.0), 1.0-(Math.random()*2.0), 1.0-(Math.random()*2.0), 0.0];
				} else if(direction instanceof StormV3) {
					currNodeDirection = [direction.e[0], direction.e[1], direction.e[2], 0.0];
				}
				
				this.arrayNodeDir.push(currNodeDirection[0], currNodeDirection[1], currNodeDirection[2], currNodeDirection[3]);
			} else {
				this.arrayNodeDir.push(currNodeDirection[0], currNodeDirection[1], currNodeDirection[2], currNodeDirection[3]);
			}
		}
		comp_renderer_nodes.setArg("dir", (function() {return this.arrayNodeDir;}).bind(this), this.splitNodes);
		
		this.setLinksDirToNodesDir();
		this.setArrowsDirToNodesDir();
		this.setNodeTextDirToNodesDir();
	};
	/**
	* Set Direction of links to actual direction of nodes
	* @type Void
	*/
	this.setLinksDirToNodesDir = function() {
		this.arrayLinkDir = [];	
		for(var n=0; n < this.arrayLinkId.length; n++) {
			var currentLinkNodeName = this.arrayLinkNodeName[n];		
			var nodeNameItemStart = this._nodesByName[currentLinkNodeName].itemStart;
			
			this.arrayLinkDir.push(this.arrayNodeDir[(nodeNameItemStart*4)],
									this.arrayNodeDir[(nodeNameItemStart*4)+1],
									this.arrayNodeDir[(nodeNameItemStart*4)+2],
									1.0);
		}
		comp_renderer_links.setArg("dir", (function() {return this.arrayLinkDir;}).bind(this), this.splitLinks);
	};
	/**
	* Set Direction of arrows to actual direction of nodes
	* @type Void
	*/
	this.setArrowsDirToNodesDir = function() {
		this.arrayArrowDir = [];	
		for(var n=0; n < this.arrayArrowId.length; n++) {
			var currentArrowNodeName = this.arrayArrowNodeName[n];		
			var nodeNameItemStart = this._nodesByName[currentArrowNodeName].itemStart;
			
			this.arrayArrowDir.push(this.arrayNodeDir[(nodeNameItemStart*4)],
									this.arrayNodeDir[(nodeNameItemStart*4)+1],
									this.arrayNodeDir[(nodeNameItemStart*4)+2],
									1.0);
		}
		comp_renderer_arrows.setArg("dir", (function() {return this.arrayArrowDir;}).bind(this), this.splitArrows);
	};
	/**
	* Set Direction of nodeText to actual direction of nodes
	* @type Void
	*/
	this.setNodeTextDirToNodesDir = function() {
		this.arrayNodeTextDir = [];	
		for(var n=0; n < this.arrayNodeTextId.length; n++) {
			var currentNodeTextNodeName = this.arrayNodeTextNodeName[n];		
			var nodeNameItemStart = this._nodesByName[currentNodeTextNodeName].itemStart;
			
			this.arrayNodeTextDir.push(this.arrayNodeDir[(nodeNameItemStart*4)],
									this.arrayNodeDir[(nodeNameItemStart*4)+1],
									this.arrayNodeDir[(nodeNameItemStart*4)+2],
									1.0);
		}
		comp_renderer_nodesText.setArg("dir", (function() {return this.arrayNodeTextDir;}).bind(this), this.splitNodesText);
	};

	/**
	* Set position
	* @type Void
	* @param {Array<StormV3>} position For make through a Array
	* @param {Object} position For make a square or spherical disposal
	* 	@param {Float} position.width Width
	* 	@param {Float} position.height Height
	* 	@param {Float} position.spacing Spacing
	* 	@param {Float} [position.radius=0.5] Radius for type spherical (Anule width/height)
	*/
	this.set_pos = function(jsonIn) { 	
		this.arrayNodePosXYZW = []; 
		var currentNodeId = -1;
		var currentNodePos;
		
		var h = 0, hP = 0, vP = 0;	
		for(var n=0; n < this.arrayNodeId.length; n++) {
			if(currentNodeId != this.arrayNodeId[n]) {
				currentNodeId = this.arrayNodeId[n];
				
				if(jsonIn != undefined && jsonIn.constructor === Array) {			
					var v = this.getPosition().add(jsonIn[n]);
					
					currentNodePos = [v.e[0], v.e[1], v.e[2], 0.0];
					
				} else if(jsonIn == undefined || jsonIn.radius != undefined) {
					var rad = (jsonIn == undefined) ? 1.0 : jsonIn.radius;
					var currAngleH = Math.random()*360.0;
					var currAngleV = Math.random()*180.0;
					var v = $V3([	cos(currAngleH) * Math.abs(sin(currAngleV)) * rad,  
									cos(currAngleV) * rad * Math.random(),
									sin(currAngleH) * Math.abs(sin(currAngleV)) * rad]);
									
					v = this.getPosition().add(v);
					
					currentNodePos = [v.e[0], v.e[1], v.e[2], 0.0];
					
				} else if(jsonIn.width != undefined) {
					var spac = (jsonIn.spacing != undefined) ? jsonIn.spacing : 0.01; 
					var oper = this.MPOS.x($V3([hP,0.0,vP]));
					
					currentNodePos = [oper.e[3], oper.e[7], oper.e[11], 0.0];
					
					h++;
					hP+=spac;
					if(h > jsonIn.width-1) {h=0;hP=0;vP+=spac;}
				}
				
				
				this.arrayNodePosXYZW.push(currentNodePos[0], currentNodePos[1], currentNodePos[2], currentNodePos[3]);
			} else {
				this.arrayNodePosXYZW.push(currentNodePos[0], currentNodePos[1], currentNodePos[2], currentNodePos[3]);
			}
		}
		
		comp_renderer_nodes.setArg("posXYZW", (function() {return this.arrayNodePosXYZW;}).bind(this), this.splitNodes);
		
		this.setLinksPosToNodesPos();
		this.setArrowsPosToNodesPos();
		this.setNodeTextPosToNodesPos();
	};
	/**
	 * setLinksPosToNodesPos
	 */
	this.setLinksPosToNodesPos = function() {
		this.arrayLinkPosXYZW = [];	
		for(var n=0; n < this.arrayLinkId.length; n++) {
			var currentLinkNodeName = this.arrayLinkNodeName[n];		
			var nodeNameItemStart = this._nodesByName[currentLinkNodeName].itemStart;
			
			this.arrayLinkPosXYZW.push(this.arrayNodePosXYZW[(nodeNameItemStart*4)],
									this.arrayNodePosXYZW[(nodeNameItemStart*4)+1],
									this.arrayNodePosXYZW[(nodeNameItemStart*4)+2],
									1.0);
		}
		comp_renderer_links.setArg("posXYZW", (function() {return this.arrayLinkPosXYZW;}).bind(this), this.splitLinks);
	};
	/**
	 * setLinksPosToNodesPos
	 */
	this.setArrowsPosToNodesPos = function() {
		this.arrayArrowPosXYZW = [];	
		for(var n=0; n < this.arrayArrowId.length; n++) {
			var currentArrowNodeName = this.arrayArrowNodeName[n];		
			var nodeNameItemStart = this._nodesByName[currentArrowNodeName].itemStart;
			
			this.arrayArrowPosXYZW.push(this.arrayNodePosXYZW[(nodeNameItemStart*4)],
									this.arrayNodePosXYZW[(nodeNameItemStart*4)+1],
									this.arrayNodePosXYZW[(nodeNameItemStart*4)+2],
									1.0);
		}
		comp_renderer_arrows.setArg("posXYZW", (function() {return this.arrayArrowPosXYZW;}).bind(this), this.splitArrows);
	};
	/**
	 * setNodeTextPosToNodesPos
	 */
	this.setNodeTextPosToNodesPos = function() {
		this.arrayNodeTextPosXYZW = [];	
		for(var n=0; n < this.arrayNodeTextId.length; n++) {
			var currentNodeTextNodeName = this.arrayNodeTextNodeName[n];		
			var nodeNameItemStart = this._nodesByName[currentNodeTextNodeName].itemStart;
			
			this.arrayNodeTextPosXYZW.push(this.arrayNodePosXYZW[(nodeNameItemStart*4)],
									this.arrayNodePosXYZW[(nodeNameItemStart*4)+1],
									this.arrayNodePosXYZW[(nodeNameItemStart*4)+2],
									1.0);
		}
		comp_renderer_nodesText.setArg("posXYZW", (function() {return this.arrayNodeTextPosXYZW;}).bind(this), this.splitNodesText);
	};
};