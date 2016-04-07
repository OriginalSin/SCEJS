/** @private **/
function SE_RGB() { SE.call(this);
	this.dependencies = ["RGB"];

	this.getSrc = function() {
		var str_se = [
		    // fragment head
			[''],
			 
			[// fragment source
			 'void main(float4* RGB) {'+
						 	'vec2 x = get_global_id();'+
						 	
						 	// diffuse
						 	'out_float4 = RGB[x];\n'+
			 '}']];
		
		return str_se;
	};
};
SE_RGB.prototype = Object.create(SE.prototype);
SE_RGB.prototype.constructor = SE_RGB;