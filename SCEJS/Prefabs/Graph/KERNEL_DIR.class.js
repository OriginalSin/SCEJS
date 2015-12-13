/** @private **/
function KERNEL_DIR(customArgs, customCode) { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // kernel head
       		[],
       		
       		// kernel source
       		['void main(float4* data'+ // data = 0: nodeId, 1: linkId, 2: oppositeId, 3: isTarget
						',float4* posXYZW'+
						',float4* dir'+
						',float enableDrag'+
						',float idToDrag'+
						',float MouseDragTranslationX'+
						',float MouseDragTranslationY'+
						',float MouseDragTranslationZ'+
						',float isLink'+
						','+customArgs+
						') {\n'+
			'vec2 x = get_global_id();\n'+	 
			
			'float linkId = data[x].y;'+
			'float nodeId = data[x].x;'+				
			'vec3 currentDir = dir[x].xyz;\n'+ 
			'vec3 currentPos = posXYZW[x].xyz;\n'+ 
			
			'if(enableDrag == 1.0) {'+
				'if(isLink == 0.0) {'+
					'if(linkId == idToDrag) {'+
						'vec3 dp = vec3(MouseDragTranslationX, MouseDragTranslationY, MouseDragTranslationZ);'+ 
						'currentDir = dp;\n'+
					'}\n'+
				'} else {'+
					'if(nodeId == idToDrag) {'+
						'vec3 dp = vec3(MouseDragTranslationX, MouseDragTranslationY, MouseDragTranslationZ);'+ 
						'currentDir = dp;\n'+
					'}\n'+
				'}\n'+
			'}\n'+ 
			
			'currentDir = currentDir*0.995;'+ // air resistence
			
			customCode+
			
			'vec3 newDir = currentDir;\n'+
	
			'out_float4 = vec4(newDir,1.0);\n'+
		'}']];
       	
       	return str_vfp;
	};
};
KERNEL_DIR.prototype = Object.create(VFP.prototype);
KERNEL_DIR.prototype.constructor = KERNEL_DIR;