/** @private **/
function KERNEL_DIR(customArgs, customCode) { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // kernel head
       		[],
       		
       		// kernel source
       		['void main(float4* data'+ // data = 0: nodeId, 1: oppositeId, 2: linksTargetCount, 3: linksCount
						',float4* posXYZW'+
						',float4* dir'+
						',float isLink'+
						',float isNode'+
						',float* adjacencyMatrix'+
						',float widthAdjMatrix'+
						',float enableForceLayout'+
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
			'float targets = 1.0/(1.0+data[x].w);'+
			
			// FORCE LAYOUT
			"if(enableForceLayout == 1.0) {"+
				'float acumAtraction = 1.0;'+
				'float acumRepulsion = 1.0;'+
				'vec3 atraction = vec3(0.0, 0.0, 0.0);'+
				'vec3 repulsion = vec3(0.0, 0.0, 0.0);'+
				
				'float wh = widthAdjMatrix-1.0;'+
				'float ts = 1.0/wh;'+
				'float xN = nodeId*ts;'+
				'for(int n=0; n < 1000000; n++) {'+
					'if(n == int(wh)) break;'+
					
					'float yN = (float(n)*ts);'+  
					
					'float idb = yN*wh;'+    
					'vec2 xx_oppo = get_global_id(idb);'+
					'vec3 currentPosB = posXYZW[xx_oppo].xyz;\n'+
					
					'vec4 it = texture2D(adjacencyMatrix, vec2(xN, yN));'+
					'if(it.x > 0.5) {'+
						'vec3 ddir = normalize(currentPosB-currentPos);'+
						'float distN = distance(currentPosB, currentPos)*0.001;'+ // near=0.0 ; far=1.0
						
						'if(distN > 0.0) {'+
							'atraction = atraction+(ddir*distN);\n'+
							'atraction = atraction+(((ddir*-1.0)*(1.0-distN))*0.003);\n'+
							'acumAtraction += 1.0;'+
						'}'+
						
						// center force
						'vec3 dir_C = normalize(vec3(0.0, 0.0, 0.0)-currentPos);'+
						'float distanceN_C = distance(vec3(0.0, 0.0, 0.0), currentPos)*0.001;'+ // near=0.0 ; far=1.0
						
						'atraction = atraction+((dir_C*distanceN_C*(1.0-targets)));'+
						'atraction = atraction+(((dir_C*-1.0)*(1.0-distanceN_C)*targets)*0.1);\n'+
					'} else {'+
						'vec3 ddir = normalize(currentPosB-currentPos);'+
						'float distN = distance(currentPosB, currentPos)*0.001;'+ // near=0.0 ; far=1.0
						
						'if(distN > 0.0) {'+
							'repulsion = repulsion+(((ddir*-1.0)*(1.0-distN)));\n'+ 
							'acumRepulsion += 1.0;'+
						'}'+
					'}'+
				'}'+
				'atraction = (atraction/acumAtraction)*10.0;'+
				'repulsion = (repulsion/acumRepulsion);'+
				'currentDir = (currentDir+(atraction+repulsion));\n'+										
			"}"+
			
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