// ALIAS
function alias(object, name) {
    var fn = object ? object[name] : null;
    if (typeof fn == 'undefined') return function () {}
    return function () {
        return fn.apply(object, arguments)
    }
}
DGE = alias(document, 'getElementById');
DCE = alias(document, 'createElement'); 
D$ = alias(document, 'querySelector');
D$$ = alias(document, 'querySelectorAll');

// XHR
XHR = function() {
	var req;
	if (window.XMLHttpRequest) {
	      req = new XMLHttpRequest();
	} else {      // code for IE6, IE5
	      req = new ActiveXObject("Microsoft.XMLHTTP");
	}
	return req;
};

window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function(callback){
				window.setTimeout(callback, 1000 / 60);
			};
})();

/**
* @class
* @constructor
*/
Utils = function() {
	
};

/**
* Get HTMLCanvasElement from Uint8Array
* @returns {HTMLCanvasElement}
* @param {Uint8Array} array
* @param {Int} width
* @param {Int} height
*/
Utils.prototype.getCanvasFromUint8Array = function(uint8arr, width, height) {
	var e = document.createElement('canvas');
	e.width = width;
	e.height = height;
	var ctx2D = e.getContext("2d");		
	var image = ctx2D.createImageData(width,height);
	for(var i=0; i<image.data.length; i++)image.data[i] = uint8arr[i];
	ctx2D.putImageData(image,0,0);

    return e;
};
/**
 * @callback Utils~getImageFromCanvas~onload
 * @param {HTMLImageElement} img
 */
/**
* Get HTMLImageElement from canvas
* @param {HTMLCanvasElement} canvasElement
* @param {Utils~getImageFromCanvas~onload} canvasElement
*/
Utils.prototype.getImageFromCanvas = function(oldCanvas, onload) {
	var imagen = document.createElement('img');
	imagen.onload = (function(img, onload){
		onload(img);
    }).bind(this, imagen, onload);
	imagen.src = oldCanvas.toDataURL();
};

/**
* Get Uint8Array from HTMLImageElement
* @returns {Uint8Array}
* @param {HTMLImageElement} imageElement
*/
Utils.prototype.getUint8ArrayFromHTMLImageElement = function(imageElement) {
	var e = document.createElement('canvas');
	e.width = imageElement.width;
	e.height = imageElement.height;
	var ctx2D_tex = e.getContext("2d");		
	ctx2D_tex.drawImage(imageElement, 0, 0);
	var arrayTex = ctx2D_tex.getImageData(0, 0, imageElement.width, imageElement.height);

    return arrayTex.data;
};

/**
* Get random vector from vecNormal with deviation in degrees
* @returns {StormV3}
* @param {StormV3} normalVector
* @param {Float} degrees
*/
Utils.prototype.getVector = function(vecNormal, degrees) {
	var ob = this.cartesianToSpherical(vecNormal);
	var angleLat = ob.lat;
	var angleLng = ob.lng;
			
	var desvLat = (Math.random()*180.0)-90.0;
	var desvLng = (Math.random()*180.0)-90.0;
	angleLat += (degrees*desvLat);
	angleLng += (degrees*desvLng);

	return this.sphericalToCartesian(1.0, angleLat, angleLng);
};
/**
* Get random vector from vecNormal with deviation in degrees (GLSL)
* @returns {String}
*/
Utils.prototype.getVectorGLSLFunctionString = function() {
	return 'vec3 getVector(vec3 vecNormal, float degrees, vec2 vecNoise) {\n'+ 
		'vec3 ob = cartesianToSpherical(vecNormal);'+
		'float angleLat = ob.y;'+
		'float angleLng = ob.z;'+
	
		'float desvLat = (vecNoise.x*180.0)-90.0;'+
		'float desvLng = (vecNoise.y*180.0)-90.0;'+
		'angleLat += (degrees*desvLat);'+
		'angleLng += (degrees*desvLng);'+
	
		'return sphericalToCartesian(vec3(1.0, angleLat, angleLng));'+
	'}\n';
};

