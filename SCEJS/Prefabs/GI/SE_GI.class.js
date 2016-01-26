/** @private **/
function SE_GI() { SE.call(this);
	this.dependencies = ["sampler_GIVoxel"];

	this.getSrc = function() {
		var str_se = [
		    // fragment head
			[''],
			 
			[// fragment source
			 'void main(float4* sampler_GIVoxel) {'+
						 	'vec2 x = get_global_id();'+
						 	
						 	// GI
						 	'vec4 textureFBGIVoxel = sampler_GIVoxel[x];\n'+				
							'vec3 GIweight = vec3((textureFBGIVoxel.r/textureFBGIVoxel.a), (textureFBGIVoxel.g/textureFBGIVoxel.a), (textureFBGIVoxel.b/textureFBGIVoxel.a));'+
							
							'out_float4 = vec4(GIweight, 1.0);'+
							//'out_float4 = vec4(textureFBGIVoxel.rgb, 1.0);\n'+ 
							
							
							//'out_float4 = vec4(out_float4.xyz*(0.75+(length(GIVoxelsShadow)/4.0)), out_float4.a);\n'+
							//'out_float4 = vec4(GIweight, GIweight, GIweight, 1.0);\n'+ 
			 '}']];
		
		return str_se;
	};
};
SE_GI.prototype = Object.create(SE.prototype);
SE_GI.prototype.constructor = SE_GI;