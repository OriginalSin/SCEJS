/** @private **/
function KERNEL_POS_OPPOSITE() { VFP.call(this);
	this.getSrc = function() {
		
		var str_vfp = [
       	    // kernel head
       		[],
       		
       		// kernel source
       		['void main(float4* posXYZW,'+
						'float4* data) {'+ // data = 0: nodeId, 1: linkId, 2: oppositeId, 3: isTarget
					'vec2 x = get_global_id();'+					
					'vec2 x_opposite = get_global_id(data[x].z);'+
					
					'vec4 tex = posXYZW[x_opposite];'+
						
					'out_float4 = tex;\n'+ 
			'}']];
       	
       	return str_vfp;
	};
};
KERNEL_POS_OPPOSITE.prototype = Object.create(VFP.prototype);
KERNEL_POS_OPPOSITE.prototype.constructor = KERNEL_POS_OPPOSITE;