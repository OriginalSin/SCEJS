/** @private **/
function KERNEL_DIR(customArgs, customCode) { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // kernel head
       		['vec3 sphericalColl(vec3 initialPos, vec3 currentPos, vec3 currentDir, vec3 currentDirB, vec3 dirToBN, vec3 repulsion, float idb, float idToDrag) {'+	       		       			
				'vec3 currentDirN = normalize(currentDir);'+
				'float pPoint = abs(dot(currentDirN, dirToBN));'+
				'vec3 reflectV = reflect(currentDirN*-1.0, dirToBN);'+					
				
				'vec3 currentDirBN = normalize(currentDirB);'+
				'float pPointB = abs(dot(currentDirBN, dirToBN));'+
				
				'repulsion = (reflectV*-1.0)* (((1.0-pPoint)*length(currentDir))+((pPointB)*length(currentDirB)));\n'+					
				
				'return (repulsion.x > 0.0 && repulsion.y > 0.0 && repulsion.z > 0.0) ? repulsion : dirToBN*-0.1;'+					
			"}"],
       		
       		// kernel source
       		['void main(float4* data'+ // data = 0: nodeId, 1: oppositeId, 2: linksTargetCount, 3: linksCount
			       		',float* adjacencyMatrix'+
						',float widthAdjMatrix'+
						',float currentAdjMatrix'+
						',float numberOfColumns'+
						',float enableForceLayout'+
						',float enableForceLayoutCollision'+
						',float enableForceLayoutRepulsion'+
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
				'float radius = 4.0;'+
			
				'float acumAtraction = 1.0;'+
				'float acumRepulsion = 1.0;'+
				'vec3 atraction = vec3(0.0, 0.0, 0.0);'+
				'vec3 repulsion = vec3(0.0, 0.0, 0.0);'+
				'vec3 repulsionColl = vec3(0.0, 0.0, 0.0);'+
				
				'float wh = widthAdjMatrix-1.0;'+
				'float ts = 1.0/wh;'+

				
				'int colExists = 0;'+

				'float currentColumn = currentAdjMatrix/numberOfColumns;'+
				'float rowAdjMat = floor(currentColumn);'+
				'float colAdjMat = fract(currentColumn)*numberOfColumns;'+


				'float initA = float(int(colAdjMat*widthAdjMatrix));'+
                'float xN = (nodeId-initA)*ts;'+

				'if(nodeId >= initA && nodeId < (initA+widthAdjMatrix)) {'+

					'for(int n=0; n < 256; n++) {'+
						//'if(n == int(wh)) break;'+


                        'float initB = float(int(rowAdjMat*widthAdjMatrix));'+
						'float idb = float(n)+initB;'+

                        'float yN = float(n)*ts;'+

						//'if(idb >= initB && idb < (initB+widthAdjMatrix)) {'+
							'vec2 xx_oppo = get_global_id(idb);'+
							'vec3 currentPosB = posXYZW[xx_oppo].xyz;\n'+
							'vec3 currentDirB = dir[xx_oppo].xyz;\n'+

							'vec3 dirToB = (currentPosB-currentPos);'+
							'vec3 dirToBN = normalize(dirToB);'+
							'float dist = distance(currentPosB, currentPos);'+ // near=0.0 ; far=1.0
							'float distN = distance(currentPosB, currentPos)*0.001;'+ // near=0.0 ; far=1.0
							'vec3 dirS;'+
							'float pPoint;'+

							'vec4 it = texture2D(adjacencyMatrix, vec2(xN, yN));'+
							'if(it.x > 0.5) {'+ // connection exists
								'if(dist > 0.0) {'+
									'atraction = atraction+(dirToBN*distN);\n'+
									'atraction = atraction+(((dirToBN*-1.0)*(0.02)));\n'+
									'acumAtraction += 1.0;'+

									// SPHERICAL COLLISION
									'if(enableForceLayoutCollision == 1.0 && dist < (radius*1.0)) {'+
										'repulsionColl = sphericalColl(vec3(initialPosX, initialPosY, initialPosZ), currentPos, currentDir, currentDirB, dirToBN, repulsion, idb, idToDrag);'+
										'colExists = 1;'+
										'break;'+
									'}'+ // end spherical collision
								'}'+

								// center force
								//'vec3 dir_C = normalize(vec3(0.0, 0.0, 0.0)-currentPos);'+
								//'float distanceN_C = distance(vec3(0.0, 0.0, 0.0), currentPos)*0.001;'+ // near=0.0 ; far=1.0

								//'atraction = atraction+((dir_C*distanceN_C*(1.0-targets)));'+
								//'atraction = atraction+(((dir_C*-1.0)*(1.0-distanceN_C)*targets)*0.1);\n'+
							'} else {'+ // connection not exists
								'if(dist > 0.0) {'+
									'if(enableForceLayoutRepulsion == 1.0) {'+
										'repulsion = repulsion+(((dirToBN*-1.0)*(0.005)));\n'+
										'acumRepulsion += 1.0;'+
									'}'+

									// SPHERICAL COLLISION
									'if(enableForceLayoutCollision == 1.0 && dist < (radius*1.0)) {'+
										'repulsionColl = sphericalColl(vec3(initialPosX, initialPosY, initialPosZ), currentPos, currentDir, currentDirB, dirToBN, repulsion, idb, idToDrag);'+
										'colExists = 1;'+
										'break;'+
									'}'+ // end spherical collision
								'}'+
							'}'+ // end connection not exists
						//'} else {'+

						//'}'+
					'}'+ // end for
					'if(colExists == 1) {'+
						'currentDir = repulsionColl;\n'+
					'} else {'+
						'atraction = (atraction/acumAtraction)*25.0;'+
						'repulsion = (repulsion/acumRepulsion)*25.0;'+
						'currentDir = currentDir+(atraction+repulsion);\n'+
					'}'+

				'} else {'+
					// TODO
				'}'+


			"}"+

            'currentDir = currentDir*0.96;'+ // air resistence
			
			((customCode != undefined) ? customCode : '')+
			
			'vec3 newDir = currentDir;\n'+
	
			'out_float4 = vec4(newDir,1.0);\n'+
		'}']];
       	
       	return str_vfp;
	};
};
KERNEL_DIR.prototype = Object.create(VFP.prototype);
KERNEL_DIR.prototype.constructor = KERNEL_DIR;