/**
 * cartesianToSpherical
 * @param {StormV3} vec
 * @returns {Object}
 * @example
 * $V3([1,0,0])  return {radius: 1, lat: 90, lng: 0}
 * $V3([0,0,1])  return {radius: 1, lat: 90, lng: 90}
 * $V3([-1,0,0]) return {radius: 1, lat: 90, lng: 180}
 * $V3([0,0,-1]) return {radius: 1, lat: 90, lng: -90}
 */
Utils.prototype.cartesianToSpherical = function(vec) {
	var r = Math.sqrt(vec.e[0]*vec.e[0] + vec.e[1]*vec.e[1] + vec.e[2]*vec.e[2]);
	
	var angleLat = this.radToDeg(Math.acos(vec.e[1]/r));
	var angleLng = this.radToDeg(Math.atan2(vec.e[2], vec.e[0]));
	
	return {"radius": r,
			"lat": angleLat,
			"lng": angleLng};
}	
/**
 * cartesianToSpherical (GLSL)
* @returns {String}
*/
Utils.prototype.cartesianToSphericalGLSLFunctionString = function() {
	return 'vec3 cartesianToSpherical(vec3 vect) {\n'+
		'float r = sqrt(vect.x*vect.x + vect.y*vect.y + vect.z*vect.z);'+
	
		'float angleLat = radToDeg(acos(vect.y/r));'+
		'float angleLng = radToDeg(atan(vect.z, vect.x));'+
	
		'return vec3(r, angleLat, angleLng);'+
	'}\n';
};

/**
 * sphericalToCartesian
 * @param {Float} radius
 * @param {Float} lat Lat in degrees
 * @param {Float} lng Lng in degrees
 * @returns {StormV3}
 * @example
 * (1.0, 90.0, 0.0).e) return $V3([1,0,0])
 * (1.0, 90.0, 90.0).e) return $V3([0,0,1])
 * (1.0, 90.0, 180.0).e) return $V3([-1,0,0])
 * (1.0, 90.0, -90.0).e) return $V3([0,0,-1])
 **/
Utils.prototype.sphericalToCartesian = function(radius, lat, lng) {	
	var r = radius;
	var angleLat = this.degToRad(lat); 
	var angleLng = this.degToRad(lng);
	
	var x = r*Math.sin(angleLat)*Math.cos(angleLng);
	var z = r*Math.sin(angleLat)*Math.sin(angleLng);
	var y = r*Math.cos(angleLat);
	
	return new $V3([x,y,z]);
}
/**
 * sphericalToCartesian (GLSL)
* @returns {String}
*/
Utils.prototype.sphericalToCartesianGLSLFunctionString = function() {
	return 'vec3 sphericalToCartesian(vec3 vect) {\n'+
		'float r = vect.x;'+
		'float angleLat = degToRad(vect.y);'+
		'float angleLng = degToRad(vect.z);'+
	
		'float x = r*sin(angleLat)*cos(angleLng);'+
		'float z = r*sin(angleLat)*sin(angleLng);'+
		'float y = r*cos(angleLat);'+
	
		'return vec3(x,y,z);'+
	'}\n';
};

/**
* Refract
* @returns {StormV3}
* @param {StormV3} V
* @param {StormV3} N
* @param {Float} n1 Refract index way 1
* @param {Float} n2 Refract index way 2
*/
Utils.prototype.refract = function(V, N, n1, n2) {
	var refrIndex = n1/n2;
	var cosI = N.dot(V)*-1.0;
	var cosT2 = 1.0 - refrIndex * refrIndex * (1.0 - cosI * cosI);
	var vv = V.x(refrIndex);
	return  vv.add( N.x(refrIndex * cosI - Math.sqrt(cosT2)) );
};

/**
* Degrees to radians. Full circle = 360 degrees.
* @returns {Float}
* @param {Float} degrees
*/
Utils.prototype.degToRad = function(deg) {
	return (deg*3.14159)/180;
};
/**
 * Degrees to radians. Full circle = 360 degrees. (GLSL)
* @returns {String}
*/
Utils.prototype.degToRadGLSLFunctionString = function() {
	return 'float degToRad(float deg) {'+
		'return (deg*3.14159)/180.0;'+
	'}';
};

/**
* Radians to degrees
* @returns {Float}
* @param {Float} radians
*/
Utils.prototype.radToDeg = function(rad) {
	return rad*(180/3.14159);
};
/**
 * Radians to degrees (GLSL)
* @returns {String}
*/
Utils.prototype.radToDegGLSLFunctionString = function() {
	return 'float radToDeg(float rad) {'+
		'return rad*(180.0/3.14159);'+
	'}';
};

/**
 * 
 * @param {String} hex
 * @returns  {Array<Float>} rgb values from 0 to 255
 */
Utils.prototype.hexToRgb = function(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
/**
 * @param {Array<Float>} rgb values from 0 to 255
 * @returns {String}
 */
Utils.prototype.rgbToHex = function(rgb) {
    var rgbVal = rgb[2] | (rgb[1] << 8) | (rgb[0] << 16);
    return '#' + (0x1000000 + rgbVal).toString(16).slice(1);
}

/**
* Inverse sqrt
* @returns {Float}
* @param {Float} value
*/
Utils.prototype.invsqrt = function(value) {
	return 1.0/value;
};

/**
* Smoothstep
* @returns {Float}
* @param {Float} edge0
* @param {Float} edge1
* @param {Float} current
*/
Utils.prototype.smoothstep = function(edge0, edge1, x) {
    if (x < edge0) return 0;
    if (x >= edge1) return 1;
    if (edge0 == edge1) return -1;
    var p = (x - edge0) / (edge1 - edge0);
	
    return (p * p * (3 - 2 * p));
};

/**
* Dot product vector4float
* @param {Array<Float>} vector Vector a
* @param {Array<Float>} vector Vector b
*/
Utils.prototype.dot4 = function(vector4A,vector4B) {
	return vector4A[0]*vector4B[0] + vector4A[1]*vector4B[1] + vector4A[2]*vector4B[2] + vector4A[3]*vector4B[3];
};

/**
* Compute the fractional part of the argument. Example: fract(pi)=0.14159265...
* @param {Float} value
*/
Utils.prototype.fract = function(number) {
	return number - Math.floor(number);
};

/**
 * Angle between two vectors viewing from top
 * @returns {Float}
 * @param {StormV3} vectorA
 * @param {StormV3} vectorB
 
Utils.prototype.angle = function(vA, vB) {
	var vAA = vA.normalize();
	var vBB = vB.normalize();
	
	var escalarProduct = Math.acos((vAA.e[0]*vBB.e[0])+(vAA.e[1]*vBB.e[1])+(vAA.e[2]*vBB.e[2]));
	
	var vCC = vAA.cross(vBB);
	//console.log(vCC.e[0]+" "+vCC.e[1]+" "+vCC.e[2]);
	
	if(vCC.e[1] == 1) {
		escalarProduct = (Math.PI+escalarProduct);
	}

	return escalarProduct;
};*/

/**
* Pack 1float (0.0-1.0) to 4float rgba (0.0-1.0, 0.0-1.0, 0.0-1.0, 0.0-1.0)*
* @param {Float} value
* @returns {Array<Float>}
*
*/
Utils.prototype.pack = function(v) {
	var bias = [1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0];

	var r = v;
	var g = this.fract(r * 255.0);
	var b = this.fract(g * 255.0);
	var a = this.fract(b * 255.0);
	var colour = [r, g, b, a];
	
	var dd = [colour[1]*bias[0],colour[2]*bias[1],colour[3]*bias[2],colour[3]*bias[3]];
	
	return [colour[0]-dd[0],colour[1]-dd[1],colour[2]-dd[2],colour[3]-dd[3] ];
};
/**
* Get pack GLSL function string
* @returns {String}
*/
Utils.prototype.packGLSLFunctionString = function() {
	return 'vec4 pack (float depth) {'+
				'const vec4 bias = vec4( 1.0 / 255.0,'+
										'1.0 / 255.0,'+
										'1.0 / 255.0,'+
										'0.0);'+

				'float r = depth;'+
				'float g = fract(r * 255.0);'+
				'float b = fract(g * 255.0);'+
				'float a = fract(b * 255.0);'+
				'vec4 colour = vec4(r, g, b, a);'+
				
				'return colour - (colour.yzww * bias);'+
			'}';
};
/**
* Unpack 4float rgba (0.0-1.0, 0.0-1.0, 0.0-1.0, 0.0-1.0) to 1float (0.0-1.0)
* @returns {Float}
* @param {Array<Float>} value
*/
Utils.prototype.unpack = function(colour) {
	var bitShifts = [1.0, 1.0/255.0, 1.0/(255.0*255.0), 1.0/(255.0*255.0*255.0)];
	return this.dot4(colour, bitShifts);
};
/**
* Get unpack GLSL function string
* @returns {String}
*/
Utils.prototype.unpackGLSLFunctionString = function() {
	return 'float unpack (vec4 colour) {'+
				'const vec4 bitShifts = vec4(1.0,'+
											'1.0 / 255.0,'+
											'1.0 / (255.0 * 255.0),'+
											'1.0 / (255.0 * 255.0 * 255.0));'+
				'return dot(colour, bitShifts);'+
			'}';
};
/** @private  */
Utils.prototype.rayTraversalInitSTR = function() {  
	return ''+
	'float wh = ceil(sqrt(uResolution*uResolution*uResolution));\n'+
	'float cs = uGridsize/uResolution;\n'+ // cell size
	'float chs = cs/2.0;\n'+ // cell size
	'float texelSize = 1.0/(wh-1.0);\n'+  // 1.0/(wh-1.0)??
	
	// Fast Voxel Traversal Algorithm for Ray Tracing. John Amanatides & Andrew Woo.
	// http://www.cse.chalmers.se/edu/course/TDA361/grid.pdf
	// More info:
	// http://www.clockworkcoders.com/oglsl/rt/gpurt3.htm
	'vec3 gl = vec3(-(uGridsize/2.0), -(uGridsize/2.0), -(uGridsize/2.0));\n'+
	'vec3 _r = vec3(uGridsize, uGridsize, uGridsize);\n'+
	'vec3 _rRes = vec3(uResolution, uResolution, uResolution);\n'+
	'vec3 _len = _r/_rRes;\n'+

	'vec3 worldToVoxel(vec3 world) {\n'+
		'vec3 ijk = (world - gl) / _len;\n'+ // (1.0-(-1.0)) / (2/64) = 64 
		'ijk = vec3(floor(ijk.x), floor(ijk.y), floor(ijk.z));\n'+
		'return ijk;\n'+
	'}\n'+
	'float voxelToWorldX(float x) {return x * _len.x + gl.x;}\n'+ // 64*(2/64)+(-1.0) = 1.0
	'float voxelToWorldY(float y) {return y * _len.y + gl.y;}\n'+
	'float voxelToWorldZ(float z) {return z * _len.z + gl.z;}\n';
};
/** @private  */
Utils.prototype.rayTraversalSTR = function(resolution) {
	return ''+
	'vec2 getId(vec3 voxel) {\n'+
        'int tex3dId = (int(voxel.y)*(int(uResolution)*int(uResolution)))+(int(voxel.z)*(int(uResolution)))+int(voxel.x);\n'+
        'float num = float(tex3dId)/wh;\n'+
        'float col = fract(num)*wh;\n'+
        'float row = floor(num);\n'+
        'return vec2(col*texelSize, row*texelSize);\n'+
    '}\n'+
    'vec4 getVoxel_Color(vec2 texVec, vec3 voxel, vec3 RayOrigin) {\n'+
        'vec4 rgba = vec4(0.0,0.0,0.0,0.0);\n'+

        'vec4 texture = sampler_voxelColor[vec2(texVec.x, texVec.y)];\n'+
        'if(texture.a/255.0 > 0.5) {\n'+ // existen triángulos dentro?
            'rgba = vec4(texture.rgb/255.0,distance(vec3(voxelToWorldX(voxel.x), voxelToWorldX(voxel.y), voxelToWorldX(voxel.z)),RayOrigin));\n'+
        '}\n'+

        'return rgba;\n'+
    '}\n'+
    'vec4 getVoxel_Pos(vec2 texVec) {\n'+
        'vec4 rgba = vec4(0.0,0.0,0.0,0.0);\n'+

        'vec4 texture = sampler_voxelPos[vec2(texVec.x, texVec.y)];\n'+
        //distance(vec3(voxelToWorldX(voxel.x), voxelToWorldX(voxel.y), voxelToWorldX(voxel.z)),RayOrigin)
        'rgba = vec4( ((texture.xyz/255.0)*uGridsize)-(uGridsize/2.0), 1.0);\n'+

        'return rgba;\n'+
    '}\n'+
    'vec4 getVoxel_Normal(vec2 texVec) {\n'+
        'vec4 rgba = vec4(0.0,0.0,0.0,0.0);\n'+

        'vec4 texture = sampler_voxelNormal[vec2(texVec.x, texVec.y)];\n'+
        'rgba = vec4(((texture.rgb/255.0)*2.0)-1.0, 1.0);\n'+

        'return rgba;\n'+
    '}\n'+
    'struct RayTraversalResponse {'+
        'vec4 voxelColor;'+
        'vec4 voxelPos;'+
        'vec4 voxelNormal;'+
    '};'+
	'RayTraversalResponse rayTraversal(vec3 RayOrigin, vec3 RayDir) {\n'+
        'vec4 fvoxelColor = vec4(0.0, 0.0, 0.0, 0.0);'+
        'vec4 fvoxelPos = vec4(0.0, 0.0, 0.0, 0.0);'+
        'vec4 fvoxelNormal = vec4(0.0, 0.0, 0.0, 0.0);'+

		'vec3 voxel = worldToVoxel(RayOrigin);'+
		'vec3 _dir = normalize(RayDir);'+
		'vec3 tMax;'+
		'if(RayDir.x < 0.0) tMax.x = (voxelToWorldX(voxel.x)-RayOrigin.x)/RayDir.x;'+
		'if(RayDir.x > 0.0) tMax.x = (voxelToWorldX(voxel.x+1.0)-RayOrigin.x)/RayDir.x;'+
		'if(RayDir.y < 0.0) tMax.y = (voxelToWorldY(voxel.y)-RayOrigin.y)/RayDir.y;'+
		'if(RayDir.y < 0.0) tMax.y = (voxelToWorldY(voxel.y+1.0)-RayOrigin.y)/RayDir.y;'+
		'if(RayDir.z < 0.0) tMax.z = (voxelToWorldZ(voxel.z)-RayOrigin.z)/RayDir.z;'+
		'if(RayDir.z < 0.0) tMax.z = (voxelToWorldZ(voxel.z+1.0)-RayOrigin.z)/RayDir.z;'+

		'float tDeltaX = _r.x/abs(RayDir.x);'+// hasta qué punto se debe avanzar en la dirección del rayo antes de que nos encontramos con un nuevo voxel en la dirección x
		'float tDeltaY = _r.y/abs(RayDir.y);'+
		'float tDeltaZ = _r.z/abs(RayDir.z);'+

		'float stepX = 1.0; float stepY = 1.0; float stepZ = 1.0;\n'+
		'float outX = _r.x; float outY = _r.y; float outZ = _r.z;\n'+
		'if(RayDir.x < 0.0) {stepX = -1.0; outX = -1.0;}'+
		'if(RayDir.y < 0.0) {stepY = -1.0; outY = -1.0;}'+
		'if(RayDir.z < 0.0) {stepZ = -1.0; outZ = -1.0;}'+

		'vec4 color = vec4(0.0,0.0,0.0,0.0);\n'+
		'bool c1; bool c2; bool c3; bool isOut;'+

        'vec2 vid;'+
		'for(int c = 0; c < '+resolution+'*2; c++) {\n'+
			'c1 = bool(tMax.x < tMax.y);'+
			'c2 = bool(tMax.x < tMax.z);'+
			'c3 = bool(tMax.y < tMax.z);'+
			'isOut = false;'+
			'if (c1 && c2) {'+
				'voxel.x += stepX;'+
				'if(voxel.x==outX) isOut=true;'+
				'tMax.x += tDeltaX;'+
			'} else if(( (c1 && !c2) || (!c1 && !c3) )) {'+
				'voxel.z += stepZ;'+
				'if(voxel.z==outZ) isOut=true;'+
				'tMax.z += tDeltaZ;'+
			'} else if(!c1 && c3) {'+
				'voxel.y += stepY;'+
				'if(voxel.y==outY) isOut=true;'+
				'tMax.y += tDeltaY;'+
			'}'+
			'if(isOut == true) break;\n'+
			'else {'+
				'if((voxel.x >= 0.0 && voxel.x <= _rRes.x && voxel.y >= 0.0 && voxel.y <= _rRes.y && voxel.z >= 0.0 && voxel.z <= _rRes.z)) {;\n'+

                    'vid = getId(voxel);'+
                    'vec4 vcc = getVoxel_Color(vid, voxel, RayOrigin);'+
                    'if(vcc.a != 0.0) {'+
                        'fvoxelColor = vcc;'+
                        'break;\n'+
                    '}'+

				'}'+
			'}'+
		'}'+
        'fvoxelPos = getVoxel_Pos(vid);'+
        'fvoxelNormal = getVoxel_Normal(vid);'+
		'return RayTraversalResponse(fvoxelColor, fvoxelPos, fvoxelNormal);'+
	'}\n';
};

/** @private  */
Utils.prototype.isPowerOfTwo = function(x) {
    return (x & (x - 1)) == 0;
};
/** @private  */
Utils.prototype.nextHighestPowerOfTwo = function(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
};
/** @private */
Utils.prototype.getElementPosition = function(element) {
	var elem=element, tagname="", x=0, y=0;
   
	while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
	   y += elem.offsetTop;
	   x += elem.offsetLeft;
	   tagname = elem.tagName.toUpperCase();

	   if(tagname == "BODY")
		  elem=0;

	   if(typeof(elem) == "object") {
		  if(typeof(elem.offsetParent) == "object")
			 elem = elem.offsetParent;
	   }
	}

	return {x: x, y: y};
};
/** @private */
Utils.prototype.getWebGLContextFromCanvas = function(canvas, ctxOpt) {
	return new WebCLGLUtils().getWebGLContextFromCanvas(canvas, ctxOpt);
};
/** @private */
Utils.prototype.fullScreen = function() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
  }
}; 
/*
var arrayPick = new Uint8Array((this.viewportWidth * this.viewportHeight) * 4); 
this.gl.readPixels(0, 0, this.viewportWidth, this.viewportHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, arrayPick);

var ctx2DS = document.getElementById('stormCanvasS').getContext("2d");
cd = ctx2DS.getImageData(0, 0, this.viewportWidth, this.viewportHeight);
for (var row = 0; row < this.viewportHeight; row++) {
		for (var col = 0; col < this.viewportWidth; col++) {
			var idx = ((row * this.viewportWidth) + col);
			var idxData = idx*4;
			cd.data[idxData+0] = arrayPick[idxData];
			cd.data[idxData+1] = arrayPick[idxData+1];
			cd.data[idxData+2] = arrayPick[idxData+2];
			cd.data[idxData+3] = 255;
		}
	}
	
ctx2DS.putImageData(cd, 0, 0);
*/
	
/*
var img = document.getElementById('stormCanvas').toDataURL("image/jpeg");
$('#gg').html("<img src=\"" + img + "\" width=\"320\" height=\"480\"/>");
*/
