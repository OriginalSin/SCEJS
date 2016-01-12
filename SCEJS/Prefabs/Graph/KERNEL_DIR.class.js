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
						',float isLink'+
						',float isNode'+
						',float originId'+
						',float targetId'+
						//',float isConnected'+
						','+customArgs+
						') {\n'+
			'vec2 x = get_global_id();\n'+	 
			
			'vec2 xx = get_global_id(data[x].x);'+
			'vec2 xx_opposite = get_global_id(data[x].y);'+
			
			
			
			'float nodeId = data[x].x;'+ 
			'vec3 currentDir = dir[x].xyz;\n'+
			'vec3 currentPos = posXYZW[x].xyz;\n'+
			
			// if isLink == 1
			//'float linkId = data[x].x;'+
			'float isTarget = data[x].z;'+
			
			
			
			'float nodeId_opposite = data[xx_opposite].x;'+
			'vec3 currentDir_opposite = dir[xx_opposite].xyz;\n'+ 			
			'vec3 currentPos_opposite = posXYZW[xx_opposite].xyz;\n'+ 
			
			// if isLink == 1
			'float linkId_opposite = data[xx_opposite].y;'+
			'float targets_opposite = data[xx_opposite].z;'+
			
			
			
			
			/*'if(nodeId == originId) {'+
				'vec2 id_opposite = get_global_id(targetId);'+
				'vec3 destPos = posXYZW[id_opposite].xyz;'+
				
				'vec3 destDir = clamp(destPos-currentPos, -1.0, 1.0);'+
				'if(isConnected == 1.0) destDir *= (distance(destPos,currentPos)/1000.0);'+
				'else destDir *= (1.0-(distance(destPos,currentPos)/1000.0))*-0.001;'+
				//'destDir *= targets_opposite;'+				
				'currentDir = currentDir+(destDir*10.0);'+
				
				//'vec3 toc = (vec3(0.0,0.0,0.0)-currentPos)*(isTarget/100.0);'+
				//'currentDir = currentDir+(toc*0.001);'+
			'}'+			
			'if(nodeId == targetId) {'+
				'vec2 id_opposite = get_global_id(originId);'+
				'vec3 destPos = posXYZW[id_opposite].xyz;'+
				
				'vec3 destDir = clamp(destPos-currentPos, -1.0, 1.0);'+
				'if(isConnected == 1.0) destDir *= (distance(destPos,currentPos)/1000.0);'+
				'else destDir *= (1.0-(distance(destPos,currentPos)/1000.0))*-0.001;'+
				//'destDir *= targets_opposite;'+
				'currentDir = currentDir+(destDir*10.0);'+
				
				//'vec3 toc = (vec3(0.0,0.0,0.0)-currentPos)*(isTarget/100.0);'+
				//'currentDir = currentDir+(toc*0.001);'+
			'}'+*/
			
			
			'currentDir = currentDir*0.95;'+ // air resistence
			
			customCode+
			
			'vec3 newDir = currentDir;\n'+
	
			'out_float4 = vec4(newDir,1.0);\n'+
		'}']];
       	
       	return str_vfp;
	};
};
KERNEL_DIR.prototype = Object.create(VFP.prototype);
KERNEL_DIR.prototype.constructor = KERNEL_DIR;