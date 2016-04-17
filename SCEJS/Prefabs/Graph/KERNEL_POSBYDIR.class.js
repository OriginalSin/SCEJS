/** @private **/
function KERNEL_POSBYDIR(customArgs, customCode) { VFP.call(this);
	this.getSrc = function() {

		var str_vfp = [
       	    // kernel head
       		[],

       		// kernel source
       		['void main(float4* data,'+ // data = 0: nodeId, 1: oppositeId, 2: linksTargetCount, 3: linksCount
       		 			'float4* posXYZW,'+
						'float4* dir,'+
						'float enableDrag,'+
						'float performFL,'+
                        'float numberOfColumns,'+
						'float idToDrag,'+
						'float MouseDragTranslationX,'+
						'float MouseDragTranslationY,'+
						'float MouseDragTranslationZ'+
						((customArgs != undefined) ? ','+customArgs : '')+
						') {\n'+
							'vec2 x = get_global_id();\n'+	 
							
							'vec2 xx = get_global_id(data[x].x);'+
							'vec2 xx_opposite = get_global_id(data[x].y);'+
						
						
							'vec3 currentPos = posXYZW[x].xyz;\n'+
							'vec3 currentDir = dir[x].xyz;\n'+

							((customCode != undefined) ? customCode : '')+

							'float nodeId = data[x].x;\n'+  
							'if(enableDrag == 1.0) {'+							
								'if(nodeId == idToDrag) {'+
									'currentPos = vec3(MouseDragTranslationX, MouseDragTranslationY, MouseDragTranslationZ);\n'+
								'}\n'+
							'}\n'+ 

							//'if((numberOfColumns == 1.0 && performFL == 0.0) || (numberOfColumns > 1.0 && performFL == 1.0))'+
								'currentPos += currentDir;\n'+

							'out_float4 = vec4(currentPos.x, currentPos.y, currentPos.z, 1.0);\n'+
			'}']];

       	return str_vfp;
	};
};
KERNEL_POSBYDIR.prototype = Object.create(VFP.prototype);
KERNEL_POSBYDIR.prototype.constructor = KERNEL_POSBYDIR;
