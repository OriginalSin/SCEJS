/** @private **/
function KERNEL_DIR(customArgs, customCode) { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // kernel head
       		[ForceLayout_FunctionsString+
       		adjMatrix_GLSLFunctionString(   AdjMatrix_ForceLayout_initVars,
                                            AdjMatrix_ForceLayout_relationFound,
                                            AdjMatrix_ForceLayout_summation,
                                            AdjMatrix_ForceLayout_returnInstruction)],

       		// kernel source
       		['void main(float4* data'+ // data = 0: nodeId, 1: oppositeId, 2: linksTargetCount, 3: linksCount
			       		',float* adjacencyMatrix'+
						',float widthAdjMatrix'+
						',float currentAdjMatrix'+
						',float numberOfColumns'+
						',float enableForceLayout'+
						',float performFL'+
						',float enableForceLayoutCollision'+
						',float enableForceLayoutRepulsion'+
						',float nodesCount'+
						',float4* posXYZW'+
						',float4* dir'+
						',float isLink'+
						',float isNode'+ 	
						',float enableDrag'+
						',float idToDrag'+
						',float initialPosX'+
						',float initialPosY'+
						',float initialPosZ'+
						((customArgs != undefined) ? ','+customArgs : '')+
						') {\n'+
			'vec2 x = get_global_id();\n'+	 
			
			'vec2 xx = get_global_id(data[x].x);'+
			'vec2 xx_opposite = get_global_id(data[x].y);'+
			
			
			
			'float nodeId = data[x].x;'+ 
			'vec3 currentDir = dir[x].xyz;\n'+
			'vec3 currentPos = posXYZW[x].xyz;\n'+

			//'float acumAtraction = dir[x].w;\n'+



			// if isLink == 1
			//'float linkId = data[x].x;'+
			'float isTarget = data[x].z;'+ 
			
			
			
			'float nodeId_opposite = data[xx_opposite].x;'+
			'vec3 currentDir_opposite = dir[xx_opposite].xyz;\n'+ 			
			'vec3 currentPos_opposite = posXYZW[xx_opposite].xyz;\n'+ 
			
			// if isLink == 1
			'float linkId_opposite = data[xx_opposite].y;'+
			'float targets = 1.0/(1.0+data[x].w);'+


            'if(currentAdjMatrix == 0.0) {'+
                'currentDir = vec3(0.0, 0.0, 0.0);'+
            '}'+

			// FORCE LAYOUT
			"if(enableForceLayout == 1.0 && performFL == 0.0) {"+
                'vec4 forC = calculateAdjMatrixForce(nodeId, currentPos, currentDir);'+
                'currentDir = (forC.w == 1.0) ? forC.xyz : (currentDir+forC.xyz);'+
			"}"+ // END if(enableForceLayout == 1.0 && performFL == 0.0) {


			"if(enableForceLayout == 1.0) {"+
				"if((numberOfColumns == 1.0 && performFL == 0.0) || (numberOfColumns > 1.0 && performFL == 1.0)) {"+
                    'currentDir /= numberOfColumns;'+
                '}'+
			"} else {"+
				'currentDir = currentDir;'+ // air resistence
			"}"+

			
			((customCode != undefined) ? customCode : '')+
	
			'out_float4 = vec4(currentDir, 1.0);'+
		'}']];
       	
       	return str_vfp;
	};
};
KERNEL_DIR.prototype = Object.create(VFP.prototype);
KERNEL_DIR.prototype.constructor = KERNEL_DIR;
