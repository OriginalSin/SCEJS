/** @private **/
function VFP_NODEPICKDRAG() { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // vertex head
       		['varying vec4 vColor;\n'+
       		new Utils().packGLSLFunctionString()],
       		
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