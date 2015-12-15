/**
* @class
* @constructor
*/
Mesh = function() {
	"use strict";
	
	var obj = {};
	var objIndex; // for store new indexes
	var indexMax=0; 
	
	/**
	* Load a point
	*/
	this.loadPoint = function() {
		obj.vertexArray = [0.0, 0.0, 0.0, 0.0];
		obj.normalArray = [0.0, 1.0, 0.0, 0.0];	
		obj.textureArray = [0.0, 0.0, 0.0, 0.0];
		obj.textureUnitArray = [0.0];
		obj.indexArray = [0];
		
		return obj;
	};
	
	/**
	* Load a triangle
	*/
	this.loadTriangle = function() {
		obj.vertexArray = [0.0, 1.0, 0.0, 1.0,
							1.0, 0.0, 0.0, 1.0,
							0.0, 0.0, 0.0, 1.0];	
		obj.normalArray = [0.0, 0.0, 1.0, 1.0,
		                    0.0, 0.0, 1.0, 1.0,
		                    0.0, 0.0, 1.0, 1.0];	
		obj.textureArray = [0.0, 0.0, 0.0, 1.0,
		                     1.0, 0.0, 0.0, 1.0,
		                     1.0, 1.0, 0.0, 1.0];
		obj.textureUnitArray = [0.0, 0.0, 0.0];
		obj.indexArray = [0, 1, 2];
		
		return obj;
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
		
		var obj = {};
		obj.vertexArray = [-l, -h, 0.0, 1.0,// Front face
		                   l, -h, 0.0, 1.0,
		                   l, h, 0.0, 1.0,
		                   -l, h, 0.0, 1.0];	
		obj.normalArray = [	0.0, 0.0, 1.0, 1.0,// Front face
		                    0.0, 0.0, 1.0, 1.0,
		                    0.0, 0.0, 1.0, 1.0,
		                    0.0, 0.0, 1.0, 1.0];	
		obj.textureArray = [0.0, 0.0, 0.0, 1.0,// Front face
		                    1.0, 0.0, 0.0, 1.0,
		                    1.0, 1.0, 0.0, 1.0,
		                    0.0, 1.0, 0.0, 1.0];
		obj.textureUnitArray = [0.0,0.0,0.0,0.0];
		obj.indexArray = [0, 1, 2,	 	0, 2, 3];// Front face
		
		return obj;
	};
	
	/**
	* Load a circle
	* @param {Object} jsonIn
	* @param {Int} jsonIn.segments
	* @param {Float} jsonIn.radius
	* @returns {Object}
	*/
	this.loadCircle = function(jsonIn) {
		obj = {"vertexArray": [],
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
			var indexA = testIfInIndices(obj, vA1, norm, tA1);
			var indexB = testIfInIndices(obj, vB1, norm, tB1);
			var indexC = testIfInIndices(obj, vC1, norm, tC1);
			
			obj.indexArray.push(indexA,indexB,indexC);
		}	
		
		return obj;
	};
	
	var testIfInIndices = function(obj, vA1, norm, tA1) {
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
			obj.vertexArray.push(vA1.e[0],vA1.e[1],vA1.e[2], 1.0);
			obj.normalArray.push(norm.e[0],norm.e[1],norm.e[2], 1.0);
			obj.textureArray.push((vA1.e[0]+0.5),(vA1.e[2]+0.5),vA1.e[2]+0.5, 1.0);
			obj.textureUnitArray.push(0.0);
		}
		return indexA;
	};
	
	/**
	* Load a box
	* @returns {Object}
	*/
	this.loadBox = function() {
		var obj = {};
		
		var d = new Float32Array([0.5,0.5,0.5]);
		obj.vertexArray = [-1.0*d[0], -1.0*d[1],  1.0*d[2], 1.0,// Front face
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
		obj.normalArray = [0.0,  0.0,  1.0, 1.0,// Front face
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
		obj.textureArray = [0.0, 0.0, 0.0, 1.0,// Front face
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
		obj.textureUnitArray = [0.0,0.0,0.0,0.0,// Front face
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
		obj.indexArray = [0, 1, 2,      0, 2, 3,    // Front face
		                   4, 5, 6,      4, 6, 7,    // Back face
		                   8, 9, 10,     8, 10, 11,  // Top face
		                   12, 13, 14,   12, 14, 15, // Bottom face
		                   16, 17, 18,   16, 18, 19, // Right face
		                   20, 21, 22,   20, 22, 23];  // Left face
		
		return obj;
	};
};