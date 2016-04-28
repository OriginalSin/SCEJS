var calculateAdjMatrixForce_calForceLayout1 = ''+
'vec3 atraction = vec3(0.0, 0.0, 0.0);'+
'float acumAtraction = 1.0;'+
'vec3 repulsion = vec3(0.0, 0.0, 0.0);'+

'float collisionExists = 0.0;\n'+
'vec3 force = vec3(0.0, 0.0, 0.0);\n';

var calculateAdjMatrixForce_calForceLayout2 = ''+
'CalculationResponse calcResponse = calculate(connectionExists, xx_oppo, currentPos, currentDir, atraction, acumAtraction, repulsion);'+
'atraction = calcResponse.atraction;'+
'acumAtraction = calcResponse.acumAtraction;'+
'repulsion = calcResponse.repulsion;'+
'if(calcResponse.collisionExists == 1.0) {'+
    'collisionExists = 1.0;'+
    'force = calcResponse.atraction;'+
    'break;'+
'}';

var calculateAdjMatrixForce_calForceLayout3 = ''+
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

var calculateAdjMatrixForce_calForceLayout4 = 'return vec4(force, collisionExists);';

var calculateAdjMatrixForce_str = function(cal1, cal2, cal3, cal4) {
    var str = ''+
    'vec4 calculateAdjMatrixForce(float nodeId, vec3 currentPos, vec3 currentDir) {\n'+
        cal1+

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

                    cal2+
                '}'+
            '}'+

            cal3+

        '}'+

        cal4+

    '}';

    return str;
};