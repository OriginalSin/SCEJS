var includesF = [   '/graphUtil.js',
                    '/KERNEL_ADJMATRIX_UPDATE.class.js',
                    '/KERNEL_DIR.class.js',
                    '/VFP_NODEPICKDRAG.class.js',
                    '/VFP_NODE.class.js'];
for(var n = 0, f = includesF.length; n < f; n++) document.write('<script type="text/javascript" src="'+sceDirectory+"/Prefabs/Graph"+includesF[n]+'"></script>');

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

    var _enableFont = true;
    var _enableHover = false;
    var _enableAutoLink = true;
    var _enabledForceLayout = false;
    var _MAX_ADJ_MATRIX_WIDTH = 4096;

    var _playAnimation = false;
    var _loop = false;
    var _animationFrames = 500;

    var _geometryLength = 4;
    var circleSegments = 12;
    var nodesTextPlanes = 12;

    var lineVertexCount = 4;

    var _enableNeuronalNetwork = false;
    var _only2d = false;
    var _makeNetworkStep = false;



	var _nodesByName = {};
	var _nodesById = {};
	var _links = {};
    var _customArgs = {}; // {ARG: {"arg": String, "value": Array<Float>}}


    var arrAdjMatrix = null; // linkBornDate, linkDieDate, linkWeight, columnAsParent
    var arrAdjMatrixB = null; // linkMultiplier

    var _ADJ_MATRIX_WIDTH;

    var _initTimestamp;
    var _endTimestamp;
    var _timeFrameIncrement;
    var _currentFrame = 0;
    _initTimestamp = 0;
    _endTimestamp = Date.now();
    _timeFrameIncrement = (_endTimestamp-_initTimestamp)/_animationFrames;

	var readPixel = false;
	var selectedId = -1;
	var _initialPosDrag;

	var _onClickNode;
	var _onAnimationStep;
	var _onAnimationEnd;

	// meshes
	var mesh_nodes = new Mesh().loadQuad(4.0, 4.0);
	var mesh_arrows = new Mesh().loadTriangle({"scale": 1.75, "side": 0.3});
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

    var disabVal = -2.0;

    // nodes
    this.arrayNodeData = []; // nodeId, acums, bornDate, dieDate
    // if(own networkWaitData == disabVal)
    // own has been read. then see networkWaitData of childs, calculate weights & save output in own networkWaitData & networkProcData(for visualization).
    // else if(own networkWaitData != disabVal)
    // own networkWaitData is being read. then set own networkWaitData to disabVal()
    this.arrayNodeDataB = []; // bornDate, dieDate, networkWaitData, networkProcData (SHARED with LINKS, ARROWS & NODESTEXT)
    this.arrayNodeDataF = []; // efferenceData, null, null, null
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

    // links
    this.arrayLinkData = []; // nodeId origin, nodeId target, currentLineVertex, repeatId
    this.arrayLinkDataC = []; // linkBornDate, linkDieDate, linkWeight, 0
    this.arrayLinkNodeName = [];
    this.arrayLinkPosXYZW = [];
    this.arrayLinkVertexPos = [];
    this.startIndexId_link = 0;
    this.arrayLinkIndices = [];

    this.currentLinkId = 0;

    // arrows
    this.arrayArrowData = [];
    this.arrayArrowDataC = [];
    this.arrayArrowNodeName = [];
    this.arrayArrowPosXYZW = [];
    this.arrayArrowVertexPos = [];
    this.arrayArrowVertexNormal = [];
    this.arrayArrowVertexTexture = [];
    this.startIndexId_arrow = 0;
    this.arrayArrowIndices = [];

    this.currentArrowId = 0;
    this.arrowArrayItemStart = 0;

    // nodesText
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




	//**************************************************
	//  NODES
	//**************************************************
	var nodes = new Node();
	nodes.setName("graph_nodes");
	_project.getActiveStage().addNode(nodes);

	// ComponentTransform
	var comp_transform = new ComponentTransform();
	nodes.addComponent(comp_transform);

	// Component_GPU
	var comp_renderer_nodes = new Component_GPU();
	nodes.addComponent(comp_renderer_nodes);

	// ComponentMouseEvents
	var comp_mouseEvents = new ComponentMouseEvents();
	nodes.addComponent(comp_mouseEvents);
	comp_mouseEvents.onmousedown((function(evt) {
		selectedId = -1
		if(_enableHover == false) {
		    readPixel = true;

		    comp_renderer_nodes.gpufG.enableGraphic(1);
        }
	}).bind(this));
	comp_mouseEvents.onmouseup((function(evt) {
		if(selectedId != -1) {
			var n = _nodesById[selectedId];
			if(n != undefined && n.onmouseup != undefined) n.onmouseup(n, evt);
		}

		comp_renderer_nodes.setArg("enableDrag", (function() {return 0;}).bind(this));
		comp_renderer_links.setArg("enableDrag", (function() {return 0;}).bind(this));
		comp_renderer_arrows.setArg("enableDrag", (function() {return 0;}).bind(this));
        if(_enableFont == true)
		    comp_renderer_nodesText.setArg("enableDrag", (function() {return 0;}).bind(this));

		if(selectedId == -1) {
			comp_renderer_nodes.setArg("idToDrag", (function() {return -1;}).bind(this));
			comp_renderer_links.setArg("idToDrag", (function() {return -1;}).bind(this));
			comp_renderer_arrows.setArg("idToDrag", (function() {return -1;}).bind(this));
            if(_enableFont == true)
			    comp_renderer_nodesText.setArg("idToDrag", (function() {return -1;}).bind(this));
		}

        if(_enableHover == true) {
            readPixel = true;

            comp_renderer_nodes.gpufG.enableGraphic(1);
        }

	}).bind(this));
	comp_mouseEvents.onmousemove((function(evt, dir) {
		makeDrag(evt, dir);
	}).bind(this));
	comp_mouseEvents.onmousewheel((function(evt) {
	}).bind(this));

    //**************************************************
    //  LINKS
    //**************************************************
    var links = new Node();
    links.setName("graph_links");
    _project.getActiveStage().addNode(links);

    // ComponentTransform
    var comp_transform = new ComponentTransform();
    links.addComponent(comp_transform);

    // Component_GPU
    var comp_renderer_links = new Component_GPU();
    links.addComponent(comp_renderer_links);

    //**************************************************
    //  ARROWS
    //**************************************************
    var arrows = new Node();
    arrows.setName("graph_arrows");
    _project.getActiveStage().addNode(arrows);

    // ComponentTransform
    var comp_transform = new ComponentTransform();
    arrows.addComponent(comp_transform);

    // Component_GPU
    var comp_renderer_arrows = new Component_GPU();
    arrows.addComponent(comp_renderer_arrows);

    //**************************************************
    //  NODESTEXT
    //**************************************************
    var nodesText = new Node();
    nodesText.setName("graph_nodesText");
    _project.getActiveStage().addNode(nodesText);

    // ComponentTransform
    var comp_transform = new ComponentTransform();
    nodesText.addComponent(comp_transform);

    // Component_GPU
    var comp_renderer_nodesText = new Component_GPU();
    nodesText.addComponent(comp_renderer_nodesText);

    /**
     * onClickNode
     * @param {Callback} fn
     */
    this.onClickNode = function(fn) {
        _onClickNode = fn;
    };

    /**
     * datetimeToTimestamp
     * @private
     * @example
     * var ts = datetimeToTimestamp("24-Nov-2009 17:57:35")
     * */
    var datetimeToTimestamp = (function(dt) {
        return Date.parse(dt);
    }).bind(this);

    /**
     * timestampToDate
     * @private
     */
    var timestampToDate = (function(ts) {
        var d = new Date(ts);
        d = d.toISOString().split("T")[0].split("-");

        return d[2]+"/"+d[1]+"/"+d[0];
    }).bind(this);

    /** @private */
    var getBornDieTS = (function(bornD, dieD) {
        /** @private */
        var generateRandomBornAndDie = (function() {
            var bornDate = _initTimestamp+(parseInt(Math.random()*Math.max(0, _animationFrames-20))*_timeFrameIncrement);
            var dieDate;
            while(true) {
                dieDate = _initTimestamp+(parseInt(Math.random()*_animationFrames)*_timeFrameIncrement);
                if(dieDate > bornDate)
                    break;
            }
            //console.log(bornDate);
            //console.log(dieDate);

            return {bornDate: bornDate, dieDate: dieDate};
        }).bind(this);

        var bd;
        var dd;
        if(bornD != null) {
            if(bornD.constructor===String) {
                if(bornD == "RANDOM") {
                    var rbdd = generateRandomBornAndDie();
                    bd = rbdd.bornDate;
                    dd = rbdd.dieDate;
                } else {
                    bd = datetimeToTimestamp(bornD);
                    dd = datetimeToTimestamp(dieD);
                }
            } else {
                bd = bornD;
                dd = dieD;
            }
        } else {
            bd = 1.0;
            dd = 0.0;
        }

        return {"bornDate": bd, "dieDate": dd};
    }).bind(this);

    /**
     * showTimeline
     * @param {HTMLDivElement} target
     */
    this.showTimeline = function(target) {
        var eSlider = document.createElement("input");
        eSlider.type = "range";
        eSlider.min = 0;
        eSlider.max = _animationFrames;
        eSlider.step = 1;
        eSlider.value = 0;
        eSlider.style.verticalAlign = "middle";
        eSlider.style.width = "78%";

        target.innerText = "";
        target.appendChild(eSlider);

        var set_spinner = function(e) {
            var frame = e.value;
            this.setFrame(frame);
        };

        eSlider.addEventListener("input", set_spinner.bind(this, eSlider));
    };

    /**
     * setTimelineDatetimeRange
     * @param {Object} jsonIn
     * @param {String} jsonIn.initDatetime - date of animation start
     * @param {String} jsonIn.endDatetime - date of animation end
     */
    this.setTimelineDatetimeRange = function(jsonIn) {
        _initTimestamp = datetimeToTimestamp(jsonIn.initDatetime);
        _endTimestamp = datetimeToTimestamp(jsonIn.endDatetime);

        _timeFrameIncrement = (_endTimestamp-_initTimestamp)/_animationFrames;
    };

    /**
     * getTimelineTimestampRangeStart
     * @returns {Int}
     */
    this.getTimelineTimestampRangeStart = function() {
        return _initTimestamp;
    };

    /**
     * setTimelineDatetimeRangeStart
     * @param {String} initDatetime - date of animation start
     */
    this.setTimelineDatetimeRangeStart = function(initDatetime) {
        _initTimestamp = datetimeToTimestamp(initDatetime);

        _timeFrameIncrement = (_endTimestamp-_initTimestamp)/_animationFrames;
    };

    /**
     * getTimelineTimestampRangeEnd
     * @returns {Int}
     */
    this.getTimelineTimestampRangeEnd = function() {
        return _endTimestamp;
    };

    /**
     * setTimelineDatetimeRangeEnd
     * @param {String} endDatetime - date of animation end
     */
    this.setTimelineDatetimeRangeEnd = function(endDatetime) {
        _endTimestamp = datetimeToTimestamp(endDatetime);

        _timeFrameIncrement = (_endTimestamp-_initTimestamp)/_animationFrames;
    };

    /**
     * getTimelineRangeDates
     * @returns {Object}
     */
    this.getTimelineRangeDates = function() {
        return {"initDate": timestampToDate(_initTimestamp),
                "endDate": timestampToDate(_endTimestamp)};
    };

    /**
     * getTimelineFramesLength
     * @returns {Int}
     */
    this.getTimelineFramesLength = function() {
        return _animationFrames;
    };

    /**
     * setTimelineFramesLength
     * @param {Int} length - frames length
     */
    this.setTimelineFramesLength = function(length) {
        _animationFrames = length;

        _timeFrameIncrement = (_endTimestamp-_initTimestamp)/_animationFrames;
    };

    /**
     * setTimelineTimestamp
     * @param {Int} frame
     */
    this.setTimelineTimestamp = function(ts) {
        _currentFrame = parseInt((ts-_initTimestamp)/_timeFrameIncrement);
    };

    /**
     * setFrame
     * @param {Int} frame
     */
    this.setFrame = function(frame) {
        _currentFrame = frame;
    };

    /**
     * getFrame
     * @returns {Int}
     */
    this.getFrame = function(frame) {
        return _currentFrame;
    };

    /**
     * play
     * @param {Bool} [loop=false]
     */
    this.playTimeline = function(loop) {
        _playAnimation = true;
        if(loop != undefined)
            _loop = loop;
    };

    /**
     * pause
     */
    this.pauseTimeline = function() {
        _playAnimation = false;
    };

    /**
     * onAnimationStep
     * @param {Callback} fn
     */
    this.onAnimationStep = function(fn) {
        _onAnimationStep = fn;
    };

    /**
     * onAnimationEnd
     * @param {Callback} fn
     */
    this.onAnimationEnd = function(fn) {
        _onAnimationEnd = fn;
    };

    /**
     * setOffset
     * @param {Float} offset
     */
    this.setOffset = function(offset) {
        OFFSET = offset;
    };

    /**
     * getNodesCount
     * @returns {Int}
     */
    this.getNodesCount = function() {
        return Object.keys(_nodesByName).length;
    };

    /**
     * getLinksCount
     * @returns {Int}
     */
    this.getLinksCount = function() {
        return Object.keys(_links).length;
    };

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
	 * @returns {Float}
	 */
	this.getSelectedId = function() {
		return selectedId;
	};

    /**
     *  enableHover
     */
    this.enableHover = function() {
        _enableHover = true;
        readPixel = true;
        comp_renderer_nodes.gpufG.enableGraphic(1);
    };

    /**
     *  enableAutoLink
     */
    this.enableAutoLink = function() {
        _enableAutoLink = true;
    };

    /**
     *  disableAutoLink
     */
    this.disableAutoLink = function() {
        _enableAutoLink = false;
    };

    /**
     * setFontsImage
     * @param {String} url
     */
    this.setFontsImage = function(url) {
        if(_enableFont == true) {
            var image = new Image();
            image.onload = (function() {
                comp_renderer_nodesText.setArg("fontsImg", (function(){return image;}).bind(this));
            }).bind(this);
            image.src = url;
        }
    };

    /**
     * enableFonts
     */
    this.enableFonts = function() {
        _enableFont = true;
    };

    /**
     * disableFonts
     */
    this.disableFonts = function() {
        _enableFont = false;
    };

    /**
     * setNodeMesh
     * @param {Mesh} mesh
     */
    this.setNodeMesh = function(mesh) {
        mesh_nodes = mesh;
    };

    /**
     * export
     */
    this.export = function() {
        var data = "[";
        var sep = "";
        for(var key in _nodesByName)
            data += sep+JSON.stringify(_nodesByName[key]), sep = ",", console.log(_nodesByName[key]);

        data += "]|[";
        sep = "";
        for(var key in _links)
            data += sep+JSON.stringify(_links[key]), sep = ",", console.log(_links[key]);

        data += "]";

        console.log(data);
    };

    /**
     * import
     */
    this.import = function(data) {
        var expl = data.split("|");
        var nodes = JSON.parse(expl[0]);
        var links = JSON.parse(expl[1]);

        for(var key in nodes) {
            var node = this.addNode({
                "name": nodes[key].name,
                "data": nodes[key].name,
                "label": nodes[key].label,
                "position": nodes[key].pos,
                "color": ((Math.floor(n%2) == 0.0) ? "../_RESOURCES/lena_128x128.jpg" : "../_RESOURCES/cartman08.jpg"),
                "layoutNodeArgumentData": {
                    // dir
                    "ndirect": [0.0, 0.0, 0.0, 1.0],
                    // pp
                    "particlePolarity": 0.0,
                    // destination
                    "dest": [0.0, 0.0, 0.0, 0.0],
                    // lifeDistance
                    "initPos": nodes[key].pos, "initDir": [0.0, 0.0, 0.0, 0.0],
                    // nodeColor
                    "nodeColor": [Math.random(), Math.random(), Math.random(), 1.0],
                    // lock
                    "nodeLock": 0.0},
                "onmouseup": (function(nodeData) {

                }).bind(this)});
        }
        this.updateNodes();

        for(var key in links) {
            var A = links[key].origin_nodeName;
            var B = links[key].target_nodeName;

            this.addLink({	"origin": A, "target": B, "directed": true});
        }
        this.updateLinks();
    };

    /**
     * loadRBFromFile
     * @param {String} fileurl
     * @param {Callback} [onload=undefined]
     * @param {Bool} [generateBornAndDieDates=false]
     * @param {Bool} [randomLinkWeights=false]
     */
    this.loadRBFromFile = function(fileurl, onload, generateBornAndDieDates, randomLinkWeights) {
        var req = new XHR();
        req.open("GET", fileurl, true);
        req.addEventListener("load", (function(onload, gbd, rlw, evt) {
            console.log("RB file Loaded");
            this.loadRBFromStr({"data": evt.target.responseText,
                                "generateBornAndDieDates": gbd,
                                "randomLinkWeights": rlw});

            if(onload != undefined) onload();
        }).bind(this, onload, generateBornAndDieDates, randomLinkWeights));

        req.addEventListener("error", (function(evt) {
            console.log(evt);
        }).bind(this));

        req.send(null);
    };

    /**
     * loadRBFromStr
     * @param {Object} jsonIn
     * @param {String} jsonIn.data
     * @param {Bool} [jsonIn.generateBornAndDieDates=false] -
     * @param {Bool} [jsonIn.randomLinkWeights=false] -
     */
    this.loadRBFromStr = function(jsonIn) {
        var _sourceText = jsonIn.data;
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


        var offs = 1000/2;
        for(var n = 0; n < rowCount; n++) {
            var pos = [-(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), 1.0];

            var bd = (jsonIn.generateBornAndDieDates != undefined && jsonIn.generateBornAndDieDates == true) ? {"bornDate": "RANDOM", "dieDate": "RANDOM"} : {"bornDate": 1.0, "dieDate": 0.0};

            var node = this.addNode({
                "name": n.toString(),
                "data": n.toString(),
                "label": n.toString(),
                "position": pos,
                "color": ((_enableNeuronalNetwork == false) ? "../_RESOURCES/UV.jpg" : "../_RESOURCES/white.jpg"),
                "bornDate": bd.bornDate,
                "dieDate": bd.dieDate,
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
                    "nodeColor": [1.0, 1.0, 1.0, 1.0],
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
        //console.log(str);
        var pointers = str.replace(/(\s|\t)+/gi, ' ').trim().split(" ");
        console.log(pointers);


        str = "";
        for(var n = startValues+tLinesPointers; n < startValues+tLinesPointers+tLinesRowIndices; n++) {
            str += lines[n];
        }
        //console.log(str);
        var rowIndices = str.replace(/(\s|\t)+/gi, ' ').trim().split(" ");
        console.log(rowIndices);



        var yy = 0;
        for(var n=0, fn = pointers.length; n < fn; n++) {
            var pointer = parseInt(pointers[n])-1;
            var nextPointer = parseInt(pointers[n+1])-1;

            for(var nb=0, fnb = nextPointer-pointer; nb < fnb; nb++) {
                var xx = parseInt(rowIndices[pointer+nb])-1;

                var bd = (jsonIn.generateBornAndDieDates != undefined && jsonIn.generateBornAndDieDates == true) ? {"bornDate": "RANDOM", "dieDate": "RANDOM"} : {"bornDate": 1.0, "dieDate": 0.0};
                var w = (jsonIn.randomLinkWeights != undefined && jsonIn.randomLinkWeights == true) ? "RANDOM" : null;

                this.addLink({	"origin": xx,
                    "target": yy,
                    "directed": true,
                    "bornDate": bd.bornDate,
                    "dieDate": bd.dieDate,
                    "weight": w});
            }

            yy++;
        }
        this.updateLinks();
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


    // ██████╗ ██████╗ ██╗   ██╗███████╗ ██████╗ ██████╗
    //██╔════╝ ██╔══██╗██║   ██║██╔════╝██╔═══██╗██╔══██╗
    //██║  ███╗██████╔╝██║   ██║█████╗  ██║   ██║██████╔╝
    //██║   ██║██╔═══╝ ██║   ██║██╔══╝  ██║   ██║██╔══██╗
    //╚██████╔╝██║     ╚██████╔╝██║     ╚██████╔╝██║  ██║
    // ╚═════╝ ╚═╝      ╚═════╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝
    /**
     * applyLayout
     * @param {Object} jsonIn
     * @param {String} jsonIn.argsDirection - example "float4* argA, float* argB, mat4 argC, float4 argD, float argE"
     * @param {String} jsonIn.codeDirection
     * @param {String} jsonIn.argsObject - example "float4* argA, float* argB, mat4 argC, float4 argD, float argE"
     * @param {String} jsonIn.codeObject
     */
    this.applyLayout = function(jsonIn) {
        var readPix = (function() {
            var arrayPick = new Uint8Array(4);
            var mousePos = _sce.getEvents().getMousePosition();
            _gl.readPixels(mousePos.x, (_sce.getCanvas().height-(mousePos.y)), 1, 1, _gl.RGBA, _gl.UNSIGNED_BYTE, arrayPick);

            var unpackValue = _utils.unpack([arrayPick[0]/255, arrayPick[1]/255, arrayPick[2]/255, arrayPick[3]/255]); // value from 0.0 to 1.0
            selectedId = Math.round(unpackValue*1000000.0)-1.0;
            //console.log("hoverId: "+selectedId);
            if(selectedId != -1 && selectedId < this.currentNodeId) {
                var node = _nodesById[selectedId];
                if(node != undefined && node.onmousedown != undefined)
                    node.onmousedown(node);

                if(node != undefined && _onClickNode != undefined)
                    _onClickNode(node);


                var arr4Uint8_XYZW = comp_renderer_nodes.gpufG.readArg("posXYZW");
                var x = arr4Uint8_XYZW[(_nodesById[selectedId].itemStart*4)];
                var y = arr4Uint8_XYZW[(_nodesById[selectedId].itemStart*4)+1];
                var z = arr4Uint8_XYZW[(_nodesById[selectedId].itemStart*4)+2];
                _initialPosDrag = $V3([x,y,z]);

                makeDrag(undefined, $V3([0.0, 0.0, 0.0]));
            }
        }).bind(this);

        // Create custom user arrays args
        var createCustomArgsArrays = (function(obj, arr) {
            for(var n=0, fn = arr.length; n < fn; n++) {
                obj[arr[n].trim().split(" ")[1]] = {"arg": arr[n].trim(),
                                                    "nodes_array_value": [],
                                                    "links_array_value": [],
                                                    "arrows_array_value": [],
                                                    "nodestext_array_value": []};
            }
            return obj;
        }).bind(this);

        var arrArgsDirection = (jsonIn.argsDirection != undefined) ? jsonIn.argsDirection.split(",") : null;
        var arrArgsObject = (jsonIn.argsObject != undefined) ? jsonIn.argsObject.split(",") : null;

        _customArgs = {};
        if(arrArgsDirection != null)
            _customArgs = createCustomArgsArrays(_customArgs, arrArgsDirection);

        if(arrArgsObject != null)
            _customArgs = createCustomArgsArrays(_customArgs, arrArgsObject);

        var varDef_VFPNode = {
            'float4* posXYZW': (function(){return null;}).bind(this),
            "float4* dataB": (function(){return null;}).bind(this), // in nodes (SHARED with LINKS, ARROWS & NODESTEXT)
            "float4* dataF": (function(){return null;}).bind(this), // in nodes
            "float4*attr data": (function(){return null;}).bind(this), // in nodes, nodesText, links & arrows
            "float4*attr dataC": (function(){return null;}).bind(this), // in links & arrows
            'float4*attr nodeVertexPos': (function(){return null;}).bind(this),
            'float4*attr nodeVertexNormal': (function(){return null;}).bind(this),
            'float4*attr nodeVertexTexture': (function(){return null;}).bind(this),
            'float*attr letterId': (function(){return null;}).bind(this),
            'float*attr nodeImgId': (function(){return null;}).bind(this),
            'indices': (function(){return null;}).bind(this),
            "float4* adjacencyMatrix": (function(){return null;}).bind(this),
            "float4* adjacencyMatrixB": (function(){return null;}).bind(this),
            "float widthAdjMatrix": (function(){return null;}).bind(this),
            'float nodesCount': (function(){return null;}).bind(this),
            "float currentTimestamp": (function(){return null;}).bind(this),
            'mat4 PMatrix': (function(){return null;}).bind(this),
            'mat4 cameraWMatrix': (function(){return null;}).bind(this),
            'mat4 nodeWMatrix': (function(){return null;}).bind(this),
            'float isNode': (function(){return null;}).bind(this),
            'float isLink': (function(){return null;}).bind(this),
            'float isArrow': (function(){return null;}).bind(this),
            'float isNodeText': (function(){return null;}).bind(this),
            'float bufferNodesWidth': (function(){return null;}).bind(this),
            'float bufferLinksWidth': (function(){return null;}).bind(this),
            'float bufferArrowsWidth': (function(){return null;}).bind(this),
            'float bufferTextsWidth': (function(){return null;}).bind(this),
            'float idToDrag': (function(){return null;}).bind(this),
            'float idToHover': (function(){return null;}).bind(this),
            'float efferentNode': (function(){return null;}).bind(this),
            'float efferentData': (function(){return null;}).bind(this),
            'float enableNeuronalNetwork': (function(){return null;}).bind(this),
            'float only2d': (function(){return null;}).bind(this),
            'float makeNetworkStep': (function(){return null;}).bind(this),
            'float nodeImgColumns': (function(){return null;}).bind(this),
            'float fontImgColumns': (function(){return null;}).bind(this),
            'float4* fontsImg': (function(){return null;}).bind(this),
            'float4* nodesImg': (function(){return null;}).bind(this),
            'float4* nodesImgCrosshair': (function(){return null;}).bind(this)
            };
        if(arrArgsDirection != null)
            for(var n=0; n < arrArgsDirection.length; n++)
                varDef_VFPNode[arrArgsDirection[n]] = (function(){return null;}).bind(this);

        if(arrArgsObject != null)
            for(var n=0; n < arrArgsObject.length; n++)
                varDef_VFPNode[arrArgsObject[n]] = (function(){return null;}).bind(this);


        var varDef_NodesKernel = {
            'float4* dir': (function(){return null;}).bind(this),
            "float enableForceLayout": (function(){return null;}).bind(this),
            'float performFL': (function(){return null;}).bind(this),
            'float enableForceLayoutCollision': (function(){return null;}).bind(this),
            'float enableForceLayoutRepulsion': (function(){return null;}).bind(this),
            'float nodesCount': (function(){return null;}).bind(this),
            'float enableDrag': (function(){return null;}).bind(this),
            'float initialPosX': (function(){return null;}).bind(this),
            'float initialPosY': (function(){return null;}).bind(this),
            'float initialPosZ': (function(){return null;}).bind(this),
            'float MouseDragTranslationX': (function(){return null;}).bind(this),
            'float MouseDragTranslationY': (function(){return null;}).bind(this),
            'float MouseDragTranslationZ': (function(){return null;}).bind(this)};



        ///////////////////////////////////////////////////////////////////////////////////////////
        //                          LINKS
        ///////////////////////////////////////////////////////////////////////////////////////////
        comp_renderer_links.setGPUFor(  comp_renderer_links.gl,
                                        Object.create(varDef_VFPNode),
                                        {"type": "GRAPHIC",
                                        "name": "LINKS_VFP_NODE",
                                        "viewSource": false,
                                        "config": new VFP_NODE(jsonIn.codeObject, _geometryLength).getSrc(),
                                        "drawMode": 1,
                                        "depthTest": true,
                                        "blend": false,
                                        "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
                                        "blendSrcMode": Constants.BLENDING_MODES.ONE,
                                        "blendDstMode": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA});
        comp_renderer_links.getComponentBufferArg("RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.GPU));

        ///////////////////////////////////////////////////////////////////////////////////////////
        //                          ARROWS
        ///////////////////////////////////////////////////////////////////////////////////////////
        comp_renderer_arrows.setGPUFor( comp_renderer_arrows.gl,
                                        Object.create(varDef_VFPNode),
                                        {"type": "GRAPHIC",
                                        "name": "ARROWS_VFP_NODE",
                                        "viewSource": false,
                                        "config": new VFP_NODE(jsonIn.codeObject, _geometryLength).getSrc(),
                                        "drawMode": 4,
                                        "depthTest": true,
                                        "blend": true,
                                        "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
                                        "blendSrcMode": Constants.BLENDING_MODES.SRC_ALPHA,
                                        "blendDstMode": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA});
        comp_renderer_arrows.getComponentBufferArg("RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.GPU));

        ///////////////////////////////////////////////////////////////////////////////////////////
        //                          NODES
        ///////////////////////////////////////////////////////////////////////////////////////////
        // NODES= nodeId, acums, bornDate, dieDate // LINKS & ARROWS= nodeId origin, nodeId target, currentLineVertex, repeatId
        // bornDate, dieDate, 0.0, 0.0 (NODES share TO LINKS & ARROWS)

        var nodesVarDef = Object.create(varDef_VFPNode);
        for (var key in varDef_NodesKernel)
            nodesVarDef[key] = varDef_NodesKernel[key];

        comp_renderer_nodes.setGPUFor(  comp_renderer_nodes.gl,
                                        nodesVarDef,
                                        {"type": "KERNEL",
                                        "name": "NODES_KERNEL_DIR",
                                        "viewSource": false,
                                        "config": new KERNEL_DIR(jsonIn.codeDirection, _geometryLength, _enableNeuronalNetwork).getSrc(),
                                        "drawMode": 4,
                                        "depthTest": true,
                                        "blend": false,
                                        "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
                                        "blendSrcMode": Constants.BLENDING_MODES.ONE,
                                        "blendDstMode": Constants.BLENDING_MODES.ONE},
                                        {"type": "KERNEL",
                                        "name": "NODES_KERNEL_ADJMATRIX_UPDATE",
                                        "viewSource": false,
                                        "config": new KERNEL_ADJMATRIX_UPDATE(_geometryLength).getSrc(),
                                        "drawMode": 4,
                                        "depthTest": true,
                                        "blend": false,
                                        "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
                                        "blendSrcMode": Constants.BLENDING_MODES.ONE,
                                        "blendDstMode": Constants.BLENDING_MODES.ONE},
                                        {"type": "GRAPHIC",
                                        "name": "NODES_VFP_NODE",
                                        "viewSource": false,
                                        "config": new VFP_NODE(jsonIn.codeObject, _geometryLength).getSrc(),
                                        "drawMode": 4,
                                        "depthTest": true,
                                        "blend": true,
                                        "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
                                        "blendSrcMode": Constants.BLENDING_MODES.SRC_ALPHA,
                                        "blendDstMode": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA},
                                        {"type": "GRAPHIC",
                                        "name": "NODES_VFP_NODEPICKDRAG",
                                        "viewSource": false,
                                        "config": new VFP_NODEPICKDRAG(_geometryLength).getSrc(),
                                        "drawMode": 4,
                                        "depthTest": true,
                                        "blend": true,
                                        "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
                                        "blendSrcMode": Constants.BLENDING_MODES.ONE,
                                        "blendDstMode": Constants.BLENDING_MODES.ZERO});
        var comp_screenEffects = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.GPU);
        comp_renderer_nodes.getComponentBufferArg("RGB", comp_screenEffects);
        // KERNEL_DIR
        comp_renderer_nodes.gpufG.onPreProcessKernel(0, (function() {
            var currentTimestamp = _initTimestamp+(_currentFrame*_timeFrameIncrement);
            comp_renderer_nodes.setArg("currentTimestamp", (function(ts) {return ts;}).bind(this, currentTimestamp));
            comp_renderer_links.setArg("currentTimestamp", (function(ts) {return ts;}).bind(this, currentTimestamp));
            comp_renderer_arrows.setArg("currentTimestamp", (function(ts) {return ts;}).bind(this, currentTimestamp));

            if(_makeNetworkStep == true) {
                _makeNetworkStep = false;
                comp_renderer_nodes.setArg("makeNetworkStep", (function() {return 1.0;}).bind(this));
            }

            if(_playAnimation == true) {
                _currentFrame++;
                if(_onAnimationStep != undefined)
                    _onAnimationStep(_currentFrame);

                if(_currentFrame == _animationFrames) {
                    _currentFrame = 0;
                    if(_loop == false) {
                        this.pauseTimeline();
                        if(_onAnimationEnd != undefined)
                            _onAnimationEnd();
                    }
                }
                //console.log(currentTimestamp+"  "+_currentFrame);
            }

            if(this.currentNodeId > 0 && _enabledForceLayout == true) {
                comp_renderer_nodes.setArg("nodesCount", (function() {return this.currentNodeId;}).bind(this));
                comp_renderer_links.setArg("nodesCount", (function() {return this.currentNodeId;}).bind(this));
                comp_renderer_arrows.setArg("nodesCount", (function() {return this.currentNodeId;}).bind(this));

                comp_renderer_nodes.setArg("performFL", (function() {return 0;}).bind(this));
            }

            comp_renderer_nodes.setArg("enableNeuronalNetwork", (function() {return _enableNeuronalNetwork;}).bind(this));
            comp_renderer_nodes.setArg("only2d", (function() {return ((_only2d==true)?1.0:0.0);}).bind(this));
        }).bind(this));
        comp_renderer_nodes.gpufG.onPostProcessKernel(0, (function() {
            comp_renderer_nodes.setArg("makeNetworkStep", (function() {return 0.0;}).bind(this));
        }).bind(this));

        // KERNEL_ADJMATRIX_UPDATE
        comp_renderer_nodes.gpufG.onPostProcessKernel(1, (function() {
            comp_renderer_nodes.gpufG.disableKernel(1);
        }).bind(this));
        comp_renderer_nodes.gpufG.disableKernel(1);


        // VFP_NODE
        comp_renderer_nodes.gpufG.onPreProcessGraphic(0, (function() {

        }).bind(this));

        // VFP_NODEPICKDRAG
        comp_renderer_nodes.gpufG.onPreProcessGraphic(1, (function() {
            comp_renderer_nodes.gl.clear(comp_renderer_nodes.gl.COLOR_BUFFER_BIT | comp_renderer_nodes.gl.DEPTH_BUFFER_BIT);
        }).bind(this));
        comp_renderer_nodes.gpufG.onPostProcessGraphic(1, (function() {
            if(_enableHover == false) {
                if(readPixel == true) {
                    readPixel = false;

                    readPix();

                    comp_renderer_nodes.gpufG.disableGraphic(1);
                }
            } else {
                var comp_controller_trans_target = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.CONTROLLER_TRANSFORM_TARGET);
                if(comp_controller_trans_target.isLeftBtnActive() == true) {
                    readPixel = false;
                }

                readPix();

                if(comp_controller_trans_target.isLeftBtnActive() == true) {
                    comp_renderer_nodes.gpufG.disableGraphic(1);
                }
            }
        }).bind(this));

        comp_renderer_nodes.gpufG.disableGraphic(1);



        ///////////////////////////////////////////////////////////////////////////////////////////
        //                          NODESTEXT
        ///////////////////////////////////////////////////////////////////////////////////////////
        if(_enableFont == true) {
            comp_renderer_nodesText.setGPUFor(  comp_renderer_nodesText.gl,
                                                Object.create(varDef_VFPNode),
                                                {"type": "GRAPHIC",
                                                "name": "NODESTEXT_VFP_NODE",
                                                "viewSource": false,
                                                "config": new VFP_NODE(jsonIn.codeObject, _geometryLength).getSrc(),
                                                "drawMode": 4,
                                                "depthTest": true,
                                                "blend": true,
                                                "blendEquation": Constants.BLENDING_EQUATION_TYPES.FUNC_ADD,
                                                "blendSrcMode": Constants.BLENDING_MODES.SRC_ALPHA,
                                                "blendDstMode": Constants.BLENDING_MODES.ONE_MINUS_SRC_ALPHA});
            comp_renderer_nodesText.getComponentBufferArg("RGB", _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.GPU));
        }

        enableHov(-1);
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
        if(_enableFont == true)
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
     *  enableNeuronalNetwork
     */
    this.enableNeuronalNetwork = function() {
        _enableNeuronalNetwork = true;

        this.disableAutoLink();

        // APPLY THIS LAYOUT
        this.applyLayout({
            // DIRECTION
            "argsDirection":
                // destination
                "float4* dest,float* enableDestination",
            "codeDirection":
                // destination
                'if(enableDestination[x] == 1.0) {\n'+
                    'vec3 destinationPos = dest[x].xyz;\n'+
                    'vec3 dirDestination = normalize(destinationPos-currentPos);\n'+
                    'float distan = abs(distance(currentPos,destinationPos));\n'+
                    'float dirDestWeight = sqrt(distan);\n'+
                    'currentDir = (currentDir+(dirDestination*dirDestWeight))*dirDestWeight*0.1;\n'+
                '}\n',

            // OBJECT
            "argsObject":
                // nodeColor
                "float4*attr nodeColor",
            "codeObject":
                // nodeColor
                //'if(isNode == 1.0) nodeVertexColor = nodeColor[x];'+
                //'if(isLink == 1.0 && currentLineVertex == 1.0) nodeVertexColor = vec4(0.0, 1.0, 0.0, 1.0);'+ // this is isTarget for arrows

                //'float degr = (currentLineVertex/vertexCount)/2.0;'+
                'if(isLink == 1.0) nodeVertexColor = vec4(0.3, 0.2, 0.2, 1.0);'+ // this is isTarget for arrows
                'if(isArrow == 1.0 && currentLineVertex == 1.0) nodeVertexColor = vec4(0.3, 0.2, 0.2, 1.0);'+ // this is isTarget for arrows
                'if(isArrow == 1.0 && currentLineVertex == 0.0) nodeVertexColor = vec4(1.0, 0.0, 0.0, 0.0);' // this is isTarget for arrows

        });
        this.enableForceLayout();
    };

    /**
     *  disableNeuronalNetwork
     */
    this.disableNeuronalNetwork = function() {
        _enableNeuronalNetwork = false;
    };

    /**
     *  only2d
     *  @param {boolean} mode2d
     */
    this.only2d = function(mode2d) {
        _only2d = mode2d;
    };

    /**
     * addNeuron
     * @param {String} neuronName
     * @param {Array<Float4>} [destination=[0.0, 0.0, 0.0, 1.0]]
     */
    this.addNeuron = function(neuronName, destination) {
        var pos = [-(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), 1.0];
        var dest = (destination != undefined) ? destination : [0.0, 0.0, 0.0, 1.0];
        var enableDest = (destination != undefined) ? 1.0 : 0.0;

        graph.addNode({
            "name": neuronName,
            "data": neuronName,
            "label": neuronName.toString(),
            "position": pos,
            "color": "../_RESOURCES/white.jpg",
            "layoutNodeArgumentData": {
                "nodeColor": [1.0, 1.0, 1.0, 1.0],
                "enableDestination": enableDest,
                "dest": dest
            },
            "onmouseup": (function(nodeData) {

            }).bind(this)});
    };

    /**
     * addSinapsis
     * @param {String} neuronNameA
     * @param {String} neuronNameB
     * @param {Float} [linkMultiplier=1.0]
     * @param {Float} [activationFunc=0.0] 0.0=linkWeight*data*multiplier 1.0=data*multiplier
     */
    this.addSinapsis = function(neuronNameA, neuronNameB, linkMultiplier, activationFunc) {
        var _linkMultiplier = (linkMultiplier != undefined) ? linkMultiplier : 1.0;
        var _activationFunc = (activationFunc != undefined) ? activationFunc : 0.0;
        graph.addLink({
        	"origin": neuronNameA,
            "target": neuronNameB,
            "directed": true,
            "weight": 0.5,
            "linkMultiplier": _linkMultiplier,
            "activationFunc": _activationFunc});
    };

    /**
     * setAfferentData
     * @param {Object} jsonIn
     */
    this.setAfferentData = function(jsonIn) {
        for(var n=0; n < (this.arrayNodeData.length/4); n++) {
            var id = n*4;
            this.arrayNodeDataB[id+2] = disabVal;
        }

        for(var neuronName in jsonIn) {
            var node = _nodesByName[neuronName];

            for(var n=0; n < (this.arrayNodeData.length/4); n++) {
                var id = n*4;
                if(this.arrayNodeData[n*4] == node.nodeId) {
                    // (ts.bornDate, ts.dieDate, disabVal, 0.5); // bornDate, dieDate, networkWaitData, networkProcData(error)
                    this.arrayNodeDataB[id+2] = jsonIn[neuronName];
                }
            }
        }
        comp_renderer_nodes.setArg("dataB", (function() {return this.arrayNodeDataB;}).bind(this));
    };

    /**
     * setEfferentData
     * @param {Object} jsonIn
     */
    this.setEfferentData = function(jsonIn) {
        for(var neuronName in jsonIn) {
            comp_renderer_nodes.setArg("efferentNode", (function() {return _nodesByName[neuronName].nodeId;}).bind(this));
            comp_renderer_nodes.setArg("efferentData", (function() {return jsonIn[neuronName];}).bind(this));
        }
    };

    this.train = function() {
        comp_renderer_nodes.gpufG.enableKernel(1);
    };

    this.getNeuronOutput = function(neuronName) {
        var arr4Uint8_XYZW = comp_renderer_nodes.gpufG.readArg("dataB");

        var n = (_nodesByName[neuronName].itemStart*4);
        return [arr4Uint8_XYZW[n], arr4Uint8_XYZW[n+1], arr4Uint8_XYZW[n+2], arr4Uint8_XYZW[n+3]];
    };

    this.makeNetworkStep = function() {
        _makeNetworkStep = true;
    };

    var currHiddenNeuron = 0;
    var nodSep = 5.0;
    this.createNeuronLayer = function(numX, numY, pos) {
        var arr = [];
        for(var x=0; x < numX; x++) {
            for(var y=0; y < numY; y++) {
                var position = [pos[0]+((x-(numX/2))*nodSep), pos[1], pos[2]+((y-(numY/2))*nodSep), pos[3]];

                this.addNeuron(currHiddenNeuron, position);
                arr.push(currHiddenNeuron);
                currHiddenNeuron++;
            }
        }

        return arr;
    };
    this.connectNeuronWithNeuronLayer = function(neuron, neuronLayer) {
        for(var n=0; n < neuronLayer.length; n++)
            this.addSinapsis(neuron, neuronLayer[n]);
    };
    this.connectNeuronLayerWithNeuron = function(neuronLayer, neuron) {
        for(var n=0; n < neuronLayer.length; n++)
            this.addSinapsis(neuronLayer[n], neuron);
    };
    this.connectNeuronLayerWithNeuronLayer = function(neuronLayerOrigin, neuronLayerTarget) {
        for(var n=0; n < neuronLayerOrigin.length; n++) {
            var neuronOrigin = neuronLayerOrigin[n];
            this.connectNeuronWithNeuronLayer(neuronOrigin, neuronLayerTarget);
        }
    };

    this.createConvXYNeuronsFromXYNeurons = function(pos, w, h, idOrigin, idTarget, convMatrix) {
        var arr = [];
        for(var x=0; x < w-2; x++) {
            for(var y=0; y < h-2; y++) {
                var position = [pos[0]+((y-(w/2))*nodSep), pos[1], pos[2]+((x-(h/2))*nodSep), pos[3]];

                this.addNeuron(idTarget+x+"_"+y, position);
                arr.push(idTarget+x+"_"+y);

                var idConvM = 0;
                for(var xa=x; xa < x+3; xa++) {
                    for(var ya=y; ya < y+3; ya++) {
                        this.addSinapsis(idOrigin+xa+"_"+ya, idTarget+x+"_"+y, convMatrix[idConvM]);
                        idConvM++;
                    }
                }
            }
        }

        return arr;
    };
    this.createXYNeuronsFromImage = function(id, pos, w, h) {
        var arr = [];
        for(var x=0; x < w; x++) {
            for(var y=0; y < h; y++) {
                var position = [pos[0]+((y-(w/2))*nodSep), pos[1], pos[2]+((x-(h/2))*nodSep), pos[3]];

                this.addNeuron(id+x+"_"+y, position);
                arr.push(id+x+"_"+y);
            }
        }

        return arr;
    };

    /**
     * setLayoutNodeArgumentData
     * @param {Object} jsonIn
     * @param {String} [jsonIn.nodeName=undefined] - If undefined then value is setted in all nodes
     * @param {String} jsonIn.argName
     * @param {Float|Array<Float4>} jsonIn.value
     * @param {boolean} jsonIn.update
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
                if(_customArgs[jsonIn.argName]["nodes_array_value"][id] == undefined && jsonIn.update == false) {
                    if(type == "float")
                        setVal(type, jsonIn.argName, "nodes_array_value", n, 0.0);
                    else
                        setVal(type, jsonIn.argName, "nodes_array_value", n, [0.0,0.0,0.0,0.0]);
                }
            }
        }
        comp_renderer_nodes.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].nodes_array_value;}).bind(this));

        // link id
        for(var n=0; n < (this.arrayLinkData.length/4); n++) {
            if(jsonIn.nodeName == undefined || (jsonIn.nodeName != undefined && this.arrayLinkData[n*4] == node.nodeId))
                setVal(type, jsonIn.argName, "links_array_value", n, jsonIn.value);
            else {
                var id = (type == "float") ? n : n*4;
                if(_customArgs[jsonIn.argName]["links_array_value"][id] == undefined && jsonIn.update == false) {
                    if(type == "float")
                        setVal(type, jsonIn.argName, "links_array_value", n, 0.0);
                    else
                        setVal(type, jsonIn.argName, "links_array_value", n, [0.0,0.0,0.0,0.0]);
                }
            }
        }
        comp_renderer_links.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].links_array_value;}).bind(this));

        // arrow id
        for(var n=0; n < (this.arrayArrowData.length/4); n++) {
            if(jsonIn.nodeName == undefined || (jsonIn.nodeName != undefined && this.arrayArrowData[n*4] == node.nodeId))
                setVal(type, jsonIn.argName, "arrows_array_value", n, jsonIn.value);
            else {
                var id = (type == "float") ? n : n*4;
                if(_customArgs[jsonIn.argName]["arrows_array_value"][id] == undefined && jsonIn.update == false) {
                    if(type == "float")
                        setVal(type, jsonIn.argName, "arrows_array_value", n, 0.0);
                    else
                        setVal(type, jsonIn.argName, "arrows_array_value", n, [0.0,0.0,0.0,0.0]);
                }
            }
        }
        comp_renderer_arrows.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].arrows_array_value;}).bind(this));

        if(_enableFont == true) {
            // nodeText id
            for(var n=0; n < (this.arrayNodeTextData.length/4); n++) {
                var id = n;
                if(jsonIn.nodeName == undefined || (jsonIn.nodeName != undefined && this.arrayNodeTextData[n*4] == node.nodeId))
                    setVal(type, jsonIn.argName, "nodestext_array_value", n, jsonIn.value);
                else {
                    var id = (type == "float") ? n : n*4;
                    if(_customArgs[jsonIn.argName]["nodestext_array_value"][id] == undefined && jsonIn.update == false) {
                        if(type == "float")
                            setVal(type, jsonIn.argName, "nodestext_array_value", n, 0.0);
                        else
                            setVal(type, jsonIn.argName, "nodestext_array_value", n, [0.0,0.0,0.0,0.0]);
                    }
                }
            }
            comp_renderer_nodesText.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].nodestext_array_value;}).bind(this));
        }
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
        comp_renderer_nodes.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].nodes_array_value;}).bind(this));


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
        comp_renderer_links.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].links_array_value;}).bind(this));

        // arrows
        _customArgs[jsonIn.argName].arrows_array_value = [];
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
        comp_renderer_arrows.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].arrows_array_value;}).bind(this));

        // nodestext
        if(_enableFont == true) {
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
            comp_renderer_nodesText.setArg(jsonIn.argName, (function() {return _customArgs[jsonIn.argName].nodestext_array_value;}).bind(this));
        }
    };

	/**
	 * @private
	 * @param {MouseMoveEvent} [evt]
	 * @param {StormV3} dir
	 */
	var makeDrag = function(evt, dir) {
        /**
         * enableDrag
         * @param {Int} selectedId
         * @param {StormV3} dir
         * @private
         */
        var enableDrag = (function(selectedId, dir) {
            var comp_projection = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION);
            var finalPos = _initialPosDrag.add(dir.x((comp_projection.getFov()*2.0)/_sce.getCanvas().width));

            comp_renderer_nodes.setArg("enableDrag", (function() {return 1;}).bind(this));
            comp_renderer_nodes.setArg("idToDrag", (function() {return selectedId;}).bind(this));
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

            if(_enableFont == true) {
                comp_renderer_nodesText.setArg("enableDrag", (function() {return 1;}).bind(this));
                comp_renderer_nodesText.setArg("idToDrag", (function() {return selectedId;}).bind(this));
                comp_renderer_nodesText.setArg("MouseDragTranslationX", (function() {return finalPos.e[0];}).bind(this));
                comp_renderer_nodesText.setArg("MouseDragTranslationY", (function() {return finalPos.e[1];}).bind(this));
                comp_renderer_nodesText.setArg("MouseDragTranslationZ", (function() {return finalPos.e[2];}).bind(this));
                comp_renderer_nodesText.setArg("initialPosX", (function() {return _initialPosDrag.e[0];}).bind(this));
                comp_renderer_nodesText.setArg("initialPosY", (function() {return _initialPosDrag.e[1];}).bind(this));
                comp_renderer_nodesText.setArg("initialPosZ", (function() {return _initialPosDrag.e[2];}).bind(this));
            }
        }).bind(this);
        /**
         * disableDrag
         * @private
         */
        var disableDrag = (function() {
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

            if(_enableFont == true) {
                comp_renderer_nodesText.setArg("enableDrag", (function() {return 0;}).bind(this));
                comp_renderer_nodesText.setArg("idToDrag", (function() {return 0;}).bind(this));
                comp_renderer_nodesText.setArg("MouseDragTranslationX", (function() {return 0;}).bind(this));
                comp_renderer_nodesText.setArg("MouseDragTranslationY", (function() {return 0;}).bind(this));
                comp_renderer_nodesText.setArg("MouseDragTranslationZ", (function() {return 0;}).bind(this));
            }
        }).bind(this);


		var comp_controller_trans_target = _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.CONTROLLER_TRANSFORM_TARGET);

        if(_enableHover == false) {
            if(comp_controller_trans_target.isLeftBtnActive() == true) {
                if(selectedId == -1)
                    disableDrag();
                else
                    enableDrag(selectedId, dir), console.log("selectedId: "+selectedId);
            }
        } else {
            if(comp_controller_trans_target.isLeftBtnActive() == true) {
                enableHov(-1);

                if(selectedId == -1)
                    disableDrag();
                else
                    enableDrag(selectedId, dir), console.log("selectedId: "+selectedId);
            } else {
                enableHov(selectedId);
            }
        }
	};

    /**
     * enableHov
     * @param {int} selectedId
     * @private
     */
    var enableHov = function(selectedId) {
        comp_renderer_nodes.setArg("idToHover", (function() {return selectedId;}).bind(this));
        comp_renderer_links.setArg("idToHover", (function() {return selectedId;}).bind(this));
        comp_renderer_arrows.setArg("idToHover", (function() {return selectedId;}).bind(this));
        if(_enableFont == true) {
            comp_renderer_nodesText.setArg("idToHover", (function() {return selectedId;}).bind(this));
        }
    };























    // █████╗ ██████╗ ██████╗     ███╗   ██╗ ██████╗ ██████╗ ███████╗
    //██╔══██╗██╔══██╗██╔══██╗    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝
    //███████║██║  ██║██║  ██║    ██╔██╗ ██║██║   ██║██║  ██║█████╗
    //██╔══██║██║  ██║██║  ██║    ██║╚██╗██║██║   ██║██║  ██║██╔══╝
    //██║  ██║██████╔╝██████╔╝    ██║ ╚████║╚██████╔╝██████╔╝███████╗
    //╚═╝  ╚═╝╚═════╝ ╚═════╝     ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝
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
    * @param {String} [jsonIn.label=undefined] - Label to show
	* @param {String} [jsonIn.data=""] - Custom data associated to this node
	* @param {Array<Float4>} [jsonIn.position=new Array(Math.Random(), Math.Random(), Math.Random(), 1.0)] - Position of node
	* @param {String} [jsonIn.color=undefined] - URL of image
    * @param {Float|String|Datetime} [jsonIn.bornDate=undefined] - Float timestamp, "RANDOM" or "24-Nov-2009 17:57:35"
    * @param {Float|String|Datetime} [jsonIn.dieDate=undefined] - Float timestamp, "RANDOM" or "24-Nov-2009 17:57:35"
	* @param {LayoutNodeData} [jsonIn.layoutNodeArgumentData=undefined] - Data for the custom layout
	* @param {Graph~addNode~onmousedown} [jsonIn.onmousedown=undefined] - Event when mousedown
	* @param {Graph~addNode~onmouseup} [jsonIn.onmouseup=undefined] - Event when mouseup
	* @returns {String} - Name of node
	 */
	this.addNode = function(jsonIn) {
		if(_nodesByName.hasOwnProperty(jsonIn.name) == false) {
			var node = createNode(jsonIn);
			_nodesByName[jsonIn.name] = node;
			_nodesById[node.nodeId] = node;

            if(node.label != undefined && _enableFont == true)
                createNodeText(node);

			console.log("%cnode "+(Object.keys(_nodesByName).length)+" ("+jsonIn.name+")", "color:green");

			return jsonIn.name;
		} else {
			console.log("node "+jsonIn.name+" already exists");
			return false;
		}
	};

    /**
     * @param {Object} jsonIn
     * @param {Array<Float4>} [jsonIn.position=[Math.Random(), Math.Random(), Math.Random(), 1.0]] - Position of node
     * @param {LayoutNodeData} [jsonIn.layoutNodeArgumentData=undefined]
     * @returns {Object}
     * @private
     */
    var createNode = (function(jsonIn) {
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

            var ts = getBornDieTS(jsonIn.bornDate, jsonIn.dieDate);
            this.arrayNodeData.push(this.currentNodeId, 0.0, ts.bornDate, ts.dieDate);
            this.arrayNodeDataB.push(ts.bornDate, ts.dieDate, disabVal, disabVal); // bornDate, dieDate, networkWaitData, networkProcData
            this.arrayNodeDataF.push(disabVal, 0.0, 0.0, 0.0); // efferenceData, null, null, null
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

        var maxNodeIndexId = 0;
        for(var n=0; n < mesh_nodes.indexArray.length; n++) {
            var idxIndex = n;

            this.arrayNodeIndices.push(this.startIndexId+mesh_nodes.indexArray[idxIndex]);

            if(mesh_nodes.indexArray[idxIndex] > maxNodeIndexId)
                maxNodeIndexId = mesh_nodes.indexArray[idxIndex];
        }
        this.startIndexId += (maxNodeIndexId+1);


        this.currentNodeId++; // augment node id

        jsonIn.nodeId = this.currentNodeId-1;
        jsonIn.itemStart = nAIS;// nodeArrayItemStart
        return jsonIn;
    }).bind(this);

    /** @private */
    var createNodeText = (function(jsonIn) {
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

        for(var i = 0; i < nodesTextPlanes; i++) {
            var letterId = null;
            if(jsonIn.label != undefined && jsonIn.label[i] != undefined)
                letterId = getLetterId(jsonIn.label[i].toUpperCase());
            if(letterId == undefined)
                letterId = getLetterId(" ");

            for(var n=0; n < mesh_nodesText.vertexArray.length/4; n++) {
                var idxVertex = n*4;

                this.arrayNodeTextData.push(jsonIn.nodeId, 0.0, 0.0, 0.0);
                this.arrayNodeTextPosXYZW.push(0.0, 0.0, 0.0, 1.0);
                this.arrayNodeTextVertexPos.push(mesh_nodesText.vertexArray[idxVertex]+(i*5), mesh_nodesText.vertexArray[idxVertex+1], mesh_nodesText.vertexArray[idxVertex+2], 1.0);
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

                this.nodeTextArrayItemStart++;
            }
        }
        var maxNodeIndexId = 0;
        for(var i = 0; i < nodesTextPlanes; i++) {
            for(var n=0; n < mesh_nodesText.indexArray.length; n++) {
                var idxIndex = n;

                var b = (i*4); // 4 = indices length of quad (0, 1, 2, 0, 2, 3)
                var ii = (mesh_nodesText.indexArray[idxIndex]+b);

                this.arrayNodeTextIndices.push(this.startIndexId_nodestext+ii);

                if(ii > maxNodeIndexId)
                    maxNodeIndexId = ii;
            }

        }
        this.startIndexId_nodestext += (maxNodeIndexId+1);

        this.currentNodeTextId++; // augment node id
    }).bind(this);

    /**
     * setNodesImage
     * @private
     * @param {String} url
     * @param {Int} locationIdx
     */
    var setNodesImage = (function(url, locationIdx) {
        var get2Dfrom1D = function(/*Int*/ idx, /*Int*/ columns) {
            var n = idx/columns;
            var row = parseFloat(parseInt(n));
            var col = new Utils().fract(n)*columns;

            return {"col": col,
                "row": row};
        }

        if(nodesImgMaskLoaded == false) {
            nodesImgMask = new Image();
            nodesImgMask.onload = (function(url, locationIdx) {
                nodesImgMaskLoaded = true;
                setNodesImage(url, locationIdx);
            }).bind(this, url, locationIdx);
            nodesImgMask.src = sceDirectory+"/Prefabs/Graph/nodesImgMask.png";
        } else if(nodesImgCrosshairLoaded == false) {
            nodesImgCrosshair = new Image();
            nodesImgCrosshair.onload = (function(url, locationIdx) {
                nodesImgCrosshairLoaded = true;
                setNodesImage(url, locationIdx);
            }).bind(this, url, locationIdx);
            nodesImgCrosshair.src = sceDirectory+"/Prefabs/Graph/nodesImgCrosshair.png";
        } else {
            if(_makingNodesImg == false) {
                _makingNodesImg = true;

                var image = new Image();
                image.onload = (function(nodesImgMask, nodesImgCrosshair, locationIdx) {
                    // draw userImg on temporal canvas reducing the thumb size
                    ctxNodeImgTMP.clearRect(0, 0, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH);
                    var quarter = NODE_IMG_SPRITE_WIDTH/4;
                    ctxNodeImgTMP.drawImage(image, 0, 0, image.width, image.height, quarter, quarter, NODE_IMG_SPRITE_WIDTH/2, NODE_IMG_SPRITE_WIDTH/2);

                    // apply mask to thumb image
                    new Utils().getImageFromCanvas(canvasNodeImgTMP, (function(nodesImgMask, nodesImgCrosshair, locationIdx, img) {
                        var newImgData = new Utils().getUint8ArrayFromHTMLImageElement( img );


                        var datMask = new Utils().getUint8ArrayFromHTMLImageElement(nodesImgMask);
                        for(var n=0; n < datMask.length/4; n++) {
                            var idx = n*4;
                            if(newImgData[idx+3] > 0) newImgData[idx+3] = datMask[idx+3];
                        }
                        new Utils().getImageFromCanvas( new Utils().getCanvasFromUint8Array(newImgData, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH), (function(locationIdx, imgB) {
                            // draw thumb image on atlas & update the 'nodesImg' argument
                            var loc = get2Dfrom1D(locationIdx, NODE_IMG_COLUMNS);
                            ctxNodeImg.drawImage(imgB, loc.col*NODE_IMG_SPRITE_WIDTH, loc.row*NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH);

                            new Utils().getImageFromCanvas(canvasNodeImg, (function(imgAtlas) {
                                comp_renderer_nodes.setArg("nodesImg", (function(){return imgAtlas;}).bind(this));
                            }).bind(this));
                        }).bind(this, locationIdx));


                        var datCrosshair = new Utils().getUint8ArrayFromHTMLImageElement(nodesImgCrosshair);
                        for(var n=0; n < datCrosshair.length/4; n++) {
                            var idx = n*4;

                            newImgData[idx] = ((datCrosshair[idx]*datCrosshair[idx+3]) + (newImgData[idx]*(255-datCrosshair[idx+3])))/255;
                            newImgData[idx+1] =( (datCrosshair[idx+1]*datCrosshair[idx+3]) + (newImgData[idx+1]*(255-datCrosshair[idx+3])))/255;
                            newImgData[idx+2] = ((datCrosshair[idx+2]*datCrosshair[idx+3]) + (newImgData[idx+2]*(255-datCrosshair[idx+3])))/255;
                            newImgData[idx+3] = ((datCrosshair[idx+3]*datCrosshair[idx+3]) + (newImgData[idx+3]*(255-datCrosshair[idx+3])))/255;
                        }
                        new Utils().getImageFromCanvas( new Utils().getCanvasFromUint8Array(newImgData, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH), (function(locationIdx, imgB) {
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
                        }).bind(this, locationIdx));

                    }).bind(this, nodesImgMask, nodesImgCrosshair, locationIdx));

                }).bind(this, nodesImgMask, nodesImgCrosshair, locationIdx);
                image.src = url;
            } else {
                _stackNodesImg.push({	"url": url,
                    "locationIdx": locationIdx});
            }
        }
    }).bind(this);

    // █████╗ ██████╗ ██████╗     ██╗     ██╗███╗   ██╗██╗  ██╗
    //██╔══██╗██╔══██╗██╔══██╗    ██║     ██║████╗  ██║██║ ██╔╝
    //███████║██║  ██║██║  ██║    ██║     ██║██╔██╗ ██║█████╔╝
    //██╔══██║██║  ██║██║  ██║    ██║     ██║██║╚██╗██║██╔═██╗
    //██║  ██║██████╔╝██████╔╝    ███████╗██║██║ ╚████║██║  ██╗
    //╚═╝  ╚═╝╚═════╝ ╚═════╝     ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
    /**
     * Create new node for the graph
     * @param {Object} jsonIn
     * @param {String} jsonIn.origin - NodeName Origin for this link
     * @param {String} jsonIn.target - NodeName Target for this link
     * @param {boolean} [jsonIn.directed=false] - Default false=bidir
     * @param {Float|String} [jsonIn.weight=1.0] - Float weight or "RANDOM"
     * @param {Float} [jsonIn.linkMultiplier=1.0]
     * @param {Float} [jsonIn.activationFunc=0.0] 0.0=linkWeight*data*multiplier 1.0=data*multiplier
     * @param {Float|String|Datetime} [jsonIn.bornDate=undefined] - Float timestamp, "RANDOM" or "24-Nov-2009 17:57:35"
     * @param {Float|String|Datetime} [jsonIn.dieDate=undefined] - Float timestamp, "RANDOM" or "24-Nov-2009 17:57:35"
     */
    this.addLink = function(jsonIn) {
        var pass = true;

        if(_nodesByName[jsonIn.origin] == undefined)
            console.log("%clink "+jsonIn.origin+"->"+jsonIn.target+". Node "+jsonIn.origin+" not exists", "color:red"), pass=false;

        if(_nodesByName[jsonIn.target] == undefined)
            console.log("%clink "+jsonIn.origin+"->"+jsonIn.target+". Node "+jsonIn.target+" not exists", "color:red"), pass=false;

        if(jsonIn.origin == jsonIn.target && _enableAutoLink == false)
            console.log("%cDiscarting autolink "+jsonIn.origin+"->"+jsonIn.target, "color:orange"), pass=false;

        if(pass == true) {
            console.log("%clink "+jsonIn.origin+"->"+jsonIn.target, "color:green");

            jsonIn.origin_nodeName = jsonIn.origin.toString();
            jsonIn.target_nodeName = jsonIn.target.toString();
            jsonIn.origin_nodeId = _nodesByName[jsonIn.origin].nodeId;
            jsonIn.target_nodeId = _nodesByName[jsonIn.target].nodeId;
            jsonIn.origin_itemStart = _nodesByName[jsonIn.origin].itemStart;
            jsonIn.target_itemStart = _nodesByName[jsonIn.target].itemStart;
            jsonIn.origin_layoutNodeArgumentData = _nodesByName[jsonIn.origin].layoutNodeArgumentData;
            jsonIn.target_layoutNodeArgumentData = _nodesByName[jsonIn.target].layoutNodeArgumentData;

            var ts = getBornDieTS(jsonIn.bornDate, jsonIn.dieDate);
            jsonIn.bornDate = ts.bornDate;
            jsonIn.dieDate = ts.dieDate;

            jsonIn.weight = (jsonIn.weight != undefined && jsonIn.weight.constructor===String) ? Math.random() : (jsonIn.weight||1.0);
            jsonIn.linkMultiplier = (jsonIn.linkMultiplier != null) ? jsonIn.linkMultiplier : 1.0;
            jsonIn.activationFunc = (jsonIn.activationFunc != null) ? jsonIn.activationFunc : 0.0;

            var repeatId = 1;
            while(true) {
                var exists = _links.hasOwnProperty(jsonIn.origin+"->"+jsonIn.target+"_"+repeatId) || _links.hasOwnProperty(jsonIn.target+"->"+jsonIn.origin+"_"+repeatId);
                if(exists == true) {
                    repeatId++;
                } else
                    break;
            }
            jsonIn.repeatId = repeatId;

            jsonIn = createLink(jsonIn);

            if(jsonIn.directed != undefined && jsonIn.directed == true)
                createArrow(jsonIn);

            // ADD LINK TO ARRAY LINKS
            _links[jsonIn.origin+"->"+jsonIn.target+"_"+repeatId] = jsonIn;
            //console.log("link "+jsonIn.origin+"->"+jsonIn.target);


            // UPDATE arrayNodeData
            for(var n=0; n < (this.arrayNodeData.length/4); n++) {
                var id = n*4;
                if(this.arrayNodeData[id] == _nodesByName[jsonIn.origin].nodeId) {
                    this.arrayNodeData[id+1] = this.arrayNodeData[id+1]+1.0;
                }
                if(this.arrayNodeData[id] == _nodesByName[jsonIn.target].nodeId) {
                    this.arrayNodeData[id+1] = this.arrayNodeData[id+1]+1.0;
                }
            }
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
     * @param {Bool} [jsonIn.directed=false] -
     * @param {Float} [jsonIn.weight=1.0] - Float weight or "RANDOM"
     * @param {Float|String|Datetime} [jsonIn.bornDate=undefined] - Float timestamp, "RANDOM" or "24-Nov-2009 17:57:35"
     * @param {Float|String|Datetime} [jsonIn.dieDate=undefined] - Float timestamp, "RANDOM" or "24-Nov-2009 17:57:35"
     * @returns {Object}
     * @private
     */
    var createLink = (function(jsonIn) {
        for(var n=0; n < lineVertexCount*2; n++) {
            this.arrayLinkData.push(jsonIn.origin_nodeId, jsonIn.target_nodeId, Math.ceil(n/2), jsonIn.repeatId);
            this.arrayLinkDataC.push(jsonIn.bornDate, jsonIn.dieDate, jsonIn.weight, 0.0);

            if(Math.ceil(n/2) != (lineVertexCount-1)) {
                this.arrayLinkNodeName.push(jsonIn.origin_nodeName);
            } else {
                this.arrayLinkNodeName.push(jsonIn.target_nodeName);
            }
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
        }

        for(var n=0; n < lineVertexCount*2; n++)
            this.arrayLinkIndices.push(	this.startIndexId_link++);

        this.currentLinkId += 2; // augment link id

        jsonIn.linkId = this.currentLinkId-2;
        return jsonIn;
    }).bind(this);

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
    var createArrow = (function(jsonIn) {
        if(jsonIn != undefined && jsonIn.node != undefined)
            mesh_arrows = jsonIn.node;

        var oppositeId = 0;

        for(var o=0; o < 2; o++) {
            for(var n=0; n < mesh_arrows.vertexArray.length/4; n++) {
                var idxVertex = n*4;
                if(o == 0) oppositeId = this.arrowArrayItemStart;

                this.arrayArrowPosXYZW.push(0.0, 0.0, 0.0, 1.0);
                this.arrayArrowVertexPos.push(mesh_arrows.vertexArray[idxVertex], mesh_arrows.vertexArray[idxVertex+1], mesh_arrows.vertexArray[idxVertex+2], 1.0);
                this.arrayArrowVertexNormal.push(mesh_arrows.normalArray[idxVertex], mesh_arrows.normalArray[idxVertex+1], mesh_arrows.normalArray[idxVertex+2], 1.0);
                this.arrayArrowVertexTexture.push(mesh_arrows.textureArray[idxVertex], mesh_arrows.textureArray[idxVertex+1], mesh_arrows.textureArray[idxVertex+2], 1.0);
                if(o == 0) {
                    this.arrayArrowData.push(jsonIn.origin_nodeId, jsonIn.target_nodeId, 0.0, jsonIn.repeatId);
                    this.arrayArrowDataC.push(jsonIn.bornDate, jsonIn.dieDate, 0.0, 0.0);
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
                    this.arrayArrowData.push(jsonIn.target_nodeId, jsonIn.origin_nodeId, 1.0, jsonIn.repeatId);
                    this.arrayArrowDataC.push(jsonIn.bornDate, jsonIn.dieDate, 0.0, 0.0);
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

            var maxArrowIndexId = 0;
            for(var n=0; n < mesh_arrows.indexArray.length; n++) {
                var idxIndex = n;

                this.arrayArrowIndices.push(this.startIndexId_arrow+mesh_arrows.indexArray[idxIndex]);

                if(mesh_arrows.indexArray[idxIndex] > maxArrowIndexId) {
                    maxArrowIndexId = mesh_arrows.indexArray[idxIndex];
                }
            }
            this.startIndexId_arrow += (maxArrowIndexId+1);


            this.currentArrowId++; // augment arrow id
        }
    }).bind(this);











    //██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗    ███╗   ██╗ ██████╗ ██████╗ ███████╗███████╗
    //██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝██╔════╝
    //██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗      ██╔██╗ ██║██║   ██║██║  ██║█████╗  ███████╗
    //██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝      ██║╚██╗██║██║   ██║██║  ██║██╔══╝  ╚════██║
    //╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗    ██║ ╚████║╚██████╔╝██████╔╝███████╗███████║
    // ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝
	/**
	 * updateNodes
	 */
	this.updateNodes = function() {
		console.log((this.currentNodeId)+" nodes");

        _ADJ_MATRIX_WIDTH = _MAX_ADJ_MATRIX_WIDTH;

        comp_renderer_nodes.setArg("adjacencyMatrix", (function() {return new Float32Array(_ADJ_MATRIX_WIDTH*_ADJ_MATRIX_WIDTH*4);}).bind(this));
        comp_renderer_links.getComponentBufferArg("adjacencyMatrix", comp_renderer_nodes);
        comp_renderer_arrows.getComponentBufferArg("adjacencyMatrix", comp_renderer_nodes);

        comp_renderer_nodes.setArg("adjacencyMatrixB", (function() {return new Float32Array(_ADJ_MATRIX_WIDTH*_ADJ_MATRIX_WIDTH*4);}).bind(this));
        comp_renderer_links.getComponentBufferArg("adjacencyMatrixB", comp_renderer_nodes);
        comp_renderer_arrows.getComponentBufferArg("adjacencyMatrixB", comp_renderer_nodes);

        comp_renderer_nodes.setArg("widthAdjMatrix", (function() {return _ADJ_MATRIX_WIDTH;}).bind(this));
        comp_renderer_links.setArg("widthAdjMatrix", (function() {return _ADJ_MATRIX_WIDTH;}).bind(this));
        comp_renderer_arrows.setArg("widthAdjMatrix", (function() {return _ADJ_MATRIX_WIDTH;}).bind(this));

		comp_renderer_nodes.setArg("data", (function() {return this.arrayNodeData;}).bind(this));
        comp_renderer_nodes.setArg("dataB", (function() {return this.arrayNodeDataB;}).bind(this));
        comp_renderer_nodes.setArg("dataF", (function() {return this.arrayNodeDataF;}).bind(this));

		if(comp_renderer_nodes.getBuffers()["posXYZW"] != undefined)
            this.arrayNodePosXYZW = comp_renderer_nodes.gpufG.readArg("posXYZW");
		comp_renderer_nodes.setArg("posXYZW", (function() {return this.arrayNodePosXYZW;}).bind(this));

		comp_renderer_nodes.setArg("nodeVertexPos", (function() {return this.arrayNodeVertexPos;}).bind(this));
		comp_renderer_nodes.setArg("nodeVertexNormal", (function() {return this.arrayNodeVertexNormal;}).bind(this));
		comp_renderer_nodes.setArg("nodeVertexTexture", (function() {return this.arrayNodeVertexTexture;}).bind(this));

		comp_renderer_nodes.setArg("nodeImgColumns", (function() {return NODE_IMG_COLUMNS;}).bind(this));
		comp_renderer_nodes.setArg("nodeImgId", (function() {return this.arrayNodeImgId;}).bind(this));
		comp_renderer_nodes.setArg("indices", (function() {return this.arrayNodeIndices;}).bind(this));

		this.arrayNodeDir = [];
		for(var n=0; n < (this.arrayNodeData.length/4); n++) {
			this.arrayNodeDir.push(0, 0, 0, 1.0);
		}
		comp_renderer_nodes.setArg("dir", (function() {return this.arrayNodeDir;}).bind(this));

		comp_renderer_nodes.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_nodes.setArgUpdatable("PMatrix", true);
		comp_renderer_nodes.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_nodes.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_nodes.setArg("nodeWMatrix", (function() {return nodes.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_nodes.setArgUpdatable("nodeWMatrix", true);
        comp_renderer_nodes.setArg("efferentNode", (function() {return -1.0;}).bind(this));
		comp_renderer_nodes.setArg("isNode", (function() {return 1;}).bind(this));
        comp_renderer_nodes.setArg("bufferNodesWidth", (function() {return comp_renderer_nodes.getBuffers()["posXYZW"].W;}).bind(this));

		for(var argNameKey in _customArgs) {
			var expl = _customArgs[argNameKey].arg.split("*");
			if(expl.length > 0) { // argument is type buffer
				comp_renderer_nodes.setArg(argNameKey, (function() {return _customArgs[argNameKey].nodes_array_value;}).bind(this));
			}
		}

		if(_enableFont == true)
		    updateNodesText();
	};

    /** @private */
    var updateNodesText = (function() {
        comp_renderer_nodesText.setArg("data", (function() {return this.arrayNodeTextData;}).bind(this));
        comp_renderer_nodesText.getComponentBufferArg("posXYZW", comp_renderer_nodes);

        comp_renderer_nodesText.setArg("nodeVertexPos", (function() {return this.arrayNodeTextVertexPos;}).bind(this));
        comp_renderer_nodesText.setArg("nodeVertexNormal", (function() {return this.arrayNodeTextVertexNormal;}).bind(this));
        comp_renderer_nodesText.setArg("nodeVertexTexture", (function() {return this.arrayNodeTextVertexTexture;}).bind(this));

        comp_renderer_nodesText.setArg("fontImgColumns", (function() {return FONT_IMG_COLUMNS;}).bind(this));
        comp_renderer_nodesText.setArg("letterId", (function() {return this.arrayNodeTextLetterId;}).bind(this));
        comp_renderer_nodesText.setArg("indices", (function() {return this.arrayNodeTextIndices;}).bind(this));

        comp_renderer_nodesText.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
        comp_renderer_nodesText.setArgUpdatable("PMatrix", true);
        comp_renderer_nodesText.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
        comp_renderer_nodesText.setArgUpdatable("cameraWMatrix", true);
        comp_renderer_nodesText.setArg("nodeWMatrix", (function() {return nodes.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
        comp_renderer_nodesText.setArgUpdatable("nodeWMatrix", true);

        comp_renderer_nodesText.setArg("isNodeText", (function() {return 1;}).bind(this));
        comp_renderer_nodesText.setArg("bufferNodesWidth", (function() {return comp_renderer_nodes.getBuffers()["posXYZW"].W;}).bind(this));
        comp_renderer_nodesText.setArg("bufferTextsWidth", (function() {return comp_renderer_nodesText.getBuffers()["data"].W;}).bind(this));

        for(var argNameKey in _customArgs) {
            var expl = _customArgs[argNameKey].arg.split("*");
            if(expl.length > 0) { // argument is type buffer
                comp_renderer_nodesText.setArg(argNameKey, (function() {return _customArgs[argNameKey].nodestext_array_value;}).bind(this));
            }
        }
    }).bind(this);

    //██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗    ██╗     ██╗███╗   ██╗██╗  ██╗███████╗
    //██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝    ██║     ██║████╗  ██║██║ ██╔╝██╔════╝
    //██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗      ██║     ██║██╔██╗ ██║█████╔╝ ███████╗
    //██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝      ██║     ██║██║╚██╗██║██╔═██╗ ╚════██║
    //╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗    ███████╗██║██║ ╚████║██║  ██╗███████║
    // ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
	/**
	 * updateLinks
	 */
	this.updateLinks = function() {
		console.log(Object.keys(_links).length+" links");

		comp_renderer_nodes.setArg("data", (function() {return this.arrayNodeData;}).bind(this));
        //comp_renderer_nodes.setArg("dataB", (function() {return this.arrayNodeDataB;}).bind(this));

		comp_renderer_links.setArg("data", (function() {return this.arrayLinkData;}).bind(this));
        comp_renderer_links.setArg("dataC", (function() {return this.arrayLinkDataC;}).bind(this));
        comp_renderer_links.getComponentBufferArg("dataB", comp_renderer_nodes);
		comp_renderer_links.getComponentBufferArg("posXYZW", comp_renderer_nodes);
		comp_renderer_links.setArg("nodeVertexPos", (function() {return this.arrayLinkVertexPos;}).bind(this));
		comp_renderer_links.setArg("indices", (function() {return this.arrayLinkIndices;}).bind(this));

		comp_renderer_links.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
		comp_renderer_links.setArgUpdatable("PMatrix", true);
		comp_renderer_links.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
		comp_renderer_links.setArgUpdatable("cameraWMatrix", true);
		comp_renderer_links.setArg("nodeWMatrix", (function() {return nodes.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
		comp_renderer_links.setArgUpdatable("nodeWMatrix", true);

		comp_renderer_links.setArg("isLink", (function() {return 1;}).bind(this));
        comp_renderer_links.setArg("bufferNodesWidth", (function() {return comp_renderer_nodes.getBuffers()["posXYZW"].W;}).bind(this));
        comp_renderer_links.setArg("bufferLinksWidth", (function() {return comp_renderer_links.getBuffers()["data"].W;}).bind(this));

		for(var argNameKey in _customArgs) {
			var expl = _customArgs[argNameKey].arg.split("*");
			if(expl.length > 0) { // argument is type buffer
				comp_renderer_links.setArg(argNameKey, (function() {return _customArgs[argNameKey].links_array_value;}).bind(this));
			}
		}

		updateArrows();

        if(Object.keys(_links).length > 0)
            updateAdjMat();
	};

    /** @private */
    var updateArrows = (function() {
        comp_renderer_arrows.setArg("data", (function() {return this.arrayArrowData;}).bind(this));
        comp_renderer_arrows.setArg("dataC", (function() {return this.arrayArrowDataC;}).bind(this));
        comp_renderer_arrows.getComponentBufferArg("dataB", comp_renderer_nodes);
        comp_renderer_arrows.getComponentBufferArg("posXYZW", comp_renderer_nodes);

        comp_renderer_arrows.setArg("nodeVertexPos", (function() {return this.arrayArrowVertexPos;}).bind(this));
        comp_renderer_arrows.setArg("nodeVertexNormal", (function() {return this.arrayArrowVertexNormal;}).bind(this));
        comp_renderer_arrows.setArg("nodeVertexTexture", (function() {return this.arrayArrowVertexTexture;}).bind(this));
        comp_renderer_arrows.setArg("indices", (function() {return this.arrayArrowIndices;}).bind(this));

        comp_renderer_arrows.setArg("PMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.PROJECTION).getMatrix().transpose().e;}).bind(this));
        comp_renderer_arrows.setArgUpdatable("PMatrix", true);
        comp_renderer_arrows.setArg("cameraWMatrix", (function() {return _project.getActiveStage().getActiveCamera().getComponent(Constants.COMPONENT_TYPES.TRANSFORM_TARGET).getMatrix().transpose().e;}).bind(this));
        comp_renderer_arrows.setArgUpdatable("cameraWMatrix", true);
        comp_renderer_arrows.setArg("nodeWMatrix", (function() {return nodes.getComponent(Constants.COMPONENT_TYPES.TRANSFORM).getMatrixPosition().transpose().e;}).bind(this));
        comp_renderer_arrows.setArgUpdatable("nodeWMatrix", true);

        comp_renderer_arrows.setArg("isArrow", (function() {return 1.0;}).bind(this));
        comp_renderer_arrows.setArg("bufferNodesWidth", (function() {return comp_renderer_nodes.getBuffers()["posXYZW"].W;}).bind(this));
        comp_renderer_arrows.setArg("bufferArrowsWidth", (function() {return comp_renderer_arrows.getBuffers()["data"].W;}).bind(this));

        for(var argNameKey in _customArgs) {
            var expl = _customArgs[argNameKey].arg.split("*");
            if(expl.length > 0) { // argument is type buffer
                comp_renderer_arrows.setArg(argNameKey, (function() {return _customArgs[argNameKey].arrows_array_value;}).bind(this));
            }
        }
    }).bind(this);

    /** @private */
    var updateAdjMat = (function() {
        var setAdjMat = (function(id, columnAsParent, bornDate, dieDate, weight, linkMultiplier, activationFunc) {
            var idx = id*4;

            arrAdjMatrix[idx] = bornDate;
            arrAdjMatrix[idx+1] = dieDate;
            arrAdjMatrix[idx+2] = ((columnAsParent==true)?weight:disabVal);
            arrAdjMatrix[idx+3] = ((columnAsParent==true)?1.0:0.0); // columnAsParent=1.0;

            arrAdjMatrixB[idx] = linkMultiplier;
            arrAdjMatrixB[idx+1] = activationFunc;
        }).bind(this);

        arrAdjMatrix = new Float32Array(_ADJ_MATRIX_WIDTH*_ADJ_MATRIX_WIDTH*4);
        arrAdjMatrixB = new Float32Array(_ADJ_MATRIX_WIDTH*_ADJ_MATRIX_WIDTH*4);
        for(var key in _links) {
            var origin = _links[key].origin_nodeId;
            var target = _links[key].target_nodeId;

            setAdjMat((origin*_ADJ_MATRIX_WIDTH)+(target), false, _links[key].bornDate, _links[key].dieDate, _links[key].weight, _links[key].linkMultiplier, _links[key].activationFunc); // (columns=parent;rows=child)
            setAdjMat((target*_ADJ_MATRIX_WIDTH)+(origin), true, _links[key].bornDate, _links[key].dieDate, _links[key].weight, _links[key].linkMultiplier, _links[key].activationFunc); // (columns=child;rows=parent)
        }

        comp_renderer_nodes.setArg("adjacencyMatrix", (function() {return arrAdjMatrix;}).bind(this));
        comp_renderer_nodes.setArg("adjacencyMatrixB", (function() {return arrAdjMatrixB;}).bind(this));

        /*
        this.adjacencyMatrixToImage(arrAdjMatrix, _ADJ_MATRIX_WIDTH, (function(img) {
            document.body.appendChild(img);
            img.style.border = "1px solid red";
        }).bind(this)); */
    }).bind(this);


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

        var arrF = toArrF(adjMat);
        toImage(arrF, width, width);
    };

    /**
     * enableForceLayout
     */
    this.enableForceLayout = function() {
        comp_renderer_nodes.setArg("enableForceLayout", (function() {return 1.0;}).bind(this));
        _enabledForceLayout = true;
    };

    /**
     * disableForceLayout
     */
    this.disableForceLayout = function() {
        comp_renderer_nodes.setArg("enableForceLayout", (function() {return 0.0;}).bind(this));
        _enabledForceLayout = false;
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
};
