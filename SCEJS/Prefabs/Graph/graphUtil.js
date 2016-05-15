////////////////////////////////////////
// For ForceLayout
////////////////////////////////////////
var ForceLayout_FunctionsString = ''+
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
'};'+

'CalculationResponse calculate(int connectionExists, vec2 xGeom_oppo, vec3 currentPos, vec3 currentDir, vec3 atraction, float acumAtraction, vec3 repulsion) {'+
    'float radius = 4.0;\n'+
    'float collisionExists = 0.0;\n'+

    'vec3 currentPosB = posXYZW[xGeom_oppo].xyz;\n'+
    'vec3 currentDirB = dir[xGeom_oppo].xyz;\n'+

    'vec3 dirToB = (currentPosB-currentPos);\n'+
    'vec3 dirToBN = normalize(dirToB);\n'+
    'float dist = distance(currentPosB, currentPos);\n'+ // near=0.0 ; far=1.0

    'if(enableForceLayoutCollision == 1.0 && dist < radius) {'+
        'collisionExists = 1.0;'+
        'atraction = sphericalColl(currentDir, currentDirB, dirToBN);'+
    '} else {'+
        'if(connectionExists == 1) {'+
            'float bornDateOpposite = dataB[xGeom_oppo].x;'+
            'float dieDateOpposite = dataB[xGeom_oppo].y;'+

            'int mak = 0;'+
            'if(dieDateOpposite != -1.0) {'+
                'if(currentTimestamp > bornDateOpposite && currentTimestamp < dieDateOpposite) '+
                    'mak = 1;'+
            '} else '+
                'mak = 1;'+

            'if(mak == 1) {'+
                'atraction += dirToBN*dist*0.5;\n'+
                'atraction += dirToBN*-10.0;\n'+

                'acumAtraction += 1.0;\n'+
            '}'+
        '} else {'+
            'if(enableForceLayoutRepulsion == 1.0) \n'+
                'repulsion += dirToBN*-(1000.0);\n'+
        '}'+
    '}'+
    'return CalculationResponse(atraction, acumAtraction, repulsion, collisionExists);'+
'}';

var AdjMatrix_ForceLayout_initVars = ''+
'vec3 atraction = vec3(0.0, 0.0, 0.0);'+
'float acumAtraction = 1.0;'+
'vec3 repulsion = vec3(0.0, 0.0, 0.0);'+

'float collisionExists = 0.0;\n'+
'vec3 force = vec3(0.0, 0.0, 0.0);\n';

var AdjMatrix_ForceLayout_relationFound = function(geometryLength) {
    var str = ''+
    'int connectionExists = (it > 0.5) ? 1 : 0;'+
    'vec2 xGeom_oppo = get_global_id(idb, uBufferWidth, '+geometryLength.toFixed(1)+');\n'+
    'CalculationResponse calcResponse = calculate(connectionExists, xGeom_oppo, currentPos, currentDir, atraction, acumAtraction, repulsion);'+
    'atraction = calcResponse.atraction;'+
    'acumAtraction = calcResponse.acumAtraction;'+
    'repulsion = calcResponse.repulsion;'+
    'if(calcResponse.collisionExists == 1.0) {'+
        'collisionExists = 1.0;'+
        'force = calcResponse.atraction;'+
        'break;'+
    '}'+

    'if(dieDate != -1.0) {'+
        'if(currentTimestamp < bornDate || currentTimestamp > dieDate) {'+
            'force = vec3(0.0, 0.0, 0.0);'+
            'break;'+
        '}'+
    '} ';

    return str;
};

var AdjMatrix_ForceLayout_summation = ''+
'if(collisionExists == 0.0) {'+
    'if(enableForceLayoutRepulsion == 1.0) {'+
        'vec3 cA = atraction/acumAtraction;'+
        'force += cA;'+

        'vec3 cR = repulsion/(widthAdjMatrix);'+
        'force += cR*sqrt( max(0.0, 1.0-length(cA)) );'+
    '} else {'+
        'vec3 cA = atraction/acumAtraction;'+
        'force += cA;'+
    '}'+
'}';

var AdjMatrix_ForceLayout_returnInstruction = 'return vec4(force, collisionExists);';


////////////////////////////////////////
// For Autolink Distribution
////////////////////////////////////////
var Autolink_FunctionsString = ''+
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
'}';

var AdjMatrix_Autolink_initVars = ''+
'vec2 totalIDrelation = vec2(0.0, 0.0);'+
'float totalAngleRelations = 0.0;';

var AdjMatrix_Autolink_relationFound = function(geometryLength) {
    var str = ''+
    'if(it > 0.5) {'+
        'vec2 xGeom_oppo = get_global_id(idb, uBufferWidth, '+geometryLength.toFixed(1)+');\n'+
        'vec3 currentPosB = posXYZW[xGeom_oppo].xyz;\n'+
        'vec3 dirToBN = normalize(currentPosB-currentPos);\n'+

        'vec2 IDrelation = vec2(0.0, 0.0);'+
        'float angleRelations = 360.0;'+




        'for(int nB=0; nB < 4096; nB++) {\n'+
            'float idbB = float(nB)+initB;\n'+
            'if(idbB >= nodesCount) break;\n'+
            'if(idbB != idb && idbB != nodeId) {'+
                'vec2 xAdjMatB = get_global_id(vec2(nodeId-initA, float(nB)), widthAdjMatrix);'+
                'float itB = adjacencyMatrix[xAdjMatB];\n'+

                'if(itB > 0.5) {'+
                    'vec2 xGeom_oppoB = get_global_id(idbB, uBufferWidth, '+geometryLength.toFixed(1)+');\n'+
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

        'if(angleRelations < 360.0 && angleRelations > totalAngleRelations) {'+
             'totalIDrelation = IDrelation;'+
             'totalAngleRelations = angleRelations;'+
        '}'+
    '}';

    return str;
};

var AdjMatrix_Autolink_summation = '';

var AdjMatrix_Autolink_returnInstruction = 'return vec4(totalIDrelation, totalAngleRelations, 0.0);';





var adjMatrix_GLSLFunctionString = function(initVars, relationFound, summation, returnInstruction) {
    var str = ''+
    'vec4 idAdjMatrix(float nodeId, vec3 currentPos, vec3 currentDir, float numOfConnections, float currentTimestamp, float bornDate, float dieDate) {\n'+
        initVars+

        'float num = currentAdjMatrix/numberOfColumns;\n'+
        'float rowAdjMat = floor(num);\n'+
        'float colAdjMat = float(int( fract(num)*numberOfColumns ));\n'+
        'float initA = colAdjMat*widthAdjMatrix;\n'+
        'float initB = rowAdjMat*widthAdjMatrix;\n'+

        'if(nodeId >= initA && nodeId < (initA+widthAdjMatrix)) {\n'+

            'for(int n=0; n < 4096; n++) {\n'+
                'float idb = float(n)+initB;\n'+
                'if(idb >= nodesCount) break;\n'+
                'if(idb != nodeId) {'+
                    'vec2 xAdjMat = get_global_id(vec2(nodeId-initA, float(n)), widthAdjMatrix);'+
                    'float it = adjacencyMatrix[xAdjMat];\n'+

                    relationFound+

                '}'+
            '}'+

            summation+

        '}'+

        returnInstruction+
    '}';

    return str;
};