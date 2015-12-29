/** @private **/
function VFP_VOXELIZATOR() { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // vertex head
       		['varying vec4 vVN;\n'+
			'varying vec4 vVT;\n'+
			'varying float vVTU;\n'],

       		// vertex source
       		['void main(float4* vertexPos,'+
       			'float4* vertexNormal,'+
       			'float4* vertexTexture,'+
       			'float* vertexTextureUnit,'+
       			
       			'mat4 PMatrix,'+
       			'mat4 cameraWMatrix,'+
       			'mat4 nodeWMatrix,'+
       			       			
       			'float uCurrentOffset,'+
       			'float uGridsize,'+    	
       			'float uResolution,'+
       			'float uCurrentHeight'+   		
       			') {'+
       				'vec2 x = get_global_id();'+
       				
       				'float gridSize = uGridsize;'+
					'int maxLevelCells = int(uResolution);'+
					'float cs = gridSize/float(maxLevelCells);\n'+ // cell size
					
       				'vec3 vp = vec3(vertexPos[x].x, vertexPos[x].y + (gridSize/2.0) - (cs*uCurrentHeight), vertexPos[x].z);\n'+ 
    				'vec3 vertexPositionFlipX = vp*vec3(1.0,1.0,1.0);'+
    				'vec4 vPosition = PMatrix*cameraWMatrix*nodeWMatrix*vec4(vertexPositionFlipX,1.0);'+  
    				'vec3 verP; float doffset = 0.02*uGridsize*vPosition.z;'+   
    				'int offs = int(uCurrentOffset);'+
    				'if(offs == 0) verP = vec3(vertexPositionFlipX)+(vec3(	doffset,	0.0,	doffset));'+  
    				'if(offs == 1) verP = vec3(vertexPositionFlipX)+(vec3(	-doffset,	0.0,	-doffset));'+  
    				'if(offs == 2) verP = vec3(vertexPositionFlipX)+(vec3(	-doffset,	0.0,	doffset));'+  
    				'if(offs == 3) verP = vec3(vertexPositionFlipX)+(vec3(	doffset,	0.0,	-doffset));'+  
    				
    				'if(offs == 4) verP = vec3(vertexPositionFlipX)+(vec3(	0.0,		0.0,	doffset));'+  
    				'if(offs == 5) verP = vec3(vertexPositionFlipX)+(vec3(	0.0,		0.0,	-doffset));'+  
    				'if(offs == 6) verP = vec3(vertexPositionFlipX)+(vec3(	doffset,	0.0,	0.0));'+  
    				'if(offs == 7) verP = vec3(vertexPositionFlipX)+(vec3(	-doffset,	0.0,	0.0));'+  
    				'gl_Position = PMatrix*cameraWMatrix*nodeWMatrix*vec4(verP,1.0);\n'+   
    				
    				'vVN = vertexNormal[x];\n'+
    				'vVT = vertexTexture[x];\n'+
    				'vVTU = vertexTextureUnit[x];\n'+
       		'}'],

       		// fragment head
       		['varying vec4 vVN;\n'+
			 'varying vec4 vVT;\n'+
			 'varying float vVTU;\n'+
 			new Utils().packGLSLFunctionString()],

       		[// fragment source
       		 'void main(float4* texAlbedo,'+       
       		 			'float uGridsize,'+
       		 			'float uResolution,'+
       		 			'float uTypeFillMode,'+
       		 			'float uCurrentHeight) {'+
       		 	'vec2 x = get_global_id();'+

       		 	'int fillMode = int(uTypeFillMode);'+
	       		'if(fillMode == 0) {'+ // fill with albedo
	       		 
					'gl_FragColor = texture2D(texAlbedo, vVT.xy);\n'+
					
				'} else if(fillMode == 1 || fillMode == 2 || fillMode == 3) {'+ // fill with position
				
					'float gridSize = uGridsize;'+
					'int maxLevelCells = int(uResolution);'+
					'float cs = gridSize/float(maxLevelCells);\n'+ // cell size
					'float chs = cs/2.0;\n'+
					
					'vec3 p = vec3(0.0,0.0,0.0)+vec3(-(gridSize/2.0), -(gridSize/2.0), -(gridSize/2.0));\n'+ // init position
					'float ccX = gl_FragCoord.x;'+
					'int ccY = int(uCurrentHeight);'+
					'float ccZ = float(maxLevelCells)-gl_FragCoord.y;'+ 		 			
					'p = p+vec3(cs*ccX, cs*float(ccY), cs*ccZ);\n'+
					'p = p+vec3(cs, cs, cs);\n'+
					
					'if(fillMode == 1) {'+ // posX
						'gl_FragColor = pack((p.x+(gridSize/2.0))/gridSize);\n'+
					'} else if(fillMode == 2) {'+ // posY
						'gl_FragColor = pack((p.y+(gridSize/2.0))/gridSize);\n'+
					'} else {'+ // posZ
						'gl_FragColor = pack((p.z+(gridSize/2.0))/gridSize);\n'+
					'}'+
					
				'} else if(fillMode == 4) {'+ // fill with normal
				
					'gl_FragColor = vec4((vVN.r+1.0)/2.0,(vVN.g+1.0)/2.0,(vVN.b+1.0)/2.0, 1.0);\n'+
					
				'}'+
       		 '}']];

       	return str_vfp;
	};
};
VFP_VOXELIZATOR.prototype = Object.create(VFP.prototype);
VFP_VOXELIZATOR.prototype.constructor = VFP_VOXELIZATOR;
