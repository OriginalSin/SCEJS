/**
 * @class
 */
NeuronalNetwork = function(sce) {
    "use strict";

    var _sce = sce;
    var _project = _sce.getLoadedProject();
    var _gl = _project.getActiveStage().getWebGLContext();
    var _utils = new Utils();



    var OFFSET = 1000.0;
    var offs = OFFSET/10;

    var graph = new Graph(sce);
    graph.enableNeuronalNetwork();
    graph.setOffset(OFFSET);

    var mesh_point = new Mesh().loadPoint();
    //graph.setNodeMesh(mesh_point);

    graph.disableAutoLink();




    // APPLY THIS LAYOUT
    graph.applyLayout({	// OBJECT
        // [x], vec4 nodeVertexColor, vec4 nodeVertexPosition, vec4 XYZW_opposite
        // float isNode, float isLink, float isArrow, float isNodeText, float isTarget
        "argsObject":
        // nodeColor
            "float4*attr nodeColor",
        "codeObject":
        // nodeColor
        //'if(isNode == 1.0) nodeVertexColor = nodeColor[x];'+
            //'if(isLink == 1.0 && currentLineVertex == 1.0) nodeVertexColor = vec4(0.0, 1.0, 0.0, 1.0);'+ // this is isTarget for arrows

        'float degr = (currentLineVertex/vertexCount)/2.0;'+
        'if(isLink == 1.0) nodeVertexColor = vec4(0.5+degr, 0.5+degr, 0.5+degr, 1.0);'+ // this is isTarget for arrows
        'if(isArrow == 1.0 && currentLineVertex == vertexCount) nodeVertexColor = vec4(0.0, 1.0, 0.0, 1.0);'+ // this is isTarget for arrows
        'if(isArrow == 1.0 && currentLineVertex == 0.0) nodeVertexColor = vec4(1.0, 0.0, 0.0, 0.0);' // this is isTarget for arrows

    });

    graph.setFontsImage("../../SCEJS/Prefabs/Graph/fonts.png");


    /**
     * addAfferentNeuron
     * @param {String} neuronName
     */
    this.addAfferentNeuron = function(neuronName) {
        var pos = [-(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), 1.0];

        graph.addNode({
            "name": neuronName,
            "data": "#0",
            "position": pos,
            "color": "../_RESOURCES/UV.jpg",
            "layoutNodeArgumentData": {"nodeColor": [1.0, 1.0, 1.0, 1.0]},
            "onmouseup": (function(nodeData) {

            }).bind(this)});
    };

    /**
     * addEfferentNeuron
     * @param {String} neuronName
     * @param {Int} [efectType=0] - efectuator type
     */
    this.addEfferentNeuron = function(neuronName, efectType) {
        var efcTyp = efectType|0;
        var pos = [-(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), -(offs/2)+(Math.random()*offs), 1.0];

        graph.addNode({
            "name": neuronName,
            "data": "#0",
            "position": pos,
            "layoutNodeArgumentData": {"nodeColor": [1.0, 1.0, 1.0, 1.0]},
            "onmouseup": (function(nodeData) {

            }).bind(this)});
    };

    /**
     * addSinapsis
     * @param {String} neuronNameA
     * @param {String} neuronNameB
     */
    this.addSinapsis = function(neuronNameA, neuronNameB) {
        graph.addLink({	"origin": neuronNameA,
                        "target": neuronNameB,
                        "directed": true});
    };

    this.update = function() {
        graph.updateNodes();
        graph.updateLinks();
    };

    /**
     * afferentData
     * @param {Object} jsonIn
     */
    this.afferentData = function(jsonIn) {

    };

    /**
     * afferentData
     * @param {Object} jsonIn
     */
    this.efferentData = function(jsonIn) {

    };

};