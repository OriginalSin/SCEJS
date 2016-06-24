var adjMatrix_ForceLayout_GLSLFunctionString = function(geometryLength) {
    var str = ''+
    'vec3 sphericalColl(vec3 currentDir, vec3 currentDirB, vec3 dirToBN) {'+
        'vec3 currentDirN = normalize(currentDir);'+
        'float pPoint = abs(dot(currentDirN, dirToBN));'+
        'vec3 reflectV = reflect(currentDirN*-1.0, dirToBN);'+

        'vec3 currentDirBN = normalize(currentDirB);'+
        'float pPointB = abs(dot(currentDirBN, dirToBN));'+

        'vec3 repulsionForce = (reflectV*-1.0)* (((1.0-pPoint)*length(currentDir))+((pPointB)*length(currentDirB)));\n'+

        'return (repulsionForce.x > 0.0 && repulsionForce.y > 0.0 && repulsionForce.z > 0.0) ? repulsionForce : dirToBN*-0.1;'+
    "}"+

    'struct CalculationResponse {'+
        'vec3 atraction;'+
        'float acumAtraction;'+
        'vec3 repulsion;'+
        'float collisionExists;'+
        'float netProc;'+
    '};'+

    'CalculationResponse calculate(vec4 itColRow, vec4 itRowCol, vec2 xGeom_adjCol, vec2 xGeom_adjRow, vec3 currentPos, vec3 currentDir, vec3 atraction, float acumAtraction, vec3 repulsion, float netProc) {'+
        'float bornDateB = dataB[xGeom_adjRow].x;'+
        'float dieDateB = dataB[xGeom_adjRow].y;'+

        'vec3 currentPosB = posXYZW[xGeom_adjRow].xyz;\n'+
        'vec3 currentDirB = dir[xGeom_adjRow].xyz;\n'+

        'vec3 dirToB = (currentPosB-currentPos);\n'+
        'vec3 dirToBN = normalize(dirToB);\n'+
        'float dist = distance(currentPosB, currentPos);\n'+ // near=0.0 ; far=1.0


        'float disabVal = -2.0;'+
        'float childNetworkWaitData = (itColRow.w == 1.0) ? dataB[xGeom_adjRow].z : disabVal;'+
        'float ww = itColRow.z;'+
        'float exCon = itColRow.x;'+


        'float radius = 4.0;\n'+
        'float collisionExists = 0.0;\n'+
        'if(enableForceLayoutCollision == 1.0 && dist < radius) {'+
            'collisionExists = 1.0;'+
            'atraction = sphericalColl(currentDir, currentDirB, dirToBN);'+
        '} else {'+
            'if(exCon > 0.0) {'+ // connection exists
                'int pass = 1;'+
                'if(dieDateB != 0.0) {'+
                    'if(currentTimestamp < bornDateB || currentTimestamp > dieDateB) {'+
                        'pass = 0;'+
                    '} else {'+
                        // nodes exists, now check link
                        'if(itColRow.y != 0.0) {'+
                            'if(currentTimestamp < exCon || currentTimestamp > itColRow.y) {'+
                                'pass = 0;'+
                            '}'+
                        '}'+
                    '}'+
                '} else {'+
                    // now check link
                    'if(itColRow.y != 0.0) {'+
                        'if(currentTimestamp < exCon || currentTimestamp > itColRow.y) {'+
                            'pass = 0;'+
                        '}'+
                    '}'+
                '}'+

                'if(pass == 1) {'+
                    'atraction += dirToBN*dist*0.5*ww;\n'+
                    'atraction += dirToBN*-10.0;\n'+

                    'acumAtraction += 1.0;\n'+


                    'if(childNetworkWaitData != disabVal) '+
                        'netProc += childNetworkWaitData*ww;'+ // data*weight
                '}'+
            '} else {'+
                'if(enableForceLayoutRepulsion == 1.0) \n'+
                    'repulsion += dirToBN*-(10.0);\n'+
            '}'+
        '}'+
        'return CalculationResponse(atraction, acumAtraction, repulsion, collisionExists, netProc);'+
    '}'+
    'struct idAdjMatrixResponse {'+
        'vec3 force;'+
        'float collisionExists;'+
        'float netProcData;'+
    '};'+
    'idAdjMatrixResponse idAdjMatrix_ForceLayout(float nodeId, vec3 currentPos, vec3 currentDir, float numOfConnections, float currentTimestamp, float bornDate, float dieDate) {\n'+
        // INIT VARS
        'vec3 atraction = vec3(0.0, 0.0, 0.0);'+
        'float acumAtraction = 1.0;'+
        'vec3 repulsion = vec3(0.0, 0.0, 0.0);'+

        'float collisionExists = 0.0;\n'+
        'vec3 force = vec3(0.0, 0.0, 0.0);\n'+

        'float netProc = 0.0;'+
        // END INIT VARS

        'if(nodeId < widthAdjMatrix) {\n'+

            'for(int n=0; n < 4096; n++) {\n'+
                'if(float(n) >= nodesCount) break;\n'+
                'if(float(n) != nodeId) {'+
                    'vec2 xAdjMat = get_global_id(vec2(nodeId, float(n)), widthAdjMatrix);'+
                    'vec4 itColRow = adjacencyMatrix[xAdjMat];\n'+
                    'vec2 xAdjMatS = get_global_id(vec2(float(n), nodeId), widthAdjMatrix);'+
                    'vec4 itRowCol = adjacencyMatrix[xAdjMatS];\n'+

                    // RELATION FOUND
                    'vec2 xGeom_adjCol = get_global_id(nodeId, uBufferWidth, '+geometryLength.toFixed(1)+');\n'+
                    'vec2 xGeom_adjRow = get_global_id(float(n), uBufferWidth, '+geometryLength.toFixed(1)+');\n'+

                    'CalculationResponse calcResponse = calculate(itColRow, itRowCol, xGeom_adjCol, xGeom_adjRow, currentPos, currentDir, atraction, acumAtraction, repulsion, netProc);'+
                    'atraction = calcResponse.atraction;'+
                    'acumAtraction = calcResponse.acumAtraction;'+
                    'repulsion = calcResponse.repulsion;'+
                    'netProc = calcResponse.netProc;'+

                    'if(calcResponse.collisionExists == 1.0) {'+
                        'collisionExists = 1.0;'+
                        'force = calcResponse.atraction;'+
                        'break;'+
                    '}'+

                    'if(dieDate != 0.0) {'+
                        'if(currentTimestamp < bornDate || currentTimestamp > dieDate) {'+
                            'force = vec3(0.0, 0.0, 0.0);'+
                            'break;'+
                        '}'+
                    '}'+
                    // END RELATION FOUND
                '}'+
            '}'+
            // SUMMATION
            'if(collisionExists == 0.0) {'+
                'if(enableForceLayoutRepulsion == 1.0) {'+
                    'vec3 cA = atraction/acumAtraction;'+
                    'force += cA;'+

                    'vec3 cR = repulsion/(widthAdjMatrix-acumAtraction);'+
                    'force += cR*sqrt( max(0.0, 1.0-length(cA)) );'+
                '} else {'+
                    'vec3 cA = atraction/acumAtraction;'+
                    'force += cA;'+
                '}'+
            '}'+
            // END SUMMATION

        '}'+

        'return idAdjMatrixResponse(vec3(force), collisionExists, netProc);'+
    '}';

    return str;
};

var adjMatrix_Autolink_GLSLFunctionString = function(geometryLength) {
    var str = ''+
    'float GetAngle(vec3 A, vec3 B) {'+ // from -180.0 to 180.0
        'vec3 cr = cross(A, B);'+
        'float d = dot(A, B);'+

        'if(cr.y < 0.0) {'+
            'if(d > 0.0) {'+
                'd =        (1.0-d)*90.0;'+
            '} else {'+
                'd = 90.0+  (abs(d)*90.0);'+
            '}'+
        '} else {'+
            'if(d > 0.0) {'+
                'd = 270.0+ (d*90.0);'+
            '} else {'+
                'd = 180.0+ ((1.0-abs(d))*90.0);'+
            '}'+
        '}'+

        'return d;'+
    '}'+
    'vec4 idAdjMatrix_Autolink(float nodeId, vec3 currentPos) {\n'+
        // INIT VARS
        'vec2 totalIDrelation = vec2(0.0, 0.0);'+
        'float totalAngleRelations = 0.0;'+
        // END INIT VARS

        'if(nodeId < widthAdjMatrix) {\n'+

            'for(int n=0; n < 4096; n++) {\n'+
                'if(float(n) >= nodesCount) break;\n'+
                'if(float(n) != nodeId) {'+
                    'vec2 xAdjMat = get_global_id(vec2(nodeId, float(n)), widthAdjMatrix);'+
                    'vec4 itColRow = adjacencyMatrix[xAdjMat];\n'+

                    // RELATION FOUND
                    'if(itColRow.x > 0.0) {'+
                        'vec2 xGeom_adjCol = get_global_id(float(n), uBufferWidth, '+geometryLength.toFixed(1)+');\n'+
                        'vec3 currentPosB = posXYZW[xGeom_adjCol].xyz;\n'+
                        'vec3 dirToBN = normalize(currentPosB-currentPos);\n'+

                        'vec2 IDrelation = vec2(0.0, 0.0);'+
                        'float angleRelations = 360.0;'+

                        'if(nodeId < widthAdjMatrix) {\n'+

                            'for(int nB=0; nB < 4096; nB++) {\n'+
                                'if(float(nB) >= nodesCount) break;\n'+
                                'if(float(nB) != float(n) && float(nB) != nodeId) {'+
                                    'vec2 xAdjMatB = get_global_id(vec2(nodeId, float(nB)), widthAdjMatrix);'+
                                    'vec4 itColRowB = adjacencyMatrix[xAdjMatB];\n'+

                                    'if(itColRowB.x > 0.0) {'+
                                        'vec2 xGeom_oppoB = get_global_id(float(nB), uBufferWidth, '+geometryLength.toFixed(1)+');\n'+
                                        'vec3 currentPosBB = posXYZW[xGeom_oppoB].xyz;\n'+
                                        'vec3 dirToBBN = normalize(currentPosBB-currentPos);\n'+

                                        'float angle = GetAngle(dirToBN,dirToBBN);'+

                                        'if(angle > 0.0 && angle < angleRelations) {'+
                                            'IDrelation = xGeom_oppoB;'+
                                            'angleRelations = angle;'+
                                        '}'+
                                    '}'+
                                '}'+
                            '}'+

                        '}'+

                        'if(angleRelations < 360.0 && angleRelations > totalAngleRelations) {'+
                             'totalIDrelation = IDrelation;'+
                             'totalAngleRelations = angleRelations;'+
                        '}'+
                    '}'+
                    // END RELATION FOUND

                '}'+
            '}'+
            // SUMMATION
            // END SUMMATION

        '}'+

        'return vec4(totalIDrelation, totalAngleRelations, 0.0);'+
    '}';

    return str;
};