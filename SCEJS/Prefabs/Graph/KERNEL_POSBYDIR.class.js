/** @private **/
function KERNEL_POSBYDIR(customArgs, customCode) { VFP.call(this);
	this.getSrc = function() {

		var str_vfp = [
       	    // kernel head
       		[],

       		// kernel source
       		['void main(float4* posXYZW,'+
						'float4* dir,'+
						customArgs+') {'+
							'vec2 x = get_global_id();'+
							'vec3 currentPos = posXYZW[x].xyz;\n'+
							'vec3 currentDir = dir[x].xyz;\n'+

							customCode+

							'currentPos += currentDir;\n'+

							'out_float4 = vec4(currentPos, 1.0);\n'+
			'}']];

       	return str_vfp;
	};
};
KERNEL_POSBYDIR.prototype = Object.create(VFP.prototype);
KERNEL_POSBYDIR.prototype.constructor = KERNEL_POSBYDIR;
