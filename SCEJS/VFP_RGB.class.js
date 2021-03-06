/** @private **/
function VFP_RGB(textureUnitCount) {
	this.getSrc = function() {
        return [["RGB"],
		    // vertex head
			'varying vec4 vVN;\n'+
			 'varying vec4 vVT;\n'+
			 'varying float vVTU;\n',
			
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
			'varying vec4 vVN;\n'+
			 'varying vec4 vVT;\n'+
			 'varying float vVTU;\n',
			 
			// fragment source
            'vec4 textureColor = texture2D(texAlbedo, vVT.xy);\n'+
            // diffuse
            'return [textureColor];\n'];
	};
}