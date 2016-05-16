/** @private **/
function VFP_GI(resolution) { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [["sampler_screenColor","sampler_screenPos","sampler_screenNormal","sampler_GIVoxel"],
       	    // vertex head
       		'varying vec4 vposition;\n'+
     		'varying vec4 vnormal;\n'+
    		'varying vec4 vposScreen;\n'+
    		'const mat4 ScaleMatrix = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);',

       		// vertex source
            'vec3 vp = vec3(vertexPos[].x, vertexPos[].y, vertexPos[].z);\n'+
            'vposition = nodeWMatrix * vec4(vp*vec3(1.0,1.0,1.0), 1.0);\n'+
            'vnormal = vec4(vertexNormal[].xyz*vec3(1.0,1.0,1.0), 1.0);\n'+

            'vec4 pos = PMatrix * cameraWMatrix * nodeWMatrix * vec4(vp, 1.0);'+
            'vposScreen = ScaleMatrix * pos;\n'+

            'gl_Position = pos;\n',

       		
       		
       		// fragment head
       		'varying vec4 vposition;\n'+
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
				'vec4 texture = sampler_voxelColor[vec2(texVec.x, texVec.y)];\n'+
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
				'vec4 texture = sampler_voxelPos[vec2(texVec.x, texVec.y)];\n'+
				'if(texture.a/255.0 > 0.5) {\n'+ // existen triángulos dentro?
					'vec4 texVoxelPosX = sampler_voxelPos[vec2(texVec.x,texVec.y)]/255.0;\n'+
	
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
				'vec4 texture = sampler_voxelNormal[vec2(texVec.x, texVec.y)];\n'+
				'if(texture.a/255.0 > 0.5) {\n'+ // existen triángulos dentro?
					'rgba = vec4(((texture.rgb/255.0)*2.0)-1.0,1.0);\n'+
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
			''),


       		// fragment source
            'vec3 pixelCoord = vposScreen.xyz / vposScreen.w;'+

            'vec4 color;'+
            'vec4 f_sampler_screenColor;'+
            'vec4 f_sampler_screenPos;'+
            'vec4 f_sampler_screenNormal;'+
            'vec4 f_sampler_GIVoxel;'+
            'float maxang=0.7;'+
            'float maxB = 3.0;'+



            'vec4 texScreenColor = sampler_screenColor[vec2(pixelCoord.x,pixelCoord.y)];\n'+
            'vec4 texScreenPos = sampler_screenPos[vec2(pixelCoord.x,pixelCoord.y)];\n'+
            'vec4 texScreenNormal = sampler_screenNormal[vec2(pixelCoord.x,pixelCoord.y)];\n'+
            'vec4 texScreenGIVoxel = sampler_GIVoxel[vec2(pixelCoord.x,pixelCoord.y)];\n'+


            'if(texScreenNormal.a == 0.0) {'+ // IF texScreenNormal.a == 0.0 Prepare to start
                'f_sampler_screenColor = vec4(1.0,1.0,1.0, 1.0);\n'+ // SAVE IN sampler_screenColor
                'f_sampler_screenPos = vec4(0.0,0.0,0.0, 1.0);\n'+ // SAVE IN sampler_screenPos
                'f_sampler_screenNormal = vec4(0.0,0.0,0.0, 0.5);\n'+ // SAVE IN sampler_screenNormal // alpha 0.5 ready to start
            '} else if(texScreenNormal.a > 0.0) {'+
                'vec3 ro; vec3 rd; vec4 rayT;'+

                'if(texScreenNormal.a == 0.5) {'+
                    'ro = vposition.xyz*vec3(1.0,1.0,1.0);'+
                    'rd = vnormal.xyz*vec3(1.0,1.0,1.0);'+


                    'vec3 vectorRandom = getVector(rd, maxang, vec2(randX1,randY1));'+
                    'rayT = rayTraversal(ro+(rd*(cs+cs)), vectorRandom);\n'+
                '} else if(texScreenNormal.a == 1.0) {'+
                    'ro = texScreenPos.xyz;'+
                    'rd = texScreenNormal.xyz;'+
                    //'rd = reflect(normalize(ro),rd);'+


                    'vec3 vectorRandom = getVector(rd, maxang, vec2(randX1,randY1));'+
                    'rayT = rayTraversal(ro+(rd*(cs+cs)), vectorRandom);\n'+
                '}'+


                'if(rayT.a > 0.0) {'+ // hit in solid
                    //'float proc = (texScreenPos.a == maxB) ? 0.0 : 1.0;'+ // 1.0  (hit in solid. do nothing alpha 1.0); 0.0 (make process and return to origin alpha 0.0).
                    'float rx = abs((randX1-0.5)*2.0);'+
                    'float ry = abs((randY1-0.5)*2.0);'+

                    'f_sampler_screenColor = vec4(texScreenColor.r*rayT.r,texScreenColor.g*rayT.g,texScreenColor.b*rayT.b, texScreenColor.a*(rayT.a/uGridsize));\n'+ // -(rayT.a/uGridsize)
                    'f_sampler_screenPos = vec4(rayT.r,rayT.g,rayT.b, texScreenPos.a+1.0);\n'+
                    'f_sampler_screenNormal = vec4(rayT.r,rayT.g,rayT.b, 1.0);\n'+
                '} else {'+ // hit in light
                    'f_sampler_screenColor = vec4(texScreenColor.r,texScreenColor.g,texScreenColor.b, texScreenColor.a);\n'+
                    'f_sampler_screenPos = vec4(1.0,1.0,1.0, texScreenPos.a+1.0);\n'+
                    'f_sampler_screenNormal = vec4(1.0,1.0,1.0, 0.0);\n'+ // (make process and return to origin alpha 0.0).
                '}'+

            '}'+
            //'color = vec4(ro, 1.0);\n'+ // for view pos
            //'color = vec4(vposition.xyz, 1.0);\n'+ // for view pos
            //'color = vec4(vnormal.xyz, 1.0);\n'+  // for view dir


            'if(texScreenNormal.a == 0.0) {'+ //  alpha 1.0 (hit in light. make process)
                //'float am = (f_sampler_screenPos.a)-(f_sampler_screenColor.a);'+
                //'vec3 amount = vec3(am, am, am);'+
                'f_sampler_GIVoxel = vec4(texScreenGIVoxel.xyz+(f_sampler_screenColor.a*f_sampler_screenColor.rgb), texScreenGIVoxel.a+(1.0));'+ // alpha is samples
                //'color = vec4(texScreenGIVoxel.xyz+(amount*f_sampler_screenColor.rgb), texScreenGIVoxel.a+1.0);'+ // alpha is samples
            '} else {'+ // alpha 1.0 (hit in solid. do nothing)
                'f_sampler_GIVoxel = texScreenGIVoxel;'+
                //'color = vec4(texScreenGIVoxel.xyz-((f_sampler_screenColor.xyz*amount)*0.001), texScreenGIVoxel.a);'+
            '}'+

            //'color = f_sampler_screenColor;'+ // for view color
            //'color = f_sampler_screenPos;'+ // for view pos
            //'color = f_sampler_screenNormal;'+ // for view dir


            'return [f_sampler_screenColor, f_sampler_screenPos, f_sampler_screenNormal, f_sampler_GIVoxel];\n'
         ];

       	return str_vfp;
	};
};
VFP_GI.prototype = Object.create(VFP.prototype);
VFP_GI.prototype.constructor = VFP_GI;
