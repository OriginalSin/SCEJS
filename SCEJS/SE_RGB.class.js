/** @private **/
function SE_RGB() { SE.call(this);
	this.dependencies = ["RGB"];

	this.getSrc = function() {
		var str_se = ["n", undefined,
                    // head
                    '',
                    // source
                    'vec4 color = RGB[n];\n'+
                    'return color;\n'];
		
		return str_se;
	};
};
SE_RGB.prototype = Object.create(SE.prototype);
SE_RGB.prototype.constructor = SE_RGB;