/** @private **/
function VFP_NODEPICKDRAG() { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // vertex head
       		['varying vec4 vColor;\n'+
			//'uniform sampler2D posXYZW;\n'+
       		new Utils().packGLSLFunctionString()+
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
       		['void main(float4* data,'+
                'float4*kernel dataB,'+
       			'float4*kernel posXYZW,'+
       			'float4* nodeVertexPos,'+
                'float currentTimestamp,'+
       			'mat4 PMatrix,'+
       			'mat4 cameraWMatrix,'+
       			'mat4 nodeWMatrix) {'+
       				'vec2 x = get_global_id();'+
					'vec2 xx = get_global_id(data[x].x);'+

                    'float bornDate = dataB[xx].x;'+
                    'float dieDate = dataB[xx].y;'+

					//'vec4 nodePosition = texture2D(posXYZW, xx);\n'+
       				'vec4 nodePosition = posXYZW[xx];\n'+
       				'mat4 nodepos = nodeWMatrix;'+

   					'mat4 mm = rotationMatrix(vec3(1.0,0.0,0.0), (3.1416/2.0)*3.0);'+
   					'nodepos = nodepos*mm;'+

       				'nodepos[3][0] = nodePosition.x;'+
       				'nodepos[3][1] = nodePosition.y;'+
       				'nodepos[3][2] = nodePosition.z;'+

                    'vColor = vec4(1.0, 1.0, 1.0, 1.0);'+
                    'if(dieDate != -1.0) '+
                        'if(currentTimestamp > bornDate && currentTimestamp < dieDate) '+
       				        'vColor = pack((data[x].x+1.0)/1000000.0);'+

                    'if(vColor.x == 1.0 && vColor.y == 1.0 && vColor.z == 1.0 && vColor.w == 1.0) '+
                        'nodepos[3][0] = 10000.0;'+

       				'gl_Position = PMatrix * cameraWMatrix * nodepos * nodeVertexPos[x];\n'+
					'gl_PointSize = 10.0;\n'+
       		'}'],

       		// fragment head
       		['varying vec4 vColor;\n'],

       		[// fragment source
       		 'void main() {'+
       		 	//'vec2 x = get_global_id();'+

       			'gl_FragColor = vColor;\n'+
       		 '}']];

       	return str_vfp;
	};
};
VFP_NODEPICKDRAG.prototype = Object.create(VFP.prototype);
VFP_NODEPICKDRAG.prototype.constructor = VFP_NODEPICKDRAG;
