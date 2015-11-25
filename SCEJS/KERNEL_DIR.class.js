/** @private **/
function KERNEL_DIR(arrPP, arrF) { VFP.call(this);
	this.getSrc = function() {
		lines_argumentsPoles = (function() {
			var str = '';
			for(var n = 0, f = arrPP.length; n < f; n++) {
				str += ',float pole'+n+'X'+
						',float pole'+n+'Y'+
						',float pole'+n+'Z'+
						',float pole'+n+'Polarity'+
						',float pole'+n+'Orbit'+
						',float pole'+n+'Force';
			}
			return str;
		}).bind(this);
		lines_argumentsForces = (function() {
			var str = '';
			for(var n = 0, f = arrF.length; n < f; n++) {
				str += ',float force'+n+'X'+
						',float force'+n+'Y'+
						',float force'+n+'Z';
			} 
			return str;
		}).bind(this);
		
		lines_poles = (function() {
			var str = 'float offset;vec3 polePos;vec3 vecN; float toDir; vec3 cc;float distanceToPole;\n';
			for(var n = 0, f = arrPP.length; n < f; n++) {
				str += 'polePos = vec3(pole'+n+'X,pole'+n+'Y,pole'+n+'Z);\n'+ 
						'toDir = -1.0;\n'+  
						'if(sign(particlePolarity[x]) == 0.0 && sign(pole'+n+'Polarity) == 1.0) toDir = 1.0;\n'+
						'if(sign(particlePolarity[x]) == 1.0 && sign(pole'+n+'Polarity) == 0.0) toDir = 1.0;\n'+
						'offset = '+this.offset.toFixed(20)+';'+
						
						'distanceToPole = 1.0-sqrt(length(vec3(polePos-currentPos)/offset));'+
						
						'vecN = ((vec3(polePos-currentPos)-(-1.0))/(1.0-(-1.0)) - 0.5 ) *2.0 * pole'+n+'Force * toDir;'+
						'cc = vecN*distanceToPole ;\n'+
						
						'currentDir = clamp(currentDir+(cc*0.001),-1.0,1.0);\n'+
						
						//'if(pole'+n+'Orbit == 1.0) cc = 
						'';
			}
			return str;
		}).bind(this);
		lines_forces = (function() {
			var str = 'vec3 force;\n';
			for(var n = 0, f = arrF.length; n < f; n++) {
				str += 'force = vec3(force'+n+'X,force'+n+'Y,force'+n+'Z);\n'+ 
						'currentDir = currentDir+(force*0.0001);\n';
			} 
			return str;
		}).bind(this);
		
		
		
		
		
		var str_vfp = [
       	    // kernel head
       		[],
       		
       		// kernel source
       		['void main(float* idx'+
						',float* nodeId'+
						',float4* initPos'+
						',float4* initDir'+
						',float4* posXYZW'+
						',float4* dir'+
						',float* particlePolarity'+
						',float4* dest'+
						',float enableDestination'+
						',float destinationForce'+
						',float lifeDistance'+
						',float enableDrag'+
						',float idToDrag'+
						',float MouseDragTranslationX'+
						',float MouseDragTranslationY'+
						',float MouseDragTranslationZ'+
						',float islink'+
						lines_argumentsPoles()+ 
						lines_argumentsForces()+ 
						') {\n'+
			'vec2 x = get_global_id();\n'+	 
			'float idBN = idx[x];'+
			'float nodeidBN = nodeId[x];'+	
			'vec4 dirA = dir[x];'+								
			'vec3 currentDir = vec3(dirA.x,dirA.y,dirA.z);\n'+ 
			'vec3 currentPos = posXYZW[x].xyz;\n'+ 
			'vec4 dest = dest[x];'+
			'vec3 destinationPos = vec3(dest.x,dest.y,dest.z);\n'+ 
			
							
			lines_poles()+
			
			'if(enableDrag == 1.0) {'+
				'if(islink == 0.0) {'+
					'if(idBN == idToDrag) {'+
						'vec3 dp = vec3(MouseDragTranslationX, MouseDragTranslationY, MouseDragTranslationZ);'+ 
						'currentDir = dp;\n'+
					'}\n'+
				'} else {'+
					'if(nodeidBN == idToDrag) {'+
						'vec3 dp = vec3(MouseDragTranslationX, MouseDragTranslationY, MouseDragTranslationZ);'+ 
						'currentDir = dp;\n'+
					'}\n'+
				'}\n'+
			'}\n'+
			
			'if(enableDestination == 1.0) {\n'+
				'vec3 dirDestination = normalize(destinationPos-currentPos);\n'+
				'float distan = abs(distance(currentPos,destinationPos));\n'+
				'float dirDestWeight = sqrt(distan);\n'+  
				'currentDir = (currentDir+(dirDestination*dirDestWeight*destinationForce))*dirDestWeight*0.1;\n'+
			'}\n'+
			
			lines_forces()+
			
			'currentDir = currentDir*0.995;'+ // air resistence
			
			'vec3 newPos = (currentPos+currentDir);\n'+
			'vec4 initPos = initPos[x];'+
			'if(lifeDistance > 0.0 && distance(vec3(initPos.x,initPos.y,initPos.z),newPos) > lifeDistance) {'+
				'vec4 initDir = vec4(initDir[x]);'+
				'currentDir = vec3(initDir.x,initDir.y,initDir.z);'+
			'}'+
			
			'vec3 newDir = currentDir;\n'+
	
			'out_float4 = vec4(newDir,1.0);\n'+
		'}']];
       	
       	return str_vfp;
	};
};
KERNEL_DIR.prototype = Object.create(VFP.prototype);
KERNEL_DIR.prototype.constructor = KERNEL_DIR;