/** @private **/
function KERNEL_ADJMATRIX_UPDATE(geometryLength) {
    this.getSrc = function() {
        return ["x", ["adjacencyMatrix"],
            // head
            "",

            // source
            'vec4 adjMat = adjacencyMatrix[x];'+
            'float linkBornDate = adjMat.x;'+ // if > 0 = link exists
            'float linkDieDate = adjMat.y;'+
            'float linkWeight = adjMat.z;'+
            'float linkTypeParent = adjMat.w;'+// if w=0.0 then indicate that in this relation(pixel) the parentId(targetId) is the column location. Rows is the child

            'if(linkBornDate > 0.0 && linkTypeParent == 1.0) {'+ // 0.0=(col=parentId;row=childId) 1.0=(col=childId;row=parentId)
                'float currentId = (gl_FragCoord.y*widthAdjMatrix)+gl_FragCoord.x;'+
                'float inverseId = (gl_FragCoord.x*widthAdjMatrix)+gl_FragCoord.y;'+

                'vec2 xGeometryCurrentParent;'+
                'vec2 xGeometryChild;'+
                'if(currentId < inverseId) {'+
                    'xGeometryCurrentParent = get_global_id(gl_FragCoord.x, nodesCount, '+geometryLength.toFixed(1)+');'+
                    'xGeometryChild = get_global_id(gl_FragCoord.y, nodesCount, '+geometryLength.toFixed(1)+');'+
                '} else {'+
                    'xGeometryCurrentParent = get_global_id(gl_FragCoord.y, nodesCount, '+geometryLength.toFixed(1)+');'+
                    'xGeometryChild = get_global_id(gl_FragCoord.x, nodesCount, '+geometryLength.toFixed(1)+');'+
                '}'+


                'float inData = dataB[xGeometryCurrentParent].z;'+
                'float outErrorData = dataB[xGeometryChild].w;'+
                'float outData = dataB[xGeometryChild].z;'+

                'linkWeight = linkWeight+0.5*outErrorData*inData;'+
            '}'+

            'return [vec4(linkBornDate, linkDieDate, linkWeight, linkTypeParent)];'+
            ''];
    };
}
