/** @private **/
function KERNEL_POSBYDIR(customArgs, customCode) { VFP.call(this);
	this.getSrc = function() {

		var str_vfp = [
       	    // kernel head
       		[],

       		// kernel source
       		['void main(float4* data,'+ // data = 0: nodeId, 1: linkId, 2: oppositeId, 3: isTarget
       		 			'float4* posXYZW,'+
						'float4* dir,'+
						'float enableDrag,'+
						'float idToDrag,'+
						'float MouseDragTranslationX,'+
						'float MouseDragTranslationY,'+
						'float MouseDragTranslationZ,'+
						customArgs+') {'+
							'vec2 x = get_global_id();'+
							'vec3 currentPos = posXYZW[x].xyz;\n'+
							'vec3 currentDir = dir[x].xyz;\n'+

							customCode+

							'float nodeId = data[x].x;\n'+ 
							'if(enableDrag == 1.0) {'+							
								'if(nodeId == idToDrag) {'+
									'currentPos = vec3(MouseDragTranslationX, MouseDragTranslationY, MouseDragTranslationZ);\n'+
								'}\n'+
							'}\n'+ 
					
							'currentPos += currentDir;\n'+

							'out_float4 = vec4(currentPos, 1.0);\n'+
			'}']];

       	return str_vfp;
	};
};
KERNEL_POSBYDIR.prototype = Object.create(VFP.prototype);
KERNEL_POSBYDIR.prototype.constructor = KERNEL_POSBYDIR;
