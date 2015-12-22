/** @private **/
function VFP_NODE(customArgs, customCode) { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // vertex head
       		['varying vec4 vVertexColor;\n'+
       		'varying vec2 vVertexUV;\n'+
       		'varying float vUseTex;\n'+
       		'varying vec4 vWNMatrix;\n'+
			//'uniform sampler2D posXYZW;\n'+
			//'uniform sampler2D posXYZW_opposite;\n'+

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
       		['void main(float4* data,'+ // data = 0: nodeId, 1: linkId, 2: oppositeId, 3: isTarget
       		 	'float* letterId,'+
       		 	'float* nodeImgId,'+
       			'float4*kernel posXYZW,'+
       			//'float4*kernel posXYZW_opposite,'+
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
       			'float nodeImgColumns,'+
       			'float fontImgColumns,'+
       			customArgs+') {'+
       				'vec2 x = get_global_id();'+
					'vec2 xx = get_global_id(data[x].x);'+
					'vec2 x_opposite = get_global_id(data[x].z);'+

					//'vec4 nodePosition = texture2D(posXYZW, xx);\n'+
					//'vec4 XYZW_opposite = texture2D(posXYZW_opposite, x_opposite);\n'+
					'vec4 nodePosition = posXYZW[xx];\n'+
					'vec4 XYZW_opposite = posXYZW[x_opposite];\n'+

   				'vec4 nodeVertexPosition = nodeVertexPos[x];\n'+
   				'vec4 nodeVertexTex = nodeVertexTexture[x];\n'+
   				'vec4 nodeVertexColor = vec4(1.0, 1.0, 1.0, 1.0);\n'+

					'float isTarget = data[x].w;'+

       				'vVertexUV = vec2(-1.0, -1.0);'+

       				'mat4 nodepos = nodeWMatrix;'+

       				'if(isNode == 1.0) {'+
	   					'mat4 mm = rotationMatrix(vec3(1.0,0.0,0.0), (3.1416/2.0)*3.0);'+
	   					'nodepos = nodepos*mm;'+
	   					'float nodeImgId = nodeImgId[x];'+

	   					'if(nodeImgId != -1.0) {'+
	   						'vUseTex = 1.0;'+
	   						'vVertexUV = get2Dfrom1D(nodeImgId, nodeImgColumns)+vec2(nodeVertexTexture.x/nodeImgColumns,nodeVertexTexture.y/nodeImgColumns);'+
	   					'}'+
	   				'}'+
	   				'if(isLink == 1.0) {'+

		       		'}'+
       				'if(isArrow == 1.0) {'+
       					'mat4 pp = lookAt(vec3(XYZW_opposite.x, XYZW_opposite.y, XYZW_opposite.z), vec3(nodePosition.x, nodePosition.y, nodePosition.z), vec3(0.0, 1.0, 0.0));'+
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

       					'mat4 mm = rotationMatrix(vec3(1.0,0.0,0.0), 3.1416/2.0);'+
       					'mat4 mmB = rotationMatrix(vec3(0.0,0.0,1.0), -3.1416/4.0);'+
       					'nodepos = nodepos*(mm*mmB);'+

       					'vec3 dir = normalize(vec3(XYZW_opposite.x, XYZW_opposite.y, XYZW_opposite.z)-vec3(nodePosition.x, nodePosition.y, nodePosition.z));'+
       					'nodePosition = nodePosition+(vec4(dir,1.0)*0.565);'+
       				'}'+
       				'if(isNodeText == 1.0) {'+
       					'float letId = letterId[x];\n'+
       					'mat4 mm = rotationMatrix(vec3(1.0,0.0,0.0), (3.1416/2.0)*3.0);'+
       					'nodepos = nodepos*mm;'+

       					'vVertexUV = get2Dfrom1D(letId, fontImgColumns)+vec2(nodeVertexTexture.x/fontImgColumns,nodeVertexTexture.y/fontImgColumns);'+
       					'nodeVertexPosition = vec4(nodeVertexPosition.x*0.1, nodeVertexPosition.y*0.1, nodeVertexPosition.z*0.1, 1.0);'+
       				'}'+
       				'nodepos[3][0] = nodePosition.x;'+
       				'nodepos[3][1] = nodePosition.y;'+
       				'nodepos[3][2] = nodePosition.z;'+

       				'mat4 nodeposG = nodeWMatrix;'+
       				'vWNMatrix = nodeposG * nodeVertexNormal[x];\n'+

       				customCode+

       				'vVertexColor = nodeVertexColor;'+

       				'gl_Position = PMatrix * cameraWMatrix * nodepos * nodeVertexPosition;\n'+
       		'}'],

       		// fragment head
       		['varying vec4 vVertexColor;\n'+
       		'varying vec2 vVertexUV;\n'+
       		'varying float vUseTex;\n'+
       		 'varying vec4 vWNMatrix;\n'],

       		[// fragment source
       		 'void main(float4* fontsImg,'+
       		 			'float4* nodesImg,'+
       		 			'float isNode,'+
       		 			'float isLink,'+
       		 			'float isArrow,'+
       		 			'float isNodeText) {'+
       		 	'vec2 x = get_global_id();'+

       			'if(isNode == 1.0) {'+
	       			'gl_FragColor = vVertexColor;\n'+

	       			'if(vUseTex == 1.0)'+
	       				'gl_FragColor = texture2D(nodesImg, vVertexUV.xy)*vVertexColor;\n'+
	       		'}'+
	       		'if(isLink == 1.0) {'+
	       			'gl_FragColor = vVertexColor;\n'+
	       		'}'+
	       		'if(isArrow == 1.0) {'+
	       			'gl_FragColor = vVertexColor;\n'+
	       		'}'+
       			'if(isNodeText == 1.0) {'+
       				'gl_FragColor = texture2D(fontsImg, vVertexUV.xy);\n'+
       			'}'+
       		 '}']];

       	return str_vfp;
	};
};
VFP_NODE.prototype = Object.create(VFP.prototype);
VFP_NODE.prototype.constructor = VFP_NODE;
