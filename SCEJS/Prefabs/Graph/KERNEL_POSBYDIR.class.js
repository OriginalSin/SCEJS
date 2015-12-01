/** @private **/
function KERNEL_POSBYDIR() { VFP.call(this);
	this.getSrc = function() {
		
		var str_vfp = [
       	    // kernel head
       		[],
       		
       		// kernel source
       		['void main(float4* initPos,'+
				'float4* posXYZW,'+
				'float4* dir,'+
				'float lifeDistance) {'+
					'vec2 x = get_global_id();'+
					'vec3 currentPos = posXYZW[x].xyz;\n'+ 
					'vec4 dir = dir[x];'+
					'vec3 currentDir = vec3(dir.x,dir.y,dir.z);\n'+   
					'vec3 newPos = (currentPos+currentDir);\n'+
					
					'vec4 initPos = initPos[x];'+
					'if(lifeDistance > 0.0 && distance(vec3(initPos.x,initPos.y,initPos.z),newPos) > lifeDistance)'+
						'newPos = vec3(initPos.x,initPos.y,initPos.z);'+
						
					'out_float4 = vec4(newPos, 1.0);\n'+ 
			'}']];
       	
       	return str_vfp;
	};
};
KERNEL_POSBYDIR.prototype = Object.create(VFP.prototype);
KERNEL_POSBYDIR.prototype.constructor = KERNEL_POSBYDIR;