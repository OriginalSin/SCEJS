/** @private **/
function SE_VolumeView(resolution) { SE.call(this);
	this.dependencies = ["sampler_volume"];

	this.getSrc = function() {
		var str_se = [
		    // fragment head
			[''+
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
					'rgba = vec4(texture.rgb/255.0,distance(vec3(voxelToWorldX(voxel.x), voxelToWorldX(voxel.y), voxelToWorldX(voxel.z)),RayOrigin));\n'+
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
				'vec4 texture = texture2D(sampler_voxelPos,vec2(texVec.x, texVec.y));\n'+
				'if(texture.a/255.0 > 0.5) {\n'+ // existen triángulos dentro?
					'vec4 texVoxelPosX = texture2D(sampler_voxelPos,  vec2(texVec.x,texVec.y))/255.0;\n'+
	
					'rgba = vec4( (texVoxelPosX.xyz*uGridsize)-(uGridsize/2.0), 1.0);\n'+
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
				'}\n'+
	
				'return rgba;\n'+
			'}\n'+
	
			new Utils().rayTraversalSTR(resolution, ''+
				//'gv = getVoxel_Color(voxel, RayOrigin);'+
				'gv = getVoxel_Pos(voxel, RayOrigin);'+
				//'gv = getVoxel_Normal(voxel, RayOrigin);'+
				'if(gv.a != 0.0) {'+
					'color = gv;\n'+
					'break;\n'+
				'}'+
			'')],
			 
			[// fragment source
			 'void main(float4* sampler_voxelColor,'+
			       		'float4* sampler_voxelPos,'+
			       		'float4* sampler_voxelNormal,'+
			 			'float4 posCamGoal,'+
			 			'float4 posCamTarget,'+
			 			'float viewportWidth,'+
			 			'float viewportHeight,'+
			 			
			 			'float uGridsize,'+
       		 			'float uResolution) {'+
						 	'vec2 x = get_global_id();'+
						 	
						 	'vec3 posCamera = posCamGoal.xyz;\n'+
							'vec3 posCameraPivot = posCamTarget.xyz;\n'+
							
							'vec3 vecView = normalize(posCameraPivot-posCamera);\n'+
							
							'vec3 centroPlanoProyeccion = posCamera+(vecView*0.5);\n'+
							
							'vec3 vecXPlanoProyeccion = normalize(cross(vec3(0.0,1.0,0.0), vecView));\n'+
							'vec3 vecYPlanoProyeccion = normalize(cross(vecView, vecXPlanoProyeccion));\n'+
							
							'float widthPixel = 1.0/viewportWidth;\n'+
							'float heightPixel = 1.0/viewportWidth;\n'+
							
							'vec3 locFirstX = vecXPlanoProyeccion*((viewportWidth/2.0)*widthPixel);\n'+
							'vec3 locFirstY = vecYPlanoProyeccion*((viewportHeight/2.0)*heightPixel);\n'+
							'vec3 pixelOrigin = centroPlanoProyeccion+locFirstX;\n'+
							'pixelOrigin += locFirstY;\n'+
							
							
							'vec3 pixelPos = pixelOrigin+(-vecXPlanoProyeccion*(gl_FragCoord.x*widthPixel));\n'+
							'pixelPos += -vecYPlanoProyeccion*((viewportHeight-gl_FragCoord.y)*heightPixel);\n'+ 
							
							'vec3 currentPixelDir = normalize(pixelPos-posCamera);\n'+
							'vec3 end = posCamera+(currentPixelDir*20000.0);\n'+
							
							
							'vec4 rayT = rayTraversal(posCamera, currentPixelDir);\n'+
						 	
							'if(rayT.a > 0.0) {'+ // hit in solid
								'out_float4 = vec4(rayT.rgb, 1.0);'+ 
		 					'} else {'+ // hit in light
		 						'out_float4 = vec4(0.0,0.0,0.0, 1.0);'+
		 					'}'+
							
			 '}']];
		
		return str_se;
	};
};
SE_VolumeView.prototype = Object.create(SE.prototype);
SE_VolumeView.prototype.constructor = SE_VolumeView;