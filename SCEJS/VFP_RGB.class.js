/** @private **/
function VFP_RGB(textureUnitCount) { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [["RGB"],
		    // vertex head
			'out vec4 vVN;\n'+
			 'out vec4 vVT;\n'+
			 'out float vVTU;\n',
			
			// vertex source
            'vec4 vp = vertexPos[];\n'+
            'vec4 vn = vertexNormal[];\n'+
            'vec4 vt = vertexTexture[];\n'+
            'float vtu = vertexTextureUnit[];\n'+

            'vVN = vn;'+
            'vVT = vt;'+
            'vVTU = vtu;'+

            'gl_Position = PMatrix * cameraWMatrix * nodeWMatrix * vp;\n',
			
			// fragment head
			'in vec4 vVN;\n'+
			 'in vec4 vVT;\n'+
			 'in float vVTU;\n',
			 
			// fragment source
            'vec4 textureColor = texture(texAlbedo, vVT.xy);\n'+
            // diffuse
            'return [textureColor];\n'];
		
		return str_vfp;
	};
};
VFP_RGB.prototype = Object.create(VFP.prototype);
VFP_RGB.prototype.constructor = VFP_RGB;