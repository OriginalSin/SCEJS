/** @private **/
function VFP_GRID() { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
		    // vertex head
			['varying vec4 vVC;\n'],
			
			// vertex source
			['void main(float4* vertexPos,'+
						'float4* vertexColor,'+
						'mat4 PMatrix,'+
						'mat4 cameraWMatrix,'+
						'mat4 nodeWMatrix) {'+
							'vec2 x = get_global_id();'+
					
							'vec4 vp = vertexPos[x];\n'+
							'vec4 vc = vertexColor[x];\n'+
							
							'vVC = vc;'+
											
							'gl_Position = PMatrix * cameraWMatrix * nodeWMatrix * vp;\n'+
			'}'],
			
			// fragment head
			['varying vec4 vVC;\n'],
			 
			[// fragment source
			 'void main() {'+
				 	'vec2 x = get_global_id();'+
				 	
					'gl_FragColor = vVC;\n'+
			 '}']];
		
		return str_vfp;
	};
};
VFP_GRID.prototype = Object.create(VFP.prototype);
VFP_GRID.prototype.constructor = VFP_GRID;