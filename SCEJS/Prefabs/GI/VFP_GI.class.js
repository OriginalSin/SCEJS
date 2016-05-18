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
			new Utils().rayTraversalSTR(resolution),

       		// fragment source
            'vec3 pixelCoord = vposScreen.xyz / vposScreen.w;'+

            'float maxang=0.7;'+
            'float maxB = 3.0;'+

            'vec4 texScreenColor = sampler_screenColor[vec2(pixelCoord.x,pixelCoord.y)];\n'+
            'vec4 texScreenPos = sampler_screenPos[vec2(pixelCoord.x,pixelCoord.y)];\n'+
            'vec4 texScreenNormal = sampler_screenNormal[vec2(pixelCoord.x,pixelCoord.y)];\n'+
            'vec4 texScreenGIVoxel = sampler_GIVoxel[vec2(pixelCoord.x,pixelCoord.y)];\n'+

            'vec4 f_sampler_screenColor;'+
            'vec4 f_sampler_screenPos;'+
            'vec4 f_sampler_screenNormal;'+
            'vec4 f_sampler_GIVoxel;'+
            'vec3 ro; vec3 rd; RayTraversalResponse rayT;'+


            'if(texScreenNormal.a == 0.0) {'+ // start
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

            'if(rayT.voxelColor.a > 0.0 && f_sampler_screenPos.a < 8.0) {'+ // hit in solid
                'float rx = abs((randX1-0.5)*2.0);'+
                'float ry = abs((randY1-0.5)*2.0);'+

                'vec4 rtColor = rayT.voxelColor;'+
                'vec4 rtPos = rayT.voxelPos;'+
                'vec4 rtNormal = rayT.voxelNormal;'+
                'f_sampler_screenColor = vec4(texScreenColor.r*rtColor.r,texScreenColor.g*rtColor.g,texScreenColor.b*rtColor.b, texScreenColor.a+(rtColor.a/uGridsize));\n'+ // -(rtColor.a/uGridsize)
                'f_sampler_screenPos = vec4(rtPos.r,rtPos.g,rtPos.b, texScreenPos.a+1.0);\n'+
                'f_sampler_screenNormal = vec4(rtNormal.r,rtNormal.g,rtNormal.b, 1.0);\n'+
            '} else {'+ // hit in light
                'f_sampler_screenColor = vec4(texScreenColor.r,texScreenColor.g,texScreenColor.b, texScreenColor.a);\n'+
                'f_sampler_screenPos = vec4(1.0,1.0,1.0, texScreenPos.a);\n'+
                'f_sampler_screenNormal = vec4(1.0,1.0,1.0, 0.0);\n'+ // (make process and return to origin alpha 0.0).
            '}'+


            'if(f_sampler_screenNormal.a == 0.0) {'+ //  hit in light. make process
                'f_sampler_GIVoxel = vec4(f_sampler_screenPos.a, f_sampler_screenPos.a, f_sampler_screenPos.a, texScreenGIVoxel.a+1.0);'+
            '} else {'+ // hit in solid. do nothing
                'f_sampler_GIVoxel = texScreenGIVoxel;'+
            '}'+

            'return [f_sampler_screenColor, f_sampler_screenPos, f_sampler_screenNormal, f_sampler_GIVoxel];\n'
         ];

       	return str_vfp;
	};
};
VFP_GI.prototype = Object.create(VFP.prototype);
VFP_GI.prototype.constructor = VFP_GI;
