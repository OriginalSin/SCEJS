/** @private **/
function VFP_NODE(customArgs, customCode) { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // vertex head
       		['varying vec4 vVertexColor;\n'+
       		'varying vec2 vVertexUV;\n'+
       		'varying float vUseTex;\n'+
       		'varying vec4 vWNMatrix;\n'+
       		'varying float vDist;\n'+
       		'uniform sampler2D adjacencyMatrix;\n'+
       		'varying float vIsSelected;\n'+
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
       		'}'],

       		// vertex source
       		['void main(float4* data,'+ // data = 0: nodeId, 1: oppositeId, 2: linksTargetCount, 3: linksCount
       		 	'float* letterId,'+
       		 	'float* nodeImgId,'+
       		 	//'float*kernel adjacencyMatrix,'+
				'float widthAdjMatrix,'+
       			'float4*kernel posXYZW,'+
       			'float4* nodeVertexPos,'+
       			'float4* nodeVertexNormal,'+
       			'float4* nodeVertexTexture,'+
       			'mat4 PMatrix,'+
       			'mat4 cameraWMatrix,'+
       			'mat4 nodeWMatrix,'+
       			'float isNode,'+
       			'float isLink,'+
       			'float isArrow,'+
       			'float isNodeText,'+
				'float idToDrag,'+
       			'float nodeImgColumns,'+
       			'float fontImgColumns,'+
       			customArgs+') {'+
       				'vec2 x = get_global_id();'+
       				
					'vec2 xx = get_global_id(data[x].x);'+
					'vec2 xx_opposite = get_global_id(data[x].y);'+

					
					'vec4 nodePosition = posXYZW[xx];\n'+  
					'vec4 XYZW_opposite = posXYZW[xx_opposite];\n'+

	   				'vec4 nodeVertexPosition = nodeVertexPos[x];\n'+ 
	   				'vec4 nodeVertexTex = nodeVertexTexture[x];\n'+
	   				'vec4 nodeVertexColor = vec4(1.0, 1.0, 1.0, 1.0);\n'+

                    'vec3 dir = vec3(XYZW_opposite.x, XYZW_opposite.y, XYZW_opposite.z)-vec3(nodePosition.x, nodePosition.y, nodePosition.z);'+
                    'float dist = length(dir);'+
                    'float vertexCount = 3.0;'+
                    'float segmentsCount = vertexCount-1.0;'+
                    'float lineIncrements = dist/segmentsCount;'+
                    'vec3 dirN = normalize(dir);'+

                    'float OFFSET = 1000.0;'+

                    'float currentLineVertex = data[x].z;'+ // this is isTarget for arrows
                    'float repeatId = data[x].w;'+

                    'vec3 cr = cross(dirN, vec3(0.0, 1.0, 0.0));'+
                    'float currentLineVertexSQRT = abs( currentLineVertex-(segmentsCount/2.0) )/(segmentsCount/2.0);'+
                    'currentLineVertexSQRT = sqrt(1.0-currentLineVertexSQRT);'+

       				'vVertexUV = vec2(-1.0, -1.0);'+
                    'vIsSelected = (idToDrag == data[x].x || idToDrag == data[x].y) ? 1.0 : 0.0;'+

       				'mat4 nodepos = nodeWMatrix;'+

       				'if(isNode == 1.0) {'+
	   					'mat4 mm = rotationMatrix(vec3(1.0,0.0,0.0), (3.1416/2.0)*3.0);'+
	   					'nodepos = nodepos*mm;'+
	   					'float nodeImgId = nodeImgId[x];'+

	   					'if(nodeImgId != -1.0) {'+
	   						'vUseTex = 1.0;'+
	   						'vVertexUV = get2Dfrom1D(nodeImgId, nodeImgColumns)+vec2(nodeVertexTexture.x/nodeImgColumns,nodeVertexTexture.y/nodeImgColumns);'+
	   					'}'+
	   					
	   					'vIsSelected = (idToDrag == data[x].x) ? 1.0 : 0.0;'+ 
	   				'}'+
	   				'if(isLink == 1.0) {'+
                        // displacing from center to first point
                        'nodePosition += vec4(dirN*(lineIncrements*currentLineVertex), 1.0);'+

                        // displacing from first point to cross direction (repeatId)
                        'float repeatIsCalculated = (repeatId+1.0);'+
                        'float loc = (ceil(fract(repeatId/2.0)) == 0.0) ? 1.0*floor(repeatIsCalculated/2.0) : -1.0*floor(repeatIsCalculated/2.0);'+
                        'if(currentLineVertex != 0.0 && currentLineVertex != segmentsCount) '+
                            'nodePosition += vec4(cr*(currentLineVertexSQRT*loc*4.0), 1.0);'+
		       		'}'+
       				'if(isArrow == 1.0) {'+
                        // displacing from center to first point
                        'float currentLineVertexU = segmentsCount-1.0;'+
                        'vec4 nodePositionTMP = XYZW_opposite+vec4((dirN*-1.0)*(lineIncrements*currentLineVertexU), 1.0);'+

                        // displacing from first point to cross direction (repeatId)
                        //'float add = ((OFFSET-dist)*0.001*repeatId);'+
                        'float repeatIsCalculated = (repeatId+1.0);'+
                        'float loc = (ceil(fract(repeatId/2.0)) == 0.0) ? 1.0*floor(repeatIsCalculated/2.0) : -1.0*floor(repeatIsCalculated/2.0);'+
                        'nodePositionTMP -= vec4(cr*(currentLineVertexSQRT*loc*4.0), 1.0);'+



                        'mat4 pp = lookAt(vec3(nodePositionTMP.x, nodePositionTMP.y, nodePositionTMP.z), vec3(nodePosition.x, nodePosition.y, nodePosition.z), vec3(0.0, 1.0, 0.0));'+
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
                        'dir = vec3(nodePositionTMP.x, nodePositionTMP.y, nodePositionTMP.z)-vec3(nodePosition.x, nodePosition.y, nodePosition.z);'+
                        'nodePosition += vec4(normalize(dir),1.0)*2.0;'+
       				'}'+
       				'if(isNodeText == 1.0) {'+
       					'float letId = letterId[x];\n'+
       					'mat4 mm = rotationMatrix(vec3(1.0,0.0,0.0), (3.1416/2.0)*3.0);'+
       					'nodepos = nodepos*mm;'+

       					'vVertexUV = get2Dfrom1D(letId, fontImgColumns)+vec2(nodeVertexTexture.x/fontImgColumns,nodeVertexTexture.y/fontImgColumns);'+
       					'nodeVertexPosition = vec4(nodeVertexPosition.x*0.1, nodeVertexPosition.y*0.1, nodeVertexPosition.z*0.1, 1.0);'+
       					
       					'vIsSelected = (idToDrag == data[x].x) ? 1.0 : 0.0;'+ 
       				'}'+
       				'nodepos[3][0] = nodePosition.x;'+
       				'nodepos[3][1] = nodePosition.y;'+
       				'nodepos[3][2] = nodePosition.z;'+

       				'mat4 nodeposG = nodeWMatrix;'+
       				'vWNMatrix = nodeposG * nodeVertexNormal[x];\n'+
       				
       				'vUseCrosshair = 0.0;'+
       				'vIstarget = (currentLineVertex == 1.0) ? 1.0 : 0.0;'+
       				
       				customCode+
       				'vVertexColor = nodeVertexColor;'+     
       				
       				/*'float acum = 1.0;'+
       				'float dist = 0.01;'+
       				'float wh = widthAdjMatrix-1.0;'+
					'float ts = 1.0/wh;'+
					'float xN = data[x].x*ts;'+
					'for(int n=0; n < 1000000; n++) {'+
						'if(n == int(wh)) break;'+

						'float yN = (float(n)*ts);'+

						'float idb = yN*wh;'+
						'vec2 xx_oppo = get_global_id(idb);'+
						'vec3 currentPosB = texture2D(posXYZW, xx_oppo).xyz;\n'+

						'vec4 it = texture2D(adjacencyMatrix, vec2(xN, yN));'+
						'if(it.x > 0.5) {'+
							'float distN = distance(currentPosB, nodePosition.xyz)*0.001;'+ // near=0.0 ; far=1.0

							'if(distN > 0.0) {'+
								'acum += 1.0;'+
								'dist += (1.0-distN);'+
							'}'+
						'}'+
					'}'+*/
					'vDist = 1.0;\n'+ // dist/acum
       				   				
       				
       				'gl_Position = PMatrix * cameraWMatrix * nodepos * nodeVertexPosition;\n'+
       		'}'],

       		// fragment head
       		['varying vec4 vVertexColor;\n'+
       		'varying vec2 vVertexUV;\n'+
       		'varying float vUseTex;\n'+
       		 'varying vec4 vWNMatrix;\n'+
       		'varying float vDist;\n'+
       		'varying float vIsSelected;\n'+
       		'varying float vUseCrosshair;\n'+
       		'varying float vIstarget;\n'],

       		[// fragment source
       		 'void main(float4* fontsImg,'+
       		 			'float4* nodesImg,'+
       		 			'float4* nodesImgCrosshair,'+
       		 			'float isNode,'+
       		 			'float isLink,'+
       		 			'float isArrow,'+
       		 			'float isNodeText) {'+
       		 	'vec2 x = get_global_id();'+
       		 	
       		 	'vec4 color = vVertexColor;\n'+
       		 	'vec4 colorOrange = vec4(255.0/255.0, 131.0/255.0, 0.0/255.0, 1.0);'+
       		 	'vec4 colorOrangeDark = vec4(255.0/255.0, 80.0/255.0, 0.0/255.0, 1.0);'+
       		 	
       			'if(isNode == 1.0) {'+
	       			'if(vUseTex == 1.0) {'+
	       				'vec4 tex;'+
	       				'if(vUseCrosshair == 1.0) {'+
	       					'tex = texture2D(nodesImgCrosshair, vVertexUV.xy);'+
	       				'} else if(vIsSelected == 1.0) {'+
		       				'color = colorOrangeDark;'+
	       					'tex = texture2D(nodesImgCrosshair, vVertexUV.xy);'+	       					
	       				'} else {'+
	       					'tex = texture2D(nodesImg, vVertexUV.xy);'+
	       				'}'+
	       				'color = vec4(tex.rgb*color.rgb, tex.a);\n'+
					'}'+							
					'gl_FragColor = color;'+
	       		'} else if(isLink == 1.0) {'+
	       			'if(vIsSelected == 1.0) {'+
	       				'color = colorOrange;'+
	       			'}'+
	       			'gl_FragColor = vec4(color.rgb, vDist);\n'+
	       		'} else if(isArrow == 1.0) {'+
	       			'if(vIstarget == 1.0) {'+
		       			'if(vIsSelected == 1.0) {'+
		       				'color = colorOrange;'+
			   			'}'+		   				
		   			'} else {'+
		   				'color = vec4(1.0, 0.0, 0.0, 0.0);'+
		   			'}'+
		       		
	       			'gl_FragColor = color;\n'+
	       		'} else if(isNodeText == 1.0) {'+
       				'gl_FragColor = texture2D(fontsImg, vVertexUV.xy);\n'+
       			'}'+
       		 '}']];

       	return str_vfp;
	};
};
VFP_NODE.prototype = Object.create(VFP.prototype);
VFP_NODE.prototype.constructor = VFP_NODE;
