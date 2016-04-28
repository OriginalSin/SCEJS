/** @private **/
function KERNEL_DIR(customArgs, customCode) { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // kernel head
       		['vec3 sphericalColl(vec3 currentDir, vec3 currentDirB, vec3 dirToBN) {'+
				'vec3 currentDirN = normalize(currentDir);'+
				'float pPoint = abs(dot(currentDirN, dirToBN));'+
				'vec3 reflectV = reflect(currentDirN*-1.0, dirToBN);'+					
				
				'vec3 currentDirBN = normalize(currentDirB);'+
				'float pPointB = abs(dot(currentDirBN, dirToBN));'+
				
				'vec3 repulsionForce = (reflectV*-1.0)* (((1.0-pPoint)*length(currentDir))+((pPointB)*length(currentDirB)));\n'+
				
				'return (repulsionForce.x > 0.0 && repulsionForce.y > 0.0 && repulsionForce.z > 0.0) ? repulsionForce : dirToBN*-0.1;'+
			"}"+

            'struct CalculationResponse {'+
                'vec3 atraction;'+
                'float acumAtraction;'+
                'vec3 repulsion;'+
                'float collisionExists;'+
            '};'+

            'CalculationResponse calculate(int connectionExists, vec2 xx_oppo, vec3 currentPos, vec3 currentDir, vec3 atraction, float acumAtraction, vec3 repulsion) {'+
                'float radius = 4.0;\n'+
                'float collisionExists = 0.0;\n'+

                'vec3 currentPosB = posXYZW[xx_oppo].xyz;\n'+
                'vec3 currentDirB = dir[xx_oppo].xyz;\n'+

                'vec3 dirToB = (currentPosB-currentPos);\n'+
                'vec3 dirToBN = normalize(dirToB);\n'+
                'float dist = distance(currentPosB, currentPos);\n'+ // near=0.0 ; far=1.0

                // SPHERICAL COLLISION
                'if(enableForceLayoutCollision == 1.0 && dist < radius) {'+
                    'collisionExists = 1.0;'+
                    'atraction = sphericalColl(currentDir, currentDirB, dirToBN);'+
                '} else {'+ // end spherical collision
                    'if(connectionExists == 1) {'+
                        'atraction += dirToBN*dist*0.5;\n'+
                        'atraction += dirToBN*-10.0;\n'+

                        'acumAtraction += 1.0;\n'+
                    '} else {'+
                        'if(enableForceLayoutRepulsion == 1.0) \n'+
                            'repulsion += dirToBN*-(1000.0);\n'+
                    '}'+
                '}'+
                'return CalculationResponse(atraction, acumAtraction, repulsion, collisionExists);'+
            '}'+

            calculateAdjMatrixForce_str(calculateAdjMatrixForce_calForceLayout1,
                                        calculateAdjMatrixForce_calForceLayout2,
                                        calculateAdjMatrixForce_calForceLayout3,
                                        calculateAdjMatrixForce_calForceLayout4)],





       		
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
