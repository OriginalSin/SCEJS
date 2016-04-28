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

'CalculationResponse calculate(int connectionExists, vec2 xx_oppo, vec3 currentPos, vec3 currentDir, vec3 atraction, float acumAtraction, vec3 repulsion) {'+
    'float radius = 4.0;\n'+
    'float collisionExists = 0.0;\n'+

    'vec3 currentPosB = posXYZW[xx_oppo].xyz;\n'+
    'vec3 currentDirB = dir[xx_oppo].xyz;\n'+

    'vec3 dirToB = (currentPosB-currentPos);\n'+
    'vec3 dirToBN = normalize(dirToB);\n'+
    'float dist = distance(currentPosB, currentPos);\n'+ // near=0.0 ; far=1.0

    // SPHERICAL COLLISION
    'if(enableForceLayoutCollision == 1.0 && dist < radius) {'+
        'collisionExists = 1.0;'+
        'atraction = sphericalColl(currentDir, currentDirB, dirToBN);'+
    '} else {'+ // end spherical collision
        'if(connectionExists == 1) {'+
            'atraction += dirToBN*dist*0.5;\n'+
            'atraction += dirToBN*-10.0;\n'+

            'acumAtraction += 1.0;\n'+
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

var AdjMatrix_ForceLayout_relationFound = ''+
'CalculationResponse calcResponse = calculate(connectionExists, xx_oppo, currentPos, currentDir, atraction, acumAtraction, repulsion);'+
'atraction = calcResponse.atraction;'+
'acumAtraction = calcResponse.acumAtraction;'+
'repulsion = calcResponse.repulsion;'+
'if(calcResponse.collisionExists == 1.0) {'+
    'collisionExists = 1.0;'+
    'force = calcResponse.atraction;'+
    'break;'+
'}';

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
var AdjMatrix_ForceLayout_initVars = ''+
    'vec3 atraction = vec3(0.0, 0.0, 0.0);'+
    'float acumAtraction = 1.0;'+
    'vec3 repulsion = vec3(0.0, 0.0, 0.0);'+

    'float collisionExists = 0.0;\n'+
    'vec3 force = vec3(0.0, 0.0, 0.0);\n';

var AdjMatrix_ForceLayout_relationFound = ''+
    'CalculationResponse calcResponse = calculate(connectionExists, xx_oppo, currentPos, currentDir, atraction, acumAtraction, repulsion);'+
    'atraction = calcResponse.atraction;'+
    'acumAtraction = calcResponse.acumAtraction;'+
    'repulsion = calcResponse.repulsion;'+
    'if(calcResponse.collisionExists == 1.0) {'+
    'collisionExists = 1.0;'+
    'force = calcResponse.atraction;'+
    'break;'+
    '}';

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





var adjMatrix_GLSLFunctionString = function(initVars, relationFound, summation, returnInstruction) {
    var str = ''+
    'vec4 calculateAdjMatrixForce(float nodeId, vec3 currentPos, vec3 currentDir) {\n'+
        initVars+

        'float ts = 1.0/(widthAdjMatrix-1.0);\n'+

        'float num = currentAdjMatrix/numberOfColumns;\n'+
        'float rowAdjMat = floor(num);\n'+
        'float colAdjMat = float(int( fract(num)*numberOfColumns ));\n'+

        'float initA = colAdjMat*widthAdjMatrix;\n'+
        'if(nodeId >= initA && nodeId < (initA+widthAdjMatrix)) {\n'+
            'for(int n=0; n < 4096; n++) {\n'+
                'float initB = rowAdjMat*widthAdjMatrix;\n'+
                'float idb = float(n)+initB;\n'+

                'if(idb >= nodesCount) break;\n'+

                'vec2 xx_oppo = get_global_id(idb);\n'+

                'float xN = (nodeId-initA)*ts;\n'+
                'float yN = float(n)*ts;\n'+
                'vec4 it = texture2D(adjacencyMatrix, vec2(xN, yN));\n'+

                'if(idb != nodeId) {'+
                    'int connectionExists = (it.x > 0.5) ? 1 : 0;'+

                    relationFound+
                '}'+
            '}'+

            summation+
        '}'+

        returnInstruction+
    '}';

    return str;
};