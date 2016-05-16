/** @private **/
function VFP_GRID() { VFP.call(this);
	this.getSrc = function() {
		var str_vfp = [["RGB"],
		    // vertex head
			'varying vec4 vVC;\n',
			
			// vertex source
            'vec4 vp = vertexPos[];\n'+
            'vec4 vc = vertexColor[];\n'+

            'vVC = vc;'+

            'gl_Position = PMatrix * cameraWMatrix * nodeWMatrix * vp;\n',
			
			// fragment head
			'varying vec4 vVC;\n',
			 
			// fragment source
			'return [vVC];\n'
		];
		
		return str_vfp;
	};
};
VFP_GRID.prototype = Object.create(VFP.prototype);
VFP_GRID.prototype.constructor = VFP_GRID;