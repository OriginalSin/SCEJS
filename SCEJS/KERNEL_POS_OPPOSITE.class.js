/** @private **/
function KERNEL_POS_OPPOSITE() { VFP.call(this);
	this.getSrc = function() {
		
		var str_vfp = [
       	    // kernel head
       		[],
       		
       		// kernel source
       		['void main(float4* posXYZW,'+
				'float* oppositeId,'+
				'float bufferWidth,'+
				'float bufferHeight) {'+
					'vec2 x = get_global_id();'+
					
					'float id_opposite = oppositeId[x];\n'+		
					'float num = id_opposite/bufferWidth;'+
					'float column = fract(num)*bufferWidth;'+
					'float row = floor(num);'+ 
					
					'float ts = 1.0/(bufferWidth-1.0);'+
					'float xx = column*ts;'+
					'float yy = row*ts;'+
					
					'vec4 tex = texture2D(posXYZW, vec2(xx, yy));'+
						
					'out_float4 = tex;\n'+ 
			'}']];
       	
       	return str_vfp;
	};
};
KERNEL_POS_OPPOSITE.prototype = Object.create(VFP.prototype);
KERNEL_POS_OPPOSITE.prototype.constructor = KERNEL_POS_OPPOSITE;