/**
* @class
* @constructor
*/
Mesh = function() {
	"use strict";
	
	var _obj = {};
	var _textures = {};
	var objIndex; // for store new indexes
	var indexMax=0; 
	
	/**
	* Load a point
	*/
	this.loadPoint = function() {
		_obj.vertexArray = [0.0, 0.0, 0.0, 0.0];
		_obj.normalArray = [0.0, 1.0, 0.0, 0.0];	
		_obj.textureArray = [0.0, 0.0, 0.0, 0.0];
		_obj.textureUnitArray = [0.0];
		_obj.indexArray = [0];
		
		return _obj;
	};
	
	/**
	* Load a triangle
	* @param {Object} jsonIn
	* @param {Float} [scale=1.0]
	* @param {Float} [jsonIn.side=1.0]
	*/
	this.loadTriangle = function(jsonIn) {
		var sca = (jsonIn != undefined && jsonIn.scale != undefined) ? jsonIn.scale : 1.0;
		var side = (jsonIn != undefined && jsonIn.side != undefined) ? jsonIn.side : 1.0 ;
		
		_obj.vertexArray = [0.0, 0.0, 0.0, 1.0,
							(side/2)*sca, 0.0, -1.0*sca, 1.0,
                            -(side/2)*sca, 0.0, -1.0*sca, 1.0];
		_obj.normalArray = [0.0, 0.0, 1.0, 1.0,
		                    0.0, 0.0, 1.0, 1.0,
		                    0.0, 0.0, 1.0, 1.0];	
		_obj.textureArray = [0.0, 0.0, 0.0, 1.0,
		                     1.0, 0.0, 0.0, 1.0,
		                     1.0, 1.0, 0.0, 1.0];
		_obj.textureUnitArray = [0.0, 0.0, 0.0];
		_obj.indexArray = [0, 1, 2];
		
		return _obj;
	};
	
	/**
	* Load a quad
	* @param {Float} length
	* @param {Float} height
	* @returns {Object}
	*/
	this.loadQuad = function(length, height) {
		var l=(length==undefined)?0.5:length;
		var h=(height==undefined)?0.5:height;
		
		_obj = {};
		_obj.vertexArray = [-l, -h, 0.0, 1.0,// Front face
		                   l, -h, 0.0, 1.0,
		                   l, h, 0.0, 1.0,
		                   -l, h, 0.0, 1.0];	
		_obj.normalArray = [	0.0, 0.0, 1.0, 1.0,// Front face
		                    0.0, 0.0, 1.0, 1.0,
		                    0.0, 0.0, 1.0, 1.0,
		                    0.0, 0.0, 1.0, 1.0];	
		_obj.textureArray = [0.0, 0.0, 0.0, 1.0,// Front face
		                    1.0, 0.0, 0.0, 1.0,
		                    1.0, 1.0, 0.0, 1.0,
		                    0.0, 1.0, 0.0, 1.0];
		_obj.textureUnitArray = [0.0,0.0,0.0,0.0];
		_obj.indexArray = [0, 1, 2,	 	0, 2, 3];// Front face
		
		return _obj;
	};
	
	/**
	* Load a circle
	* @param {Object} jsonIn
	* @param {Int} jsonIn.segments
	* @param {Float} jsonIn.radius
	* @returns {Object}
	*/
	this.loadCircle = function(jsonIn) {
		_obj = {"vertexArray": [],
				"normalArray": [],
				"textureArray": [],
				"textureUnitArray": [],
				"indexArray": []};
		objIndex = [];
		indexMax=0; 
		
		var segments = (jsonIn != undefined && jsonIn.segments != undefined) ? jsonIn.segments : 6;  
		var rad = (jsonIn != undefined && jsonIn.radius != undefined) ? jsonIn.radius : 0.5;
				
		var stepAngle = 360.0/(segments);
		var numSegH = 360.0/stepAngle;
		
		var cos = (function(val) {return Math.cos(new Utils().degToRad(val))}).bind(this);
		var sin = (function(val) {return Math.sin(new Utils().degToRad(val))}).bind(this);
		
		
		for(var h=1, fh = numSegH; h <= fh; h++) { 
			var currAngleH = stepAngle*h;
			// PRIMER TRIÁNGULO
			// vertices
			var vA1 = $V3([	cos(currAngleH) *rad, 
							0.0,
							sin(currAngleH) *rad]);
			var vB1 = $V3([	cos(currAngleH-stepAngle) *rad,
							0.0,
							sin(currAngleH-stepAngle) *rad]);
			var vC1 = $V3([	0.0, 0.0, 0.0]);
			// normales
			var norm = vB1.subtract(vA1).cross(vC1.subtract(vA1)).normalize();
			// texturas
			var tA1 = $V3([currAngleH/360.0, 0.0, 0.0]);
			var tB1 = $V3([(currAngleH-stepAngle)/360.0, 0.0, 0.0]);
			var tC1 = $V3([0.0, 0.0, 0.0]);
			//indices
			var indexA = testIfInIndices(_obj, vA1, norm, tA1);
			var indexB = testIfInIndices(_obj, vB1, norm, tB1);
			var indexC = testIfInIndices(_obj, vC1, norm, tC1);
			
			_obj.indexArray.push(indexA,indexB,indexC);
		}	
		
		return _obj;
	};
	
	var testIfInIndices = function(_obj, vA1, norm, tA1) {
		var indexA = undefined;
		for(var nB = 0, fb = objIndex.length; nB < fb; nB++) {
			if(objIndex[nB].v.e[0] == vA1.e[0] && objIndex[nB].v.e[1] == vA1.e[1] && objIndex[nB].v.e[2] == vA1.e[2]) {
				indexA = objIndex[nB].i;
			}
		}
		if(indexA == undefined) {
			indexA = indexMax; 
			objIndex.push({i:indexA,v:$V3([vA1.e[0],vA1.e[1],vA1.e[2]])});
			indexMax++;
			_obj.vertexArray.push(vA1.e[0],vA1.e[1],vA1.e[2], 1.0);
			_obj.normalArray.push(norm.e[0],norm.e[1],norm.e[2], 1.0);
			_obj.textureArray.push((vA1.e[0]+0.5),(vA1.e[2]+0.5),vA1.e[2]+0.5, 1.0);
			_obj.textureUnitArray.push(0.0);
		}
		return indexA;
	};
	
	/**
	* Load a box
	* @returns {Object}
	*/
	this.loadBox = function() {
		_obj = {};
		
		var d = new Float32Array([0.5,0.5,0.5]);
		_obj.vertexArray = [-1.0*d[0], -1.0*d[1],  1.0*d[2], 1.0,// Front face
		                     1.0*d[0], -1.0*d[1],  1.0*d[2], 1.0,
		                     1.0*d[0],  1.0*d[1],  1.0*d[2], 1.0,
		                    -1.0*d[0],  1.0*d[1],  1.0*d[2], 1.0,
		                    // Back face
		                    -1.0*d[0], -1.0*d[1], -1.0*d[2], 1.0,
		                    -1.0*d[0],  1.0*d[1], -1.0*d[2], 1.0,
		                     1.0*d[0],  1.0*d[1], -1.0*d[2], 1.0,
		                     1.0*d[0], -1.0*d[1], -1.0*d[2], 1.0,
		                    // Top face
		                    -1.0*d[0],  1.0*d[1], -1.0*d[2], 1.0,
		                    -1.0*d[0],  1.0*d[1],  1.0*d[2], 1.0,
		                     1.0*d[0],  1.0*d[1],  1.0*d[2], 1.0,
		                     1.0*d[0],  1.0*d[1], -1.0*d[2], 1.0,
		                    // Bottom face
		                    -1.0*d[0], -1.0*d[1], -1.0*d[2], 1.0,
		                     1.0*d[0], -1.0*d[1], -1.0*d[2], 1.0,
		                     1.0*d[0], -1.0*d[1],  1.0*d[2], 1.0,
		                    -1.0*d[0], -1.0*d[1],  1.0*d[2], 1.0,
		                    // Right face
		                     1.0*d[0], -1.0*d[1], -1.0*d[2], 1.0,
		                     1.0*d[0],  1.0*d[1], -1.0*d[2], 1.0,
		                     1.0*d[0],  1.0*d[1],  1.0*d[2], 1.0,
		                     1.0*d[0], -1.0*d[1],  1.0*d[2], 1.0,
		                    // Left face
		                    -1.0*d[0], -1.0*d[1], -1.0*d[2], 1.0,
		                    -1.0*d[0], -1.0*d[1],  1.0*d[2], 1.0,
		                    -1.0*d[0],  1.0*d[1],  1.0*d[2], 1.0,
		                    -1.0*d[0],  1.0*d[1], -1.0*d[2], 1.0];	
		_obj.normalArray = [0.0,  0.0,  1.0, 1.0,// Front face
		                    0.0,  0.0,  1.0, 1.0,
		                    0.0,  0.0,  1.0, 1.0,
		                    0.0,  0.0,  1.0, 1.0,
		                   // Back face
		                    0.0,  0.0, -1.0, 1.0,
		                    0.0,  0.0, -1.0, 1.0,
		                    0.0,  0.0, -1.0, 1.0,
		                    0.0,  0.0, -1.0, 1.0,
		                   // Top face
		                    0.0,  1.0,  0.0, 1.0,
		                    0.0,  1.0,  0.0, 1.0,
		                    0.0,  1.0,  0.0, 1.0,
		                    0.0,  1.0,  0.0, 1.0,
		                   // Bottom face
		                    0.0, -1.0,  0.0, 1.0,
		                    0.0, -1.0,  0.0, 1.0,
		                    0.0, -1.0,  0.0, 1.0,
		                    0.0, -1.0,  0.0, 1.0,
		                   // Right face
		                    1.0,  0.0,  0.0, 1.0,
		                    1.0,  0.0,  0.0, 1.0,
		                    1.0,  0.0,  0.0, 1.0,
		                    1.0,  0.0,  0.0, 1.0,
		                   // Left face
		                   -1.0,  0.0,  0.0, 1.0,
		                   -1.0,  0.0,  0.0, 1.0,
		                   -1.0,  0.0,  0.0, 1.0,
		                   -1.0,  0.0,  0.0, 1.0];	
		_obj.textureArray = [0.0, 0.0, 0.0, 1.0,// Front face
		                     1.0, 0.0, 0.0, 1.0,
		                     1.0, 1.0, 0.0, 1.0,
		                     0.0, 1.0, 0.0, 1.0,
		                     // Back face
		                     1.0, 0.0, 0.0, 1.0,
		                     1.0, 1.0, 0.0, 1.0,
		                     0.0, 1.0, 0.0, 1.0,
		                     0.0, 0.0, 0.0, 1.0,
		                     // Top face
		                     0.0, 1.0, 0.0, 1.0,
		                     0.0, 0.0, 0.0, 1.0,
		                     1.0, 0.0, 0.0, 1.0,
		                     1.0, 1.0, 0.0, 1.0,
		                     // Bottom face
		                     1.0, 1.0, 0.0, 1.0,
		                     0.0, 1.0, 0.0, 1.0,
		                     0.0, 0.0, 0.0, 1.0,
		                     1.0, 0.0, 0.0, 1.0,
		                     // Right face
		                     1.0, 0.0, 0.0, 1.0,
		                     1.0, 1.0, 0.0, 1.0,
		                     0.0, 1.0, 0.0, 1.0,
		                     0.0, 0.0, 0.0, 1.0,
		                     // Left face
		                     0.0, 0.0, 0.0, 1.0,
		                     1.0, 0.0, 0.0, 1.0,
		                     1.0, 1.0, 0.0, 1.0,
		                     0.0, 1.0, 0.0, 1.0];
		_obj.textureUnitArray = [0.0,0.0,0.0,0.0,// Front face
								 // Back face
								 0.0,0.0,0.0,0.0,
								 // Top face
								 0.0,0.0,0.0,0.0,
								 // Bottom face
								 0.0,0.0,0.0,0.0,
								 // Right face
								 0.0,0.0,0.0,0.0,
								 // Left face
								 0.0,0.0,0.0,0.0];
		_obj.indexArray = [0, 1, 2,      0, 2, 3,    // Front face
		                   4, 5, 6,      4, 6, 7,    // Back face
		                   8, 9, 10,     8, 10, 11,  // Top face
		                   12, 13, 14,   12, 14, 15, // Bottom face
		                   16, 17, 18,   16, 18, 19, // Right face
		                   20, 21, 22,   20, 22, 23];  // Left face
		
		return _obj;
	};
	
	/**
	 * @typedef {Object} Mesh~ImageData
	 * @property {Int} Mesh~ImageData.fileUrl
	 * @property {Int} Mesh~ImageData.materialName
	 */
	/**
	 * This callback is displayed as part of the onSelectNode
	 * @callback Mesh~loadObj~onload
	 * @param {Mesh} mesh
	 * @param {Mesh~ImageData} textures
	 */
	/**
	* Load a object from url of obj file
	* @param {String} objUrl
	* @param {Mesh~loadObj~onload} onload
	*/
	this.loadObj = function(objUrl, onload) {	    
	    var objDirectory = '';
	    var expl = objUrl.split("/");
	    for(var n = 0, f = expl.length-1; n < f; n++) {
	    	objDirectory = objDirectory+expl[n]+'/';
	    }
		
	    
		var req = new XMLHttpRequest();
		req.open("GET", objUrl, true);
		req.responseType = "blob";		
		req.onload = (function(onload) { 
			var filereader = new FileReader();
			filereader.onload = (function(onload, event) {
				var text = event.target.result;
				
				this.loadObjFromSourceText({"sourceText": text, "objDirectory": objDirectory});
												
				if(onload != undefined && typeof(onload) == 'function')
					onload(_obj, _textures);
			}).bind(this, onload);
			filereader.readAsText(req.response);
		}).bind(this, onload);
	    req.send(null);
	};

	/**
	* Load a object from text-plain on obj format
	* @param {Object} jsonIn
	* @param {String} sourceText
	* @param {String} objDirectory
	*/
	this.loadObjFromSourceText = function(jsonIn) {
		_obj = {};
		_textures = {};
		
		var _node,_sourceText,_objDirectory;
		_sourceText = (jsonIn.sourceText != undefined) ? jsonIn.sourceText : undefined;
		_objDirectory = (jsonIn.objDirectory != undefined) ? jsonIn.objDirectory : undefined;
		
		var lines = _sourceText.split("\r\n");
		if(lines.length == 1) lines = _sourceText.split("\n");
		
		if(lines[0].match(/OBJ/gim) == null) {alert('Not OBJ file');	return;}
		
		
		var vertexArrayX = [];var vertexArrayY = [];var vertexArrayZ = [];
		var normalArrayX = [];var normalArrayY = [];var normalArrayZ = [];
		var textureArrayX = [];var textureArrayY = [];var textureArrayZ = [];
		var textureUnitArray = [];
		var currentTextureUnit = 0;
		var indexArray = [];
		var currentIDX = 0;
		var currentIDX_INDEX = 0;
		
		var bufferEnCola = false;
		
		var vertexX = [];var vertexY = [];var vertexZ = [];
		var normalX = [];var normalY = [];var normalZ = [];
		var textureX = [];var textureY = [];var textureZ = [];
		var currentIDX_vertex = 0;var currentIDX_normal = 0;var currentIDX_texture = 0;
		var indexVNT = []; 
		var currentIndex = 0;
		
		
		var groups = {};
		var currentGroup = [-1, 0];
		groups["_unnamed"] = currentGroup;

		var mtlFile = "";
		var currentMtlName = "";
		
		for(var n = 0, f = lines.length; n < f; n++) {
			var line = lines[n].replace(/\t+/gi, " ").replace(/\s+$/gi, "").replace(/\s+/gi, " ");
			if(line[0] == "#") continue;// ignore comments
			
			var array = line.split(" ");
			
			if(array[0] == "mtllib") {
				mtlFile = array[1];
			}
			if(array[0] == "g") {
				currentGroup = [indexArray.length, 0];
				groups[array[1]] = currentGroup;
			}
			if(array[0] == "v") {
				vertexX[currentIDX_vertex] = parseFloat(array[1]); 
				vertexY[currentIDX_vertex] = parseFloat(array[2]);
				vertexZ[currentIDX_vertex] = parseFloat(array[3]);
				currentIDX_vertex++; 
			}
			if(array[0] == "vn") {
				normalX[currentIDX_normal] = parseFloat(array[1]);
				normalY[currentIDX_normal] = parseFloat(array[2]);
				normalZ[currentIDX_normal] = parseFloat(array[3]);
				currentIDX_normal++;
			}
			if(array[0] == "vt") {
				textureX[currentIDX_texture] = parseFloat(array[1]);
				textureY[currentIDX_texture] = parseFloat(array[2]);
				textureZ[currentIDX_texture] = parseFloat(array[3]);
				currentIDX_texture++;
			}
			if(array[0] == "usemtl") {
				currentMtlName = array[1];
				
				_textures[currentTextureUnit] = {"fileUrl": _objDirectory+mtlFile, "materialName": currentMtlName}
				
				currentTextureUnit++;
			}
			if(array[0] == "f") {
				if(array.length != 4)
					console.log("*** Error: face '"+line+"' not handled");

				// recorremos cada vtx/tex/nor de la linea 'f vtxA/texA/norA vtxB/texB/norB vtxC/texC/norC'
				// puede ser tambien de tipo f vtx vtx vtx
				for(var i = 1, fi = 4; i < fi; ++i) { // primero vtxA/texA/norA, luego vtxB/texB/norB y luego vtxC/texC/norC
					bufferEnCola = true;
					var expl = array[i].split("/"); // array[i] = "vtxX/texX/norX"
					if(indexVNT[array[i]] == undefined) {  //si no existe current "vtxX/texX/norX" en array indexVNT se añade nuevo indice				
						var vtx, nor, tex;
						if(expl.length == 1) { // si es de tipo solo vtx
							vtx = parseInt(expl[0]) - 1; // usamos vtx en todos
							nor = vtx;
							tex = vtx;
						} else if(expl.length == 3) { // si es de tipo vtx/tex/nor
							vtx = parseInt(expl[0]) - 1;
							tex = parseInt(expl[1]) - 1;
							nor = parseInt(expl[2]) - 1;
							// se resta 1 por que en el formato obj el primero comienza en 1.
							// en los arrays donde hemos almacenado vertex, normal y texture el primero comienza en 0.
						} else {
							obj.ctx.console.log("*** Error: did not understand face '"+array[i]+"'");
							return null;
						}
						
						textureUnitArray[currentIDX] = (currentTextureUnit-1);
						
						vertexArrayX[currentIDX] = 0.0;
						vertexArrayY[currentIDX] = 0.0;
						vertexArrayZ[currentIDX] = 0.0;
						if(vtx < vertexZ.length) { 
							vertexArrayX[currentIDX] = vertexX[vtx];
							vertexArrayY[currentIDX] = vertexY[vtx];
							vertexArrayZ[currentIDX] = vertexZ[vtx];
						}
						
						textureArrayX[currentIDX] = 0.0;
						textureArrayY[currentIDX] = 0.0;
						textureArrayZ[currentIDX] = 0.0;
						if(tex < textureZ.length) { 
							textureArrayX[currentIDX] = textureX[tex];
							textureArrayY[currentIDX] = textureY[tex];
							textureArrayZ[currentIDX] = textureZ[tex];
						}
						
						normalArrayX[currentIDX] = 0.0;
						normalArrayY[currentIDX] = 0.0;
						normalArrayZ[currentIDX] = 1.0;
						if(nor < normalZ.length) { 
							normalArrayX[currentIDX] = normalX[nor];
							normalArrayY[currentIDX] = normalY[nor];
							normalArrayZ[currentIDX] = normalZ[nor];
						}
						currentIDX++;
						
						indexVNT[array[i]] = currentIndex; // indexVNT[vtxX/texX/norX] = currentIndex; 
						currentIndex++;
					}
					indexArray[currentIDX_INDEX] = indexVNT[array[i]];
					currentIDX_INDEX++;
					
					currentGroup[1]++;
				}
				
			}
		}
		
		if(bufferEnCola == true) {			
			_obj.vertexArray = new Float32Array(vertexArrayX.length*4);
			for(var n = 0, fn = vertexArrayX.length; n < fn; n++) {
				var idx = n*4;
				_obj.vertexArray[idx] = vertexArrayX[n];
				_obj.vertexArray[idx+1] = vertexArrayY[n];
				_obj.vertexArray[idx+2] = vertexArrayZ[n];
				_obj.vertexArray[idx+3] = 1.0;
			}
			_obj.normalArray = new Float32Array(normalArrayX.length*4);
			for(var n = 0, fn = normalArrayX.length; n < fn; n++) {
				var idx = n*4;
				_obj.normalArray[idx] = normalArrayX[n];
				_obj.normalArray[idx+1] = normalArrayY[n];
				_obj.normalArray[idx+2] = normalArrayZ[n];
				_obj.normalArray[idx+3] = 1.0;
			}
			_obj.textureArray = new Float32Array(textureArrayX.length*4);
			for(var n = 0, fn = textureArrayX.length; n < fn; n++) {
				var idx = n*4;
				_obj.textureArray[idx] = textureArrayX[n];
				_obj.textureArray[idx+1] = textureArrayY[n];
				_obj.textureArray[idx+2] = textureArrayZ[n];
				_obj.textureArray[idx+3] = 1.0;
			}
			_obj.textureUnitArray = textureUnitArray;
			_obj.indexArray = indexArray;
			
			// RESET
			/*var bufferEnCola = false;
			
			vertexArrayX = [];vertexArrayY = [];vertexArrayZ = [];
			normalArrayX = [];normalArrayY = [];normalArrayZ = [];
			textureArrayX = [];textureArrayY = [];textureArrayZ = [];
			textureUnitArray = [];
			//currentTextureUnit = 0;  
			indexArray = [];
			currentIDX = 0;
			currentIDX_INDEX = 0;
			 
			//vertexX = [];vertexY = [];vertexZ = [];
			//normalX = [];normalY = [];normalZ = [];
			//textureX = [];textureY = [];textureZ = [];
			//currentIDX_vertex = 0;currentIDX_normal = 0;currentIDX_texture = 0;    
			indexVNT = [];
			currentIndex = 0;*/
		}     
	};
};