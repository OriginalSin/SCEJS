/** @private **/
function KERNEL_DIR(customCode, geometryLength) { VFP.call(this);
    this.getSrc = function() {
        var str_vfp = ["x", ["dir", "posXYZW"],
                        // head
                        ForceLayout_FunctionsString+
                        adjMatrix_GLSLFunctionString(   AdjMatrix_ForceLayout_initVars,
                        AdjMatrix_ForceLayout_relationFound(geometryLength),
                        AdjMatrix_ForceLayout_summation,
                        AdjMatrix_ForceLayout_returnInstruction),

                        // source
                        'float nodeId = data[x].x;'+
                        'float numOfConnections = data[x].y;\n'+
                        'vec2 xGeometry = get_global_id(nodeId, uBufferWidth, '+geometryLength.toFixed(1)+');'+


                        'float bornDate = data[x].z;'+
                        'float dieDate = data[x].w;'+

                        'vec3 currentDir = dir[xGeometry].xyz;\n'+
                        'vec3 currentPos = posXYZW[xGeometry].xyz;\n'+

                        'if(currentAdjMatrix == 0.0) {'+
                            'currentDir = vec3(0.0, 0.0, 0.0);'+
                        '}'+

                            // FORCE LAYOUT
                        "if(enableForceLayout == 1.0 && performFL == 0.0) {"+
                            'vec4 forC = idAdjMatrix(nodeId, currentPos, currentDir, numOfConnections, currentTimestamp, bornDate, dieDate);'+
                            'currentDir = (forC.w == 1.0) ? forC.xyz : (currentDir+forC.xyz);'+
                        "}"+


                        "if(enableForceLayout == 1.0) {"+
                            "if((numberOfColumns == 1.0 && performFL == 0.0) || (numberOfColumns > 1.0 && performFL == 1.0)) {"+
                                'currentDir /= numberOfColumns;'+
                            '}'+
                        "} else "+
                            'currentDir = currentDir;'+ // air resistence

                        ((customCode != undefined) ? customCode : '')+



                        'if(enableDrag == 1.0) {'+
                            'if(nodeId == idToDrag) {'+
                                'currentPos = vec3(MouseDragTranslationX, MouseDragTranslationY, MouseDragTranslationZ);\n'+
                            '}\n'+
                        '}\n'+

                        'if((numberOfColumns == 1.0 && performFL == 0.0) || (numberOfColumns > 1.0 && performFL == 1.0))'+
                            'currentPos += currentDir;\n'+


                        'return [vec4(currentDir, 1.0), vec4(currentPos.x, 0.0, currentPos.z, 1.0)];'];

        return str_vfp;
    };
};
KERNEL_DIR.prototype = Object.create(VFP.prototype);
KERNEL_DIR.prototype.constructor = KERNEL_DIR;
