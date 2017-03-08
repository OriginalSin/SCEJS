/** @private **/
function KERNEL_DIR(customCode, geometryLength, _enableNeuronalNetwork) {
    var outputArr;
    var returnStr;
    if(_enableNeuronalNetwork == true) {
        outputArr = ["dir", "posXYZW", "dataB"];
        returnStr = 'return [vec4(currentDir, 1.0), vec4(currentPos.x, currentPos.y, currentPos.z, 1.0), currentDataB];';
    } else {
        outputArr = ["dir", "posXYZW"];
        returnStr = 'return [vec4(currentDir, 1.0), vec4(currentPos.x, currentPos.y, currentPos.z, 1.0)];';
    }

    this.getSrc = function() {
        return ["x", outputArr,
                        // head
                        adjMatrix_ForceLayout_GLSLFunctionString(geometryLength),

                        // source
                        'float nodeId = data[x].x;'+
                        'float numOfConnections = data[x].y;\n'+
                        'vec2 xGeometry = get_global_id(nodeId, uBufferWidth, '+geometryLength.toFixed(1)+');'+


                        'vec3 currentPos = posXYZW[x].xyz;\n'+

                        'float bornDate = dataB[x].x;'+
                        'float dieDate = dataB[x].y;'+

                        'vec3 currentDir = dir[x].xyz;\n'+


                        'vec4 currentDataB = dataB[x];\n'+

                        'currentDir = vec3(0.0, 0.0, 0.0);'+

                            // FORCE LAYOUT
                        "if(enableForceLayout == 1.0 && performFL == 0.0) {"+
                            'idAdjMatrixResponse adjM = idAdjMatrix_ForceLayout(nodeId, currentPos, currentDir, numOfConnections, currentTimestamp, bornDate, dieDate, enableNeuronalNetwork);'+
                            'currentDir = (adjM.collisionExists == 1.0) ? adjM.force : currentDir+(adjM.force*1.0);'+

                            'if(enableNeuronalNetwork == 1.0) {'+
                                'float nProc = (adjM.netProcData != 0.0) ? adjM.netProcData : currentDataB.z;'+
                                'float nErr = (adjM.netErrorData != 0.0) ? adjM.netErrorData : currentDataB.w;'+

                                'currentDataB = vec4(currentDataB.x, currentDataB.y, nProc, nErr);'+
                            '}'+
                        "}"+

                        ((customCode != undefined) ? customCode : '')+

                        'if(enableDrag == 1.0) {'+
                            'if(nodeId == idToDrag) {'+
                                'currentPos = vec3(MouseDragTranslationX, MouseDragTranslationY, MouseDragTranslationZ);\n'+
                            '}\n'+
                        '}\n'+

                        'currentPos += currentDir;\n'+
                        'if(only2d == 1.0) '+
                            'currentPos.y = 0.0;'+

                        returnStr];
    };
}
