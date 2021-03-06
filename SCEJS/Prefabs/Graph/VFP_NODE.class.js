/** @private **/
function VFP_NODE(customCode, geometryLength) {
	this.getSrc = function() {
        return [["RGB"],

            //██╗   ██╗███████╗██████╗ ████████╗███████╗██╗  ██╗    ██╗  ██╗███████╗ █████╗ ██████╗
            //██║   ██║██╔════╝██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝    ██║  ██║██╔════╝██╔══██╗██╔══██╗
            //██║   ██║█████╗  ██████╔╝   ██║   █████╗   ╚███╔╝     ███████║█████╗  ███████║██║  ██║
            //╚██╗ ██╔╝██╔══╝  ██╔══██╗   ██║   ██╔══╝   ██╔██╗     ██╔══██║██╔══╝  ██╔══██║██║  ██║
            // ╚████╔╝ ███████╗██║  ██║   ██║   ███████╗██╔╝ ██╗    ██║  ██║███████╗██║  ██║██████╔╝
            //  ╚═══╝  ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝
       		'varying vec4 vVertexColor;\n'+
       		'varying vec2 vVertexUV;\n'+
       		'varying float vUseTex;\n'+
       		'varying vec4 vWNMatrix;\n'+
       		'varying float vDist;\n'+
            'varying float vVisibility;\n'+
       		'varying float vIsSelected;\n'+
            'varying float vIsHover;\n'+
       		'varying float vUseCrosshair;\n'+
       		'varying float vIstarget;\n'+
       		
       		'vec2 get2Dfrom1D(float idx, float columns) {'+
       			'float n = idx/columns;'+
       			'float row = float(int(n));'+
       			'float col = fract(n)*columns;'+

       			'float ts = 1.0/columns;'+
       			'return vec2(ts*col, ts*row);'+
       		'}'+
       		 'mat4 lookAt(vec3 eye, vec3 center, vec3 up) {'+
       		     'vec3 zaxis = normalize(center - eye);'+
       		     'vec3 xaxis = normalize(cross(up, zaxis));'+
       		     'vec3 yaxis = cross(zaxis, xaxis);'+

       		     'mat4 matrix;'+
       		     //Column Major
       		     'matrix[0][0] = xaxis.x;'+
       		     'matrix[1][0] = yaxis.x;'+
       		     'matrix[2][0] = zaxis.x;'+
       		     'matrix[3][0] = 0.0;'+

       		     'matrix[0][1] = xaxis.y;'+
       		     'matrix[1][1] = yaxis.y;'+
       		     'matrix[2][1] = zaxis.y;'+
       		     'matrix[3][1] = 0.0;'+

       		     'matrix[0][2] = xaxis.z;'+
       		     'matrix[1][2] = yaxis.z;'+
       		     'matrix[2][2] = zaxis.z;'+
       		     'matrix[3][2] = 0.0;'+

       		     'matrix[0][3] = -dot(xaxis, eye);'+
       		     'matrix[1][3] = -dot(yaxis, eye);'+
       		     'matrix[2][3] = -dot(zaxis, eye);'+
       		     'matrix[3][3] = 1.0;'+

       		     'return matrix;'+
       		 '}'+
       		 'mat4 transpose(mat4 m) {'+
       			  'return mat4(  m[0][0], m[1][0], m[2][0], m[3][0],'+
       			                'm[0][1], m[1][1], m[2][1], m[3][1],'+
       			  				'm[0][2], m[1][2], m[2][2], m[3][2],'+
       			  				'm[0][3], m[1][3], m[2][3], m[3][3]);'+
       		'}'+
       		'mat4 rotationMatrix(vec3 axis, float angle) {'+
       			'axis = normalize(axis);'+
       			'float s = sin(angle);'+
       			'float c = cos(angle);'+
       			'float oc = 1.0 - c;'+

       			'return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,'+
       			'oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,'+
       			'oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,'+
       			'0.0,                                0.0,                                0.0,                                1.0);'+
       		'}'+

            adjMatrix_Autolink_GLSLFunctionString(geometryLength)+

            new Utils().degToRadGLSLFunctionString()+
            new Utils().radToDegGLSLFunctionString()+
            new Utils().cartesianToSphericalGLSLFunctionString()+
            new Utils().sphericalToCartesianGLSLFunctionString()+
            new Utils().getVectorGLSLFunctionString()+
            'vec3 getVV(vec3 crB, float acum) {'+
                'vec3 ob = cartesianToSpherical(crB);'+
                'float angleLat = ob.y;'+
                'float angleLng = ob.z;'+

                'float desvLat = 0.0;'+ // (vecNoise.x*180.0)-90.0
                'float desvLng = 10.0;'+ // (vecNoise.x*180.0)-90.0
                    //'angleLat += (degrees*desvLat);'+
                'angleLng += (acum*desvLng);'+

                'return sphericalToCartesian(vec3(1.0, angleLat, angleLng));'+
            '}'+
            'float getOddEven(float repeatId) {'+
                'return (ceil(fract(repeatId/2.0)) == 0.0) ? 1.0*floor(repeatId/2.0) : -1.0*floor(repeatId/2.0);'+
            '}'+
            'vec3 getFirstDispl(float nodeId, vec4 nodePosition, float repeatId) {'+
                'float repeatDistribution = -0.1;'+
                // first check output edges of own node and return the node (textCoord for get posXYZW) with max available angle to the right
                'vec4 adjMatrix = idAdjMatrix_Autolink(nodeId, nodePosition.xyz);'+
                'vec3 initialVec = normalize(posXYZW[adjMatrix.xy].xyz-nodePosition.xyz)*vec3(1.0, -1.0, 1.0);'+
                'float totalAngleRelations = adjMatrix.z;'+
                // then first sum half of available angle received
                'initialVec = getVV(initialVec, (totalAngleRelations/2.0)*repeatDistribution);'+
                // and now left or right (oddEven)
                'return getVV(initialVec, getOddEven(repeatId)*totalAngleRelations*0.01);'+
            '}'+
            'float checkLinkArrowVisibility(float currentTimestamp, float bornDate, float dieDate, float bornDateOpposite, float dieDateOpposite, float linkBornDate, float linkDieDate) {'+
                'float visible =1.0;'+
                'if(dieDate != 0.0) {'+
                    'if((currentTimestamp < bornDate || currentTimestamp > dieDate) || (currentTimestamp < bornDateOpposite || currentTimestamp > dieDateOpposite)) {'+
                        'visible = 0.0;'+
                    '} else {'+
                        // now check link
                        'if(linkDieDate != 0.0) {'+
                            'if(currentTimestamp < linkBornDate || currentTimestamp > linkDieDate) {'+
                                'visible = 0.0;'+
                            '}'+
                        '}'+
                    '}'+
                '} else {'+
                    // now check link
                    'if(linkDieDate != 0.0) {'+
                        'if(currentTimestamp < linkBornDate || currentTimestamp > linkDieDate) {'+
                            'visible = 0.0;'+
                        '}'+
                    '}'+
                '}'+
                'return visible;'+
            '}',



            //██╗   ██╗███████╗██████╗ ████████╗███████╗██╗  ██╗    ███████╗ ██████╗ ██╗   ██╗██████╗  ██████╗███████╗
            //██║   ██║██╔════╝██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝    ██╔════╝██╔═══██╗██║   ██║██╔══██╗██╔════╝██╔════╝
            //██║   ██║█████╗  ██████╔╝   ██║   █████╗   ╚███╔╝     ███████╗██║   ██║██║   ██║██████╔╝██║     █████╗
            //╚██╗ ██╔╝██╔══╝  ██╔══██╗   ██║   ██╔══╝   ██╔██╗     ╚════██║██║   ██║██║   ██║██╔══██╗██║     ██╔══╝
            // ╚████╔╝ ███████╗██║  ██║   ██║   ███████╗██╔╝ ██╗    ███████║╚██████╔╝╚██████╔╝██║  ██║╚██████╗███████╗
            //  ╚═══╝  ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝    ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚══════╝
            'float nodeId = data[].x;'+
            'float nodeIdOpposite = data[].y;'+

            'vec2 xGeometryNode = get_global_id(nodeId, bufferNodesWidth, '+geometryLength.toFixed(1)+');'+ // bufferWidth6, geometryLength
            'vec2 xGeometryNode_opposite = get_global_id(nodeIdOpposite, bufferNodesWidth, '+geometryLength.toFixed(1)+');'+

            'vec2 xGeometryLinks = get_global_id(nodeId, bufferLinksWidth, 2.0);'+ // bufferWidth, geometryLength
            'vec2 xGeometryLinks_opposite = get_global_id(nodeIdOpposite, bufferLinksWidth, 2.0);'+

            'vec2 xGeometryArrows = get_global_id(nodeId, bufferArrowsWidth, 3.0);'+ // bufferWidth, geometryLength
            'vec2 xGeometryArrows_opposite = get_global_id(nodeIdOpposite, bufferArrowsWidth, 3.0);'+

            'vec2 xGeometryText = get_global_id(nodeId, bufferTextsWidth, 4.0*12.0);'+ // bufferWidth, geometryLength
            'vec2 xGeometryText_opposite = get_global_id(nodeIdOpposite, bufferTextsWidth, 4.0*12.0);'+


            /*'vec2 xGeometryCurrent;'+
            'vec2 xGeometryCurrent_opposite;'+
            'if(isNode == 1.0) {'+
                'xGeometryCurrent = xGeometryNode;'+
                'xGeometryCurrent_opposite = xGeometryNode_opposite;'+
            '}'+
            'if(isLink == 1.0) {'+
                'xGeometryCurrent = xGeometryLinks;'+
                'xGeometryCurrent_opposite = xGeometryLinks_opposite;'+
            '}'+
            'if(isArrow == 1.0) {'+
                'xGeometryCurrent = xGeometryArrows;'+
                'xGeometryCurrent_opposite = xGeometryArrows_opposite;'+
            '}'+
            'if(isNodeText == 1.0) {'+
                'xGeometryCurrent = xGeometryText;'+
                'xGeometryCurrent_opposite = xGeometryText_opposite;'+
            '}'+*/

            'vec4 nodePosition = posXYZW[xGeometryNode];\n'+
            'vec3 XYZW_opposite = posXYZW[xGeometryNode_opposite].xyz;\n'+

            'float linkBornDate = dataC[].x;'+
            'float bornDate = dataB[xGeometryNode].x;'+
            'float bornDateOpposite = dataB[xGeometryNode_opposite].x;'+

            'float linkDieDate = dataC[].y;'+
            'float dieDate = dataB[xGeometryNode].y;'+
            'float dieDateOpposite = dataB[xGeometryNode_opposite].y;'+

            'float networkProcData = dataB[xGeometryNode].z;'+




            'vec4 nodeVertexPosition = nodeVertexPos[];\n'+
            'vec4 nodeVertexTex = nodeVertexTexture[];\n'+
            'vec4 nodeVertexColor = vec4(1.0, 1.0, 1.0, 1.0);\n'+

            'vec3 dir = XYZW_opposite-vec3(nodePosition.x, nodePosition.y, nodePosition.z);'+
            'float dist = length(dir);'+
            'float vertexCount = 1.0;'+
            'float lineIncrements = dist/vertexCount;'+
            'vec3 dirN = normalize(dir);'+

            'float OFFSET = 1000.0;'+

            'float currentLineVertex = data[].z;'+ // this is isTarget for arrows
            'float repeatId = data[].w;'+

            'vec3 cr = cross(dirN, vec3(0.0, 1.0, 0.0));'+
            'float currentLineVertexSQRT = abs( currentLineVertex-(vertexCount/2.0) )/(vertexCount/2.0);'+
            'currentLineVertexSQRT = sqrt(1.0-currentLineVertexSQRT);'+

            'vVertexUV = vec2(-1.0, -1.0);'+
            'vDist = max(0.3, 1.0-(distance(nodePosition.xyz, XYZW_opposite)*0.01));\n'+ // dist/acum

            'mat4 nodepos = nodeWMatrix;'+


            'if(isNode == 1.0) {'+
                'nodePosition += vec4(0.0, 0.1, 0.0, 1.0);'+

                'mat4 mm = rotationMatrix(vec3(1.0,0.0,0.0), (3.1416/2.0)*3.0);'+
                'nodepos = nodepos*mm;'+
                'float nodeImgId = nodeImgId[];'+

                'if(nodeImgId != -1.0) {'+
                    'vUseTex = 1.0;'+
                    'vVertexUV = get2Dfrom1D(nodeImgId, nodeImgColumns)+vec2(nodeVertexTexture.x/nodeImgColumns,nodeVertexTexture.y/nodeImgColumns);'+
                '}'+

                'if(dieDate != 0.0) {'+
                    'if(currentTimestamp < bornDate || currentTimestamp > dieDate)'+
                        'vVisibility = 0.0;'+
                '}'+

                'if(enableNeuronalNetwork == 1.0) {'+
                    'if(networkProcData == 0.0) {'+
                        'nodeVertexColor = vec4(0.2, 0.2, 0.2, 1.0);'+
                    '} else {'+
                        'if(networkProcData > 0.0)'+
                            'nodeVertexColor = vec4(0.0, abs(networkProcData), 0.0, 1.0);'+
                        ' else if(networkProcData < 0.0) '+
                            'nodeVertexColor = vec4(abs(networkProcData), 0.0, 0.0, 1.0);'+
                    '}'+


                '}'+

                'vVisibility = 1.0;'+
                'vIsSelected = (idToDrag == data[].x) ? 1.0 : 0.0;'+
                'vIsHover = (idToHover == data[].x) ? 1.0 : 0.0;'+
            '}'+
            'if(isLink == 1.0) {'+
                'if(xGeometryLinks != xGeometryLinks_opposite) {'+
                    // displacing from center to first point
                    'nodePosition += vec4(dirN*(lineIncrements*currentLineVertex), 1.0);'+

                    // displacing from first point to cross direction (repeatId)
                    'if(currentLineVertex != 0.0 && currentLineVertex != vertexCount) '+
                        'nodePosition += vec4(cr*currentLineVertexSQRT*getOddEven(repeatId)*4.0, 1.0);'+
                '} else {'+ // is Autolink
                    'float currentLineVertexMM = abs( currentLineVertex-(vertexCount/2.0) );'+
                    'currentLineVertexMM = (vertexCount/2.0)-currentLineVertexMM;'+

                    // displacing from center to first point
                    'vec3 initialVec = getFirstDispl(nodeId, nodePosition, repeatId);'+
                    'nodePosition += vec4(initialVec*(5.0*currentLineVertexMM), 1.0);'+

                    // displacing from first point to cross direction (repeatId)
                    'if(currentLineVertex != 0.0 && currentLineVertex != vertexCount) {'+
                        'float sig = (currentLineVertex > (vertexCount/2.0)) ? 1.0 : -1.0;'+

                        'vec3 crB = cross(vec3(0.0, 1.0, 0.0), initialVec);'+

                        'float hhSCount = (vertexCount/2.0)/2.0;'+
                        'float currentLineVertexMMB = hhSCount-(abs(currentLineVertexMM-hhSCount));'+
                        'nodePosition += vec4((crB*sig)*currentLineVertexMMB*1.0, 1.0);'+
                    '}'+
                '}'+

                'vVisibility = checkLinkArrowVisibility(currentTimestamp, bornDate, dieDate, bornDateOpposite, dieDateOpposite, linkBornDate, linkDieDate);'+
                'vIsSelected = (idToDrag == data[].x || idToDrag == data[].y) ? 1.0 : 0.0;'+
                'vIsHover = (idToHover == data[].x || idToHover == data[].y) ? 1.0 : 0.0;'+
            '}'+
            'if(isArrow == 1.0) {'+
                'vec3 nodePositionTMP;'+
                'if(xGeometryArrows != xGeometryArrows_opposite) {'+
                    // displacing from center to first point
                    'float currentLineVertexU = vertexCount-1.0;'+
                    'nodePositionTMP = XYZW_opposite+((dirN*-1.0)*(lineIncrements*currentLineVertexU));'+

                    // displacing from first point to cross direction (repeatId)
                    'nodePositionTMP -= cr*(currentLineVertexSQRT*getOddEven(repeatId)*4.0);'+

                '} else {'+ // is Autolink
                    'float currentLineVertexU = vertexCount-1.0;'+
                    'float currentLineVertexMM = abs( currentLineVertexU-(vertexCount/2.0) );'+
                    'currentLineVertexMM = (vertexCount/2.0)-currentLineVertexMM;'+

                    // displacing from center to first point
                    'vec3 initialVec = getFirstDispl(nodeId, nodePosition, repeatId);'+
                    'nodePositionTMP = XYZW_opposite+(initialVec*(5.0*currentLineVertexMM));'+

                    // displacing from first point to cross direction (repeatId)
                    'if(currentLineVertex != 0.0 && currentLineVertex != vertexCount) {'+
                        'float sig = (currentLineVertex > (vertexCount/2.0)) ? 1.0 : -1.0;'+

                        'vec3 crB = cross(vec3(0.0, 1.0, 0.0), initialVec);'+

                        'float hhSCount = (vertexCount/2.0)/2.0;'+
                        'float currentLineVertexMMB = hhSCount-(abs(currentLineVertexMM-hhSCount));'+

                        'nodePositionTMP += (crB*sig)*currentLineVertexMMB*1.0;'+
                        //'nodePositionTMP -= vec4((crB*sig)*(currentLineVertexSQRT*(repeatId+1.0)*4.0), 1.0);'+
                    '}'+
                '}'+

                'mat4 pp = lookAt(nodePositionTMP, vec3(nodePosition.x, nodePosition.y, nodePosition.z), vec3(0.0, 1.0, 0.0));'+
                'pp = transpose(pp);'+
                'nodepos[0][0] = pp[0][0];'+
                'nodepos[0][1] = pp[1][0];'+
                'nodepos[0][2] = pp[2][0];'+

                'nodepos[1][0] = pp[0][1];'+
                'nodepos[1][1] = pp[1][1];'+
                'nodepos[1][2] = pp[2][1];'+

                'nodepos[2][0] = pp[0][2];'+
                'nodepos[2][1] = pp[1][2];'+
                'nodepos[2][2] = pp[2][2];'+

                // displace from center to node border
                'dir = nodePositionTMP-vec3(nodePosition.x, nodePosition.y, nodePosition.z);'+
                'nodePosition += vec4(normalize(dir),1.0)*2.0;'+

                'vVisibility = checkLinkArrowVisibility(currentTimestamp, bornDate, dieDate, bornDateOpposite, dieDateOpposite, linkBornDate, linkDieDate);'+
                'vIsSelected = (idToDrag == data[].x || idToDrag == data[].y) ? 1.0 : 0.0;'+
                'vIsHover = (idToHover == data[].x || idToHover == data[].y) ? 1.0 : 0.0;'+
            '}'+
            'if(isNodeText == 1.0) {'+
                'float letId = letterId[];\n'+
                'mat4 mm = rotationMatrix(vec3(1.0,0.0,0.0), (3.1416/2.0)*3.0);'+
                'nodepos = nodepos*mm;'+

                'vVertexUV = get2Dfrom1D(letId, fontImgColumns)+vec2(nodeVertexTexture.x/fontImgColumns,nodeVertexTexture.y/fontImgColumns);'+
                'nodeVertexPosition = vec4(nodeVertexPosition.x*0.1, nodeVertexPosition.y*0.1, nodeVertexPosition.z*0.1, 1.0);'+
                'nodePosition.z += 2.5;'+

                'vVisibility = 1.0;'+
                'vIsSelected = (idToDrag == data[].x) ? 1.0 : 0.0;'+
                'vIsHover = (idToHover == data[].x) ? 1.0 : 0.0;'+
            '}'+
            'nodepos[3][0] = nodePosition.x;'+
            'nodepos[3][1] = nodePosition.y;'+
            'nodepos[3][2] = nodePosition.z;'+

            'mat4 nodeposG = nodeWMatrix;'+
            'vWNMatrix = nodeposG * nodeVertexNormal[];\n'+

            'vUseCrosshair = 0.0;'+
            'vIstarget = (currentLineVertex == 1.0) ? 1.0 : 0.0;'+

            customCode+
            'vVertexColor = nodeVertexColor;'+



            'gl_Position = PMatrix * cameraWMatrix * nodepos * nodeVertexPosition;\n',


            //███████╗██████╗  █████╗  ██████╗ ███╗   ███╗███████╗███╗   ██╗████████╗    ██╗  ██╗███████╗ █████╗ ██████╗
            //██╔════╝██╔══██╗██╔══██╗██╔════╝ ████╗ ████║██╔════╝████╗  ██║╚══██╔══╝    ██║  ██║██╔════╝██╔══██╗██╔══██╗
            //█████╗  ██████╔╝███████║██║  ███╗██╔████╔██║█████╗  ██╔██╗ ██║   ██║       ███████║█████╗  ███████║██║  ██║
            //██╔══╝  ██╔══██╗██╔══██║██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║       ██╔══██║██╔══╝  ██╔══██║██║  ██║
            //██║     ██║  ██║██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║   ██║       ██║  ██║███████╗██║  ██║██████╔╝
            //╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝
       		'varying vec4 vVertexColor;\n'+
       		'varying vec2 vVertexUV;\n'+
       		'varying float vUseTex;\n'+
       		'varying vec4 vWNMatrix;\n'+
       		'varying float vDist;\n'+
            'varying float vVisibility;\n'+
       		'varying float vIsSelected;\n'+
            'varying float vIsHover;\n'+
       		'varying float vUseCrosshair;\n'+
       		'varying float vIstarget;\n',

            //███████╗██████╗  █████╗  ██████╗ ███╗   ███╗███████╗███╗   ██╗████████╗    ███████╗ ██████╗ ██╗   ██╗██████╗  ██████╗███████╗
            //██╔════╝██╔══██╗██╔══██╗██╔════╝ ████╗ ████║██╔════╝████╗  ██║╚══██╔══╝    ██╔════╝██╔═══██╗██║   ██║██╔══██╗██╔════╝██╔════╝
            //█████╗  ██████╔╝███████║██║  ███╗██╔████╔██║█████╗  ██╔██╗ ██║   ██║       ███████╗██║   ██║██║   ██║██████╔╝██║     █████╗
            //██╔══╝  ██╔══██╗██╔══██║██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║       ╚════██║██║   ██║██║   ██║██╔══██╗██║     ██╔══╝
            //██║     ██║  ██║██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║   ██║       ███████║╚██████╔╝╚██████╔╝██║  ██║╚██████╗███████╗
            //╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚══════╝
            'vec4 color = vVertexColor;\n'+
            'vec4 colorOrange = vec4(255.0/255.0, 131.0/255.0, 0.0/255.0, 1.0);'+
            'vec4 colorOrangeDark = vec4(255.0/255.0, 80.0/255.0, 0.0/255.0, 1.0);'+
            'vec4 colorPurple = vec4(132.0/255.0, 0.0/255.0, 255.0/255.0, 1.0);'+

            'vec4 fcolor = vec4(0.0, 0.0, 0.0, 1.0);'+
            'if(isNode == 1.0) {'+
                'if(vUseTex == 1.0) {'+
                    'vec4 tex;'+
                    'if(vUseCrosshair == 1.0) {'+
                        'tex = nodesImgCrosshair[vVertexUV.xy];'+
                    '} else if(vIsSelected == 1.0) {'+
                        'color = colorOrangeDark;'+
                        'tex = nodesImgCrosshair[vVertexUV.xy];'+
                    '} else if(vIsHover == 1.0) {'+
                        'color = colorPurple;'+
                        'tex = nodesImg[vVertexUV.xy];'+
                    '} else {'+
                        'tex = nodesImg[vVertexUV.xy];'+
                    '}'+
                    'color = '+nodesDrawMode(geometryLength)+';\n'+
                '}'+
                'if(color.a < 0.1) discard;'+
                'fcolor = color;'+
            '} else if(isLink == 1.0) {'+
                'if(vIsSelected == 1.0) {'+
                    'color = colorOrange;'+
                '} else if(vIsHover == 1.0) {'+
                    'color = colorPurple;'+
                '}'+
                'fcolor = vec4(color.rgb*vDist, 1.0);\n'+
            '} else if(isArrow == 1.0) {'+
                'if(vIstarget == 1.0) {'+
                    'if(vIsSelected == 1.0) {'+
                        'color = vec4(colorOrange.rgb*vDist, 1.0);\n'+
                    '} else if(vIsHover == 1.0) {'+
                        'color = vec4(colorPurple.rgb*vDist, 1.0);\n'+
                    '}'+
                '} else {'+
                    'color = vec4(1.0, 0.0, 0.0, 0.0);'+
                '}'+
                'fcolor = color;\n'+
            '} else if(isNodeText == 1.0) {'+
                'fcolor = fontsImg[vVertexUV.xy];\n'+
            '}'+

            'if(vVisibility == 0.0)'+
                 'fcolor = vec4(0.0, 0.0, 0.0, 0.0);'+

            'return [fcolor];'
        ];
	};
}
