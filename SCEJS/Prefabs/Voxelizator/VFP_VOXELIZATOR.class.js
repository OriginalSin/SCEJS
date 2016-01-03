/** @private **/
function VFP_VOXELIZATOR() { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // vertex head
       		['varying vec4 vVPos;\n'+
       		 'varying vec4 vVN;\n'+
			'varying vec4 vVT;\n'+
			'varying float vVTU;\n'+
			'mat4 lookAt(vec3 eye, vec3 center, vec3 up) {'+
	  		     'vec3 zaxis = normalize(center - eye);'+
	  		     'vec3 xaxis = normalize(cross(up, zaxis));'+
	  		     'vec3 yaxis = cross(zaxis, xaxis);'+
	
	  		     'mat4 matrix;'+
	  		     //Column Major
	  		     'matrix[0][0] = xaxis.x;'+
	  		     'matrix[1][0] = yaxis.x;'+
	  		     'matrix[2][0] = zaxis.x;'+
	  		     'matrix[3][0] = 0.0;'+
	
	  		     'matrix[0][1] = xaxis.y;'+
	  		     'matrix[1][1] = yaxis.y;'+
	  		     'matrix[2][1] = zaxis.y;'+
	  		     'matrix[3][1] = 0.0;'+
	
	  		     'matrix[0][2] = xaxis.z;'+
	  		     'matrix[1][2] = yaxis.z;'+
	  		     'matrix[2][2] = zaxis.z;'+
	  		     'matrix[3][2] = 0.0;'+
	
	  		     'matrix[0][3] = -dot(xaxis, eye);'+
	  		     'matrix[1][3] = -dot(yaxis, eye);'+
	  		     'matrix[2][3] = -dot(zaxis, eye);'+
	  		     'matrix[3][3] = 1.0;'+
	
	  		     'return matrix;'+
	  		 '}'+
	  		'mat4 transpose(mat4 m) {'+
 			  'return mat4(  m[0][0], m[1][0], m[2][0], m[3][0],'+
 			                'm[0][1], m[1][1], m[2][1], m[3][1],'+
 			  				'm[0][2], m[1][2], m[2][2], m[3][2],'+
 			  				'm[0][3], m[1][3], m[2][3], m[3][3]);'+
 			 '}'],

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
										

       				'mat4 mCam = transpose(lookAt( 	vec3(0.0, (-(gridSize/2.0)+(uCurrentHeight*cs)), 0.0),'+
			       									'vec3(0.0, (-(gridSize/2.0)+(uCurrentHeight*cs))-1.0, 0.001),'+
			       									'vec3(0.0, 1.0, 0.0)));'+
       									
       									
					'vec3 vp = vertexPos[x].xyz;\n'+
					'vp = vp*vec3(1.0, 1.0, 1.0);'+
					
					'vec4 vPosition = PMatrix*mCam*nodeWMatrix*vec4(vp,1.0);'+					  
    				'float lengthOffs = 0.005*gridSize*vPosition.z;'+  
    				
       				//'float lengthOffs = 1.0+((( vp.y+(gridSize/2.0) )/gridSize)*5.0);'+       				       				
       									
    				'int currOffs = int(uCurrentOffset);'+ 
    				'if(currOffs == 0) vp = vp+vec3(-lengthOffs,	0.0,	-lengthOffs);'+  
    				'if(currOffs == 1) vp = vp+vec3(-lengthOffs,	0.0,	-lengthOffs);'+  
    				'if(currOffs == 2) vp = vp+vec3(-lengthOffs,	0.0,	-lengthOffs);'+  
    				'if(currOffs == 3) vp = vp+vec3(-lengthOffs,	0.0,	-lengthOffs);'+       				
    				'if(currOffs == 4) vp = vp+vec3(0.0,		0.0,	-lengthOffs);'+  
    				'if(currOffs == 5) vp = vp+vec3(0.0,		0.0,	-lengthOffs);'+  
    				'if(currOffs == 6) vp = vp+vec3(-lengthOffs,	0.0,	0.0);'+  
    				'if(currOffs == 7) vp = vp+vec3(-lengthOffs,	0.0,	0.0);'+
    				
    				'vVPos = vertexPos[x];'+
    				'gl_Position = PMatrix * mCam * nodeWMatrix * vec4(vp, 1.0);\n'+   
    				
    				
    				'vVN = vertexNormal[x];\n'+
    				'vVT = vertexTexture[x];\n'+
    				'vVTU = vertexTextureUnit[x];\n'+
       		'}'],

       		// fragment head
       		['varying vec4 vVPos;\n'+
       		 'varying vec4 vVN;\n'+
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
					
					
					/*'float ccX = gl_FragCoord.x;'+
					//'int ccY = int(uCurrentHeight);'+
					//'float currentCameraPosY = vPosition.y + (gridSize/2.0) - (cs*uCurrentHeight);'+
					'float ccZ = uResolution-gl_FragCoord.y;'+ 
					
					'vec3 p = vec3(0.0,0.0,0.0)+vec3(-(gridSize/2.0), -(gridSize/2.0), -(gridSize/2.0));\n'+ // init position
					'p = p+vec3(cs*ccX, 0.0, cs*ccZ);\n'+
					'p = vec3(p.x, (cs*uCurrentHeight), p.z);\n'+
					'p = p+vec3(cs, cs, cs);\n'+*/
					
					'vec3 p = vVPos.xyz;'+
					//'p = p+vec3(cs, cs, cs);\n'+ 
					
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
