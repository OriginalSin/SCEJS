/** @private **/
function VFP_NODEPICKDRAG() { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // vertex head
       		['varying vec4 vColor;\n'+
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
       		['void main(float* nodeId,'+
       			'float4*kernel posXYZW,'+
       			'float4* nodeVertexPos,'+
       			'mat4 PMatrix,'+
       			'mat4 cameraWMatrix,'+
       			'mat4 nodeWMatrix) {'+
       				'vec2 x = get_global_id();'+
       		 
       				'vec4 nodePosition = posXYZW[x];\n'+       								
       				'mat4 nodepos = nodeWMatrix;'+
       				
   					'mat4 mm = rotationMatrix(vec3(1.0,0.0,0.0), (3.1416/2.0)*3.0);'+
   					'nodepos = nodepos*mm;'+
   					
       				'nodepos[3][0] = nodePosition.x;'+
       				'nodepos[3][1] = nodePosition.y;'+
       				'nodepos[3][2] = nodePosition.z;'+       				
       							
       				'vColor = pack((nodeId[x]+1.0)/1000000.0);'+
       				'gl_Position = PMatrix * cameraWMatrix * nodepos * nodeVertexPos[x];\n'+
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