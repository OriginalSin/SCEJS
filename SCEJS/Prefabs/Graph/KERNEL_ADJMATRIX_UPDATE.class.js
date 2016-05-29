/** @private **/
function KERNEL_ADJMATRIX_UPDATE(geometryLength) { VFP.call(this);
    this.getSrc = function() {
        var str_vfp = ["x", ["adjacencyMatrix"],
            // head
            "",

            // source
            //'float nodeId = data[x].x;'+
            'vec4 adjMat = adjacencyMatrix[x];'+
            'float linkBornDate = adjMat.x;'+ // if > 0 = link exists
            'float linkDieDate = adjMat.y;'+
            'float linkWeight = adjMat.z;'+
            'float linkTypeChild = adjMat.w;'+// if w=0.0 then indicate that in this relation(pixel) the parentId(targetId) is the column location. Rows is the child

            'if(linkBornDate > 0.0 && linkTypeChild == 0.0) {'+
                'float parentNodeId = gl_FragCoord.x;'+
                'vec2 xGeometry = get_global_id(parentNodeId, nodesCount, '+geometryLength.toFixed(1)+');'+
                'float efferenceData = dataF[xGeometry].x;'+
                'float networkProcData = dataB[xGeometry].w;'+

                'if(efferenceData != -2.0) {'+ // evidence exists
                    'if(efferenceData != networkProcData) {'+ // error exists. calibrate link weight
                        // W=W+learnCoef(Y)*D
                        'linkWeight = linkWeight+linkWeight*efferenceData*networkProcData;'+
                    '}'+
                '}'+
                // search all childs(rows) of this parent(column)
                ''+
            '}'+

            /*'float nodeId = adjacencyMatrix[x].x;'+

            'float numOfConnections = data[x].y;\n'+
            'vec2 xGeometry = get_global_id(nodeId, uBufferWidth, '+geometryLength.toFixed(1)+');'+


            'float bornDate = dataB[x].x;'+
            'float dieDate = dataB[x].y;'+

            'vec3 currentDir = dir[x].xyz;\n'+
            'vec3 currentPos = posXYZW[x].xyz;\n'+

            'vec4 currentDataB = dataB[x];\n'+

            'if(currentAdjMatrix == 0.0) {'+
                'currentDir = vec3(0.0, 0.0, 0.0);'+
            '}'+

                // FORCE LAYOUT


            'if(enableNeuronalNetwork == 1.0) {'+

            "}"+


            'return [vec4(currentAdjMatrix, 1.0)];'+*/

            'return [vec4(linkBornDate, linkDieDate, linkWeight, linkTypeChild)];'+
            ''];

        return str_vfp;
    };
};
KERNEL_ADJMATRIX_UPDATE.prototype = Object.create(VFP.prototype);
KERNEL_ADJMATRIX_UPDATE.prototype.constructor = KERNEL_ADJMATRIX_UPDATE;
