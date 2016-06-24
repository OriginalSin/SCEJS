/** @private **/
function KERNEL_DIR(customCode, geometryLength, _enableNeuronalNetwork) { VFP.call(this);
    var outputArr;
    var returnStr;
    if(_enableNeuronalNetwork == true) {
        outputArr = ["dir", "posXYZW", "dataB"];
        returnStr = 'return [vec4(currentDir, 1.0), vec4(currentPos.x, 0.0, currentPos.z, 1.0), currentDataB];';
    } else {
        outputArr = ["dir", "posXYZW"];
        returnStr = 'return [vec4(currentDir, 1.0), vec4(currentPos.x, currentPos.y, currentPos.z, 1.0)];';
    }

    this.getSrc = function() {
        var str_vfp = ["x", outputArr,
                        // head
                        adjMatrix_ForceLayout_GLSLFunctionString(geometryLength),

                        // source
                        'float nodeId = data[x].x;'+
                        'float numOfConnections = data[x].y;\n'+
                        'vec2 xGeometry = get_global_id(nodeId, uBufferWidth, '+geometryLength.toFixed(1)+');'+


                        'float bornDate = dataB[x].x;'+
                        'float dieDate = dataB[x].y;'+

                        'vec3 currentDir = dir[x].xyz;\n'+
                        'vec3 currentPos = posXYZW[x].xyz;\n'+

                        'vec4 currentDataB = dataB[x];\n'+

                        'currentDir = vec3(0.0, 0.0, 0.0);'+

                        'float disabVal = -2.0;'+

                            // FORCE LAYOUT
                        "if(enableForceLayout == 1.0 && performFL == 0.0) {"+
                            'idAdjMatrixResponse adjM = idAdjMatrix_ForceLayout(nodeId, currentPos, currentDir, numOfConnections, currentTimestamp, bornDate, dieDate);'+
                            'currentDir = (adjM.collisionExists == 1.0) ? adjM.force : (currentDir+adjM.force);'+

                            'if(enableNeuronalNetwork == 1.0) {'+ 
                                //'if(makeNetworkStep == 1.0) {'+
                                    'if(adjM.netProcData != 0.0) {'+
                                        'currentDataB = vec4(currentDataB.x, currentDataB.y, adjM.netProcData, adjM.netProcData);'+
                                    '} else {'+
                                        'currentDataB = vec4(currentDataB.x, currentDataB.y, disabVal, currentDataB.w);'+
                                    '}'+
                                //'}'+
                            '}'+
                        "}"+

                        ((customCode != undefined) ? customCode : '')+

                        'if(enableDrag == 1.0) {'+
                            'if(nodeId == idToDrag) {'+
                                'currentPos = vec3(MouseDragTranslationX, MouseDragTranslationY, MouseDragTranslationZ);\n'+
                            '}\n'+
                        '}\n'+

                        'currentPos += currentDir;\n'+


                        returnStr];

        return str_vfp;
    };
};
KERNEL_DIR.prototype = Object.create(VFP.prototype);
KERNEL_DIR.prototype.constructor = KERNEL_DIR;
