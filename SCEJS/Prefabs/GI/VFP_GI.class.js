/** @private **/
function VFP_GI(resolution) { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [
       	    // vertex head
       		['varying vec4 vposition;\n'+
     		'varying vec4 vnormal;\n'+
    		'varying vec4 vposScreen;\n'+
    		'const mat4 ScaleMatrix = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);'],

       		// vertex source
       		['void main(float4* vertexPos,'+
       			'float4* vertexNormal,'+
       			
       			'mat4 PMatrix,'+
       			'mat4 cameraWMatrix,'+
       			'mat4 nodeWMatrix'+ 		
       			') {'+
       				'vec2 x = get_global_id();'+    				
    				
    				'vec3 vp = vec3(vertexPos[x].x, vertexPos[x].y, vertexPos[x].z);\n'+
    				'vposition = nodeWMatrix * vec4(vp*vec3(1.0,1.0,1.0), 1.0);\n'+
    				'vnormal = vec4(vertexNormal[x].xyz*vec3(1.0,1.0,1.0), 1.0);\n'+
    				
    				'vec4 pos = PMatrix * cameraWMatrix * nodeWMatrix * vec4(vp, 1.0);'+
    				'vposScreen = ScaleMatrix * pos;\n'+
    				
    				'gl_Position = pos;\n'+
       		'}'],

       		
       		
       		// fragment head
       		['varying vec4 vposition;\n'+
     		'varying vec4 vnormal;\n'+
    		'varying vec4 vposScreen;\n'+
    		
 			new Utils().degToRadGLSLFunctionString()+
 			new Utils().radToDegGLSLFunctionString()+
 			new Utils().cartesianToSphericalGLSLFunctionString()+
 			new Utils().sphericalToCartesianGLSLFunctionString()+
 			new Utils().getVectorGLSLFunctionString()+
 			
 			new Utils().unpackGLSLFunctionString()+

 			new Utils().rayTraversalInitSTR()+
 			
 			'vec4 getVoxel_Color(vec3 voxel, vec3 RayOrigin) {\n'+
				'vec4 rgba = vec4(0.0,0.0,0.0,0.0);\n'+
	
				'int tex3dId = (int(voxel.y)*(int(uResolution)*int(uResolution)))+(int(voxel.z)*(int(uResolution)))+int(voxel.x);\n'+
				'float num = float(tex3dId)/wh;\n'+
				'float col = fract(num)*wh;\n'+
				'float row = floor(num);\n'+
				'vec2 texVec = vec2(col*texelSize, row*texelSize);\n'+
				'vec4 texture = texture2D(sampler_voxelColor,vec2(texVec.x, texVec.y));\n'+
				'if(texture.a/255.0 > 0.5) {\n'+ // existen triángulos dentro?
					'rgba = vec4(texture.rgb/255.0,1.0);\n'+
				'}\n'+
	
				'return rgba;\n'+
			'}\n'+
			'vec4 getVoxel_Pos(vec3 voxel, vec3 RayOrigin) {\n'+
				'vec4 rgba = vec4(0.0,0.0,0.0,0.0);\n'+
	
				'int tex3dId = (int(voxel.y)*(int(uResolution)*int(uResolution)))+(int(voxel.z)*(int(uResolution)))+int(voxel.x);\n'+
				'float num = float(tex3dId)/wh;\n'+
				'float col = fract(num)*wh;\n'+
				'float row = floor(num);\n'+
				'vec2 texVec = vec2(col*texelSize, row*texelSize);\n'+
				'vec4 texture = texture2D(sampler_voxelNormal,vec2(texVec.x, texVec.y));\n'+
				'if(texture.a/255.0 > 0.5) {\n'+ // existen triángulos dentro?
					'float texVoxelPosX = unpack(texture2D(sampler_voxelPosX,  vec2(texVec.x,texVec.y))/255.0);\n'+
					'float texVoxelPosY = unpack(texture2D(sampler_voxelPosY,  vec2(texVec.x,texVec.y))/255.0);\n'+
					'float texVoxelPosZ = unpack(texture2D(sampler_voxelPosZ,  vec2(texVec.x,texVec.y))/255.0);\n'+
	
					'rgba = vec4( (texVoxelPosX*uGridsize)-(uGridsize/2.0),'+
					'			  (texVoxelPosY*uGridsize)-(uGridsize/2.0),'+
					'			  (texVoxelPosZ*uGridsize)-(uGridsize/2.0),'+
					'			1.0);\n'+
					//'rgba = vec4(texVoxelPosX,texVoxelPosY,texVoxelPosZ,1.0);\n'+
				'}\n'+
	
				'return rgba;\n'+
			'}\n'+
			'vec4 getVoxel_Normal(vec3 voxel, vec3 RayOrigin) {\n'+
				'vec4 rgba = vec4(0.0,0.0,0.0,0.0);\n'+
	
				'int tex3dId = (int(voxel.y)*(int(uResolution)*int(uResolution)))+(int(voxel.z)*(int(uResolution)))+int(voxel.x);\n'+
				'float num = float(tex3dId)/wh;\n'+
				'float col = fract(num)*wh;\n'+
				'float row = floor(num);\n'+
				'vec2 texVec = vec2(col*texelSize, row*texelSize);\n'+
				'vec4 texture = texture2D(sampler_voxelNormal,vec2(texVec.x, texVec.y));\n'+
				'if(texture.a/255.0 > 0.5) {\n'+ // existen triángulos dentro?
					'rgba = vec4(((texture.rgb/255.0)*2.0)-1.0,1.0);\n'+
					//'rgba = vec4(texture.rgb/255.0,1.0);\n'+
				'}\n'+
	
				'return rgba;\n'+
			'}\n'+
	
			new Utils().rayTraversalSTR(resolution, ''+
				'if(int(uTypePass) == 0) gv = getVoxel_Color(voxel, RayOrigin);'+
				'else if(int(uTypePass) == 1) gv = getVoxel_Pos(voxel, RayOrigin);'+
				'else gv = getVoxel_Normal(voxel, RayOrigin);'+
				'if(gv.a != 0.0) {'+
					'color = gv;\n'+
					'break;\n'+
				'}'+
			'')],
 			
       		[// fragment source
       		 'void main(float4* texAlbedo,'+ 
       		 
			       		'float4* sampler_voxelColor,'+
			       		'float4* sampler_voxelPosX,'+
			       		'float4* sampler_voxelPosY,'+
			       		'float4* sampler_voxelPosZ,'+
			       		'float4* sampler_voxelNormal,'+
			       		
			       		'float4* sampler_screenColor,'+
			       		'float4* sampler_screenPos,'+
			       		'float4* sampler_screenNormal,'+
			       		
			       		'float4* sampler_GIVoxel,'+
			       		
			       		'float randX1,'+
			       		'float randY1,'+
			       		'float uTypePass,'+
       		 
       		 			'float uGridsize,'+
       		 			'float uResolution'+
       		 			
       		 			') {'+
       		 	'vec2 x = get_global_id();'+


       		 	'vec3 pixelCoord = vposScreen.xyz / vposScreen.w;'+
	 			'vec3 RayOrigin; vec3 RayDir; vec3 ro; vec3 rd;'+
	
	 			'vec4 color;'+
	 			'float maxang=0.8928571428571429;'+
	 			
	 			'int typePass = int(uTypePass);'+
	 			'if(typePass != 3) {'+
		 			'vec4 texScreenColor = texture2D(sampler_screenColor,  vec2(pixelCoord.x,pixelCoord.y));\n'+
		 			'vec4 texScreenPos = texture2D(sampler_screenPos,  vec2(pixelCoord.x,pixelCoord.y));\n'+
		 			'vec4 texScreenNormal = texture2D(sampler_screenNormal,  vec2(pixelCoord.x,pixelCoord.y));\n'+
		 			'if(texScreenNormal.a == 0.0) {'+ // IF texScreenNormal.a == 0.0 Return to origin.
		 				'if(typePass == 0) color = vec4(1.0,1.0,1.0, 0.0);\n'+ // save in textureFB_GIv2_screenColorTEMP
		 				'else if(typePass == 1) color = vec4(0.0,0.0,0.0, 0.0);\n'+ // save in textureFB_GIv2_screenPosTEMP
		 				'else color = vec4(0.0,0.0,0.0, 0.5);\n'+ // save in textureFB_GIv2_screenNormalTEMP // alpha 1.0 (found solid)
		 			'} else if(texScreenNormal.a == 0.5) {'+ // IF texScreenNormal.a == 0.5 Start.
		 				'RayOrigin = vec3(vposition.x,vposition.y,vposition.z);\n'+
		 				'RayDir = vec3(vnormal.x,vnormal.y,vnormal.z);\n'+
		 				'ro = RayOrigin*vec3(1.0,1.0,-1.0);'+
		 				//'ro = RayOrigin;'+
		 				'rd = RayDir*vec3(1.0,1.0,-1.0);'+
		 				//'rd = RayDir;'+
		 			'} else if(texScreenNormal.a == 1.0) {'+
		 				'RayOrigin = vec3(texScreenPos.xyz);\n'+
		 				'RayDir = vec3(texScreenNormal.xyz);\n'+
		 				'ro = RayOrigin;'+
		 				'rd = RayDir;'+
		 			'}'+
		 			'if(texScreenNormal.a > 0.0) {'+
		 				'vec3 vectorRandom = getVector(reflect(normalize(ro),rd), maxang, vec2(randX1,randY1));'+
		 				'vec4 rayT = rayTraversal(ro+(rd*(cs+cs)), vectorRandom);\n'+     // rX 0.0 perpend to normal; 0.5 parallel; 1.0 perpend
		 				//'vec4 rayT = rayTraversal(ro+(rd*(cs+cs)), vectorRandom);\n'+     // rX 0.0 perpend to normal; 0.5 parallel; 1.0 perpend
		
	 					'if(rayT.a > 0.0) {'+ // hit in solid
	 						'float rx = abs((randX1-0.5)*2.0);'+
	 						'rx = 1.0-rx;'+
	 						'float ry = abs((randY1-0.5)*2.0);'+
	 						'ry = 1.0-ry;'+
	
	 						'if(typePass == 0) color = vec4(texScreenColor.r*rayT.r,texScreenColor.g*rayT.g,texScreenColor.b*rayT.b, texScreenColor.a+1.0);\n'+ // save in textureFB_GIv2_screenColorTEMP
	 						'else if(typePass == 1) color = vec4(rayT.r,rayT.g,rayT.b, texScreenPos.a+(1.0));\n'+ // save in textureFB_GIv2_screenPosTEMP
	 						'else color = vec4(rayT.r,rayT.g,rayT.b, 1.0);\n'+ // save in textureFB_GIv2_screenNormalTEMP // alpha 1.0 (found solid)
	 					'} else {'+ // hit in light
	 						'if(typePass == 0) color = vec4(texScreenColor.r,texScreenColor.g,texScreenColor.b, texScreenColor.a+1.0);\n'+ // save in textureFB_GIv2_screenColorTEMP
	 						'else if(typePass == 1) color = vec4(1.0,1.0,1.0, texScreenPos.a-1.0);\n'+ // save in textureFB_GIv2_screenPosTEMP
	 						'else color = vec4(1.0,1.0,1.0, 0.0);\n'+ // save in textureFB_GIv2_screenNormalTEMP  // alpha 0.0 (make process and return to origin).
	 					'}'+
		 				
		 			'}'+
		 			//'color = vec4(ro, 1.0);\n'+ // for view pos
		 			//'color = vec4(vposition.xyz, 1.0);\n'+ // for view pos
		 			//'color = vec4(vnormal.xyz, 1.0);\n'+  // for view dir
	 			'} else {'+
					'vec4 texScreenColor = texture2D(sampler_screenColor, vec2(pixelCoord.x,pixelCoord.y));\n'+
					'vec4 texScreenPos = texture2D(sampler_screenPos, vec2(pixelCoord.x,pixelCoord.y));\n'+
					'vec4 texScreenNormal = texture2D(sampler_screenNormal, vec2(pixelCoord.x,pixelCoord.y));\n'+
					'vec4 texScreenGIVoxel = texture2D(sampler_GIVoxel, vec2(pixelCoord.x,pixelCoord.y));\n'+
					'if(texScreenNormal.a == 0.0) {'+ // texScreenNormal.a == 0.0 (Se encontro luz o maxbounds).
						'float am = (texScreenColor.a-texScreenPos.a)/(texScreenColor.a);'+
						'vec3 amount = vec3(am, am, am);'+
						//'color = vec4(texScreenGIVoxel.xyz+amount, texScreenGIVoxel.a+1.0);'+ // alpha is samples
						'color = vec4(texScreenGIVoxel.xyz+(amount*texScreenColor.rgb), texScreenGIVoxel.a+1.0);'+ // alpha is samples
					'} else {'+ // golpea en solido. No hacemos nada
						'color = texScreenGIVoxel;'+
						//'color = vec4(texScreenGIVoxel.xyz-((texScreenColor.xyz*amount)*0.001), texScreenGIVoxel.a);'+
					'}'+
	
					//'color = texScreenColor;'+ // for view color	
					//'color = texScreenPos;'+ // for view pos
					//'color = texScreenNormal;'+ // for view dir	
				'}'+
	
	 			
	 			'gl_FragColor = color;\n'+
       		 '}']];

       	return str_vfp;
	};
};
VFP_GI.prototype = Object.create(VFP.prototype);
VFP_GI.prototype.constructor = VFP_GI;
