/**
* @class
* @constructor
*/
ArrayGenerator = function() {
	"use strict";
	
	/**
	* @param {Object} jsonIn
	* @param {Int} jsonIn.count - count
	* @param {Float} jsonIn.offset - Offset
	* @param {String} jsonIn.type - "float" | "float4"
	* @param {Float} [jsonIn.spacing=0.01] - Spacing
	* @return {Array<Float>}
	*/
	this.randomArray = function(jsonIn) {
		var arr = [];
		for(var n=0; n < jsonIn.count; n++) {
			if(jsonIn.type == "float") arr.push(-(jsonIn.offset/2)+(Math.random()*jsonIn.offset));
			else arr.push(-(jsonIn.offset/2)+(Math.random()*jsonIn.offset), -(jsonIn.offset/2)+(Math.random()*jsonIn.offset), -(jsonIn.offset/2)+(Math.random()*jsonIn.offset), -(jsonIn.offset/2)+(Math.random()*jsonIn.offset));
		}
		
		return arr;
	};			
	/**
	* @param {Object} jsonIn
	* @param {Int} jsonIn.count - count
	* @param {Float} jsonIn.width - width
	* @param {Float} jsonIn.height - height
	* @param {Float} [jsonIn.spacing=0.01] - Spacing
	* @return {Array<Float>}
	*/
	this.widthHeightArray = function(jsonIn) {			
		var arr = [];
		
		var totalDestinations = jsonIn.width*jsonIn.height;
		var nodesPerCell = jsonIn.count/totalDestinations;
		var nodesInCell = 0;
		var x = 0;
		var z = 0;
		var spacing = (jsonIn.spacing != undefined) ? jsonIn.spacing : 0.01;
		for(var n=0; n < jsonIn.count; n++) {
			if(nodesInCell >= nodesPerCell) {				
				x++;
				if(x > jsonIn.width-1) {
					x = 0;
					z++;
				}
				nodesInCell -= nodesPerCell;
			}
			nodesInCell += 1;
			
			arr.push(x*spacing, 0, z*spacing, 1.0);
		}
		
		return arr;
	};
	/**
	* @param {Object} jsonIn
	* @param {Int} jsonIn.count - count
	* @param {Array<Float4>} jsonIn.float4 - direction
	* @return {Array<Float>}
	*/
	this.float4Array = function(jsonIn) {
		var arr = [];
		for(var n=0; n < jsonIn.count; n++) {
			arr.push(jsonIn.float4[0], jsonIn.float4[1], jsonIn.float4[2], jsonIn.float4[3]);
		}
		
		return arr;
	};
	/**
	* @param {Object} jsonIn
	* @param {Int} jsonIn.count - count
	* @param {Float} jsonIn.radius - radius
	* @return {Array<Float>}
	*/
	this.sphericalArray = function(jsonIn) {
		var arr = [];
		for(var n=0; n < jsonIn.count; n++) {
			var rad = (jsonIn == undefined) ? 1.0 : jsonIn.radius;
			var currAngleH = Math.random()*360.0;
			var currAngleV = Math.random()*180.0;
			arr.push(	Math.cos(currAngleH) * Math.abs(Math.sin(currAngleV)) * rad,  
						Math.cos(currAngleV) * rad * Math.random(),
						Math.sin(currAngleH) * Math.abs(Math.sin(currAngleV)) * rad,
						1.0);
		}
		
		return arr;
	};
	/**
	* @param {Object} jsonIn
	* @param {Int} jsonIn.count - count
	* @param {Float} jsonIn.image - image
	* @return {Array<Float>}
	*/
	this.imageArray = function(jsonIn) {
		var imgarr = new Utils().getUint8ArrayFromHTMLImageElement(jsonIn.image);
		var arr = [];
		for(var n=0; n < jsonIn.count; n++) {
			var id = n*4;
			arr.push(	parseFloat(imgarr[id]/255),  
						parseFloat(imgarr[id+1]/255),
						parseFloat(imgarr[id+2]/255),
						parseFloat(imgarr[id+3]/255));
		}
		
		return arr;
	};
	/**
	* @param {StormVoxelizator} voxelizator
	*/
	this.volumeArray = function(voxelizator) {			
		this.arrayNodeDestination = [];	
		this.arrayNodeVertexColor = [];
		
		this.vo = voxelizator;
		if(this.vo instanceof StormVoxelizator == false) { alert("You must select a voxelizator object with albedo fillmode enabled."); return false;}
		if(this.vo.image3D_VoxelsColor == undefined) { alert("You must select a voxelizator object with albedo fillmode enabled."); return false;}
		this.data = this.vo.clglBuff_VoxelsColor.items[0].inData;
		
		var numActCells = 0;
		for(var n = 0, f = this.data.length/4; n < f; n++) { // num of active cells
			var id = n*4;
			//if(data[id] > 30 && data[id+1] > 30 && data[id+2] > 30)
			if(this.data[id+3] > 0) {
				numActCells++;
			}
		}
		var totalNodes = this.currentNodeId-1;
		var nodesPerCell = totalNodes/numActCells;
		
		this.incremNodesCell = 0;	
		var currentNodeId = -1;
		
		this.currentVoxelCell;
		this.CCX=0,this.CCY=0,this.CCZ=0;
		this.CCXMAX=this.vo.resolution-1, this.CCYMAX=this.vo.resolution-1, this.CCZMAX=this.vo.resolution-1;
		var separation = 1.0;
		var p;
		var c;
		var make = false;
		
		var next = (function() {
			while(true) {
				if(this.CCX == this.CCXMAX && this.CCZ == this.CCZMAX && this.CCY == this.CCYMAX) {
					break;
				} else {
					if(this.CCX == this.CCXMAX && this.CCZ == this.CCZMAX) {
						this.CCX=0;this.CCZ=0;this.CCY++;
					} else {
						if(this.CCX == this.CCXMAX) {
							this.CCX=0;this.CCZ++;
						} else {
							this.CCX++;
						}
					}
				}
				
				this.currentVoxelCell = (this.CCY*(this.vo.resolution*this.vo.resolution)) + (this.CCZ*(this.vo.resolution)) + this.CCX;
				
				if(this.data[(this.currentVoxelCell*4)+3] > 0) {
					this.incremNodesCell += nodesPerCell;
					if(this.incremNodesCell >= 1.0) {
						this.incremNodesCell -= 1.0;
						break;
					}
				}
			}
		}).bind(this);
		
		for(var n=0; n < this.arrayNodeId.length; n++) {
			if(currentNodeId != this.arrayNodeId[n]) {
				currentNodeId = this.arrayNodeId[n];
									
				if(this.incremNodesCell >= 1.0) {
					this.incremNodesCell -= 1.0;
				} else {
					next();
				}
				
				// position
				p = $V3([0.0,0.0,0.0]).add($V3([-(this.vo.size/2.0), -(this.vo.size/2.0), -(this.vo.size/2.0)]));  
				p = p.add($V3([ this.vo.cs*this.CCX*separation, this.vo.cs*this.CCY*separation, this.vo.cs*(this.CCZMAX-this.CCZ)*separation ])); 
				p = p.add($V3([ this.vo.cs*Math.random(), this.vo.cs*Math.random(), this.vo.cs*Math.random() ]));
				
				// color
				c = $V3([ this.data[(this.currentVoxelCell*4)]/255, this.data[(this.currentVoxelCell*4)+1]/255, this.data[(this.currentVoxelCell*4)+2]/255 ]);
				
				this.arrayNodeDestination.push(p.e[0], p.e[1], p.e[2], 1.0);	
				this.arrayNodeVertexColor.push(c.e[0], c.e[1], c.e[2], 1.0);
			} else {
				this.arrayNodeDestination.push(p.e[0], p.e[1], p.e[2], 1.0);
				this.arrayNodeVertexColor.push(c.e[0], c.e[1], c.e[2], 1.0);
			}
		}
		comp_renderer_nodes.setArg("dest", (function() {return this.arrayNodeDestination;}).bind(this), this.splitNodes);
		comp_renderer_nodes.setArg("nodeVertexCol", (function() {return this.arrayNodeVertexColor;}).bind(this), this.splitNodes);

	};
};