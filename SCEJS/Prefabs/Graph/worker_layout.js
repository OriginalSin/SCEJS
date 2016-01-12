self.addEventListener('message', function(e) {
	"use strict";
	
    self.importScripts("../../StormMath.class.js");
	
	var arr4Uint8_XYZW_0 = new Float32Array(e.data.arr4Uint8_XYZW_0);
	var arr4Uint8_XYZW_1 = new Float32Array(e.data.arr4Uint8_XYZW_1);
	var arr4Uint8_XYZW_2 = new Float32Array(e.data.arr4Uint8_XYZW_2);
	var arr4Uint8_XYZW_3 = new Float32Array(e.data.arr4Uint8_XYZW_3);
	var arrayNodeData = new Float32Array(e.data.arrayNodeData);
	var _nodesById = JSON.parse(e.data._nodesById);
	var _links = JSON.parse(e.data._links);
	var _from = e.data.from;
	var _to = e.data.to;
	var nn = 0;
	
	var count = _to-_from;
	
	
	//var arr4Uint8_dir = comp_renderer_nodes.getWebCLGL().enqueueReadBuffer_Float4(comp_renderer_nodes.getTempBuffers()["dir"]);

	var arrayNodeDir_bv = new ArrayBuffer(count*Float32Array.BYTES_PER_ELEMENT);
	var arrayNodeDir = new Float32Array(arrayNodeDir_bv);
	for(var n=0; n < (arrayNodeData.length/4); n++) {
		var id = n*4;
		if(id >= _from && id < _to) {
			var idDir = nn*4;
			var nodeIdA = arrayNodeData[id];
			
				
			var x = arr4Uint8_XYZW_0[_nodesById[nodeIdA].itemStart];
			var y = arr4Uint8_XYZW_1[_nodesById[nodeIdA].itemStart];
			var z = arr4Uint8_XYZW_2[_nodesById[nodeIdA].itemStart];
			var w = arr4Uint8_XYZW_3[_nodesById[nodeIdA].itemStart];
			var posA = new StormV3([x, y, z]);
				
			
			var d_a = new StormV3([0.0, 0.0, 0.0]);
			var d_r = new StormV3([0.0, 0.0, 0.0]);
			for(var nb=0; nb < (arrayNodeData.length/4); nb++) {
				var idb = nb*4;
				var nodeIdB = arrayNodeData[idb];
				
				var x = arr4Uint8_XYZW_0[_nodesById[nodeIdB].itemStart];
				var y = arr4Uint8_XYZW_1[_nodesById[nodeIdB].itemStart];
				var z = arr4Uint8_XYZW_2[_nodesById[nodeIdB].itemStart];
				var w = arr4Uint8_XYZW_3[_nodesById[nodeIdB].itemStart];
				var posB = new StormV3([x, y, z]);
				
				
				
				var dir = (posA.e[0] == posB.e[0] && posA.e[1] == posB.e[1] && posA.e[2] == posB.e[2]) ? $V3([0.0, 0.0, 0.0]) : posB.subtract(posA).normalize();
				var distanceN = posB.subtract(posA).x(0.001).modulus(); // near=0.0 ; far=1.0
				var targetsB = 1.0/(1.0+(arrayNodeData[idb+3])); // 1targets=1.0 ; 10targets=0.1
				
				if(_links.hasOwnProperty(_nodesById[nodeIdA].nodeName+"->"+_nodesById[nodeIdB].nodeName) == true) {
					var dirAtraction = dir.x(1.0-targetsB);
					dirAtraction = dirAtraction.x(distanceN);
					d_a = d_a.add(dirAtraction);
										
					var dirRepulsion = dir.x(-1.0);
					dirRepulsion = dirRepulsion.x(targetsB);
					dirRepulsion = dirRepulsion.x(distanceN);					
					d_r = d_r.add(dirRepulsion);
				} else if(_links.hasOwnProperty(_nodesById[nodeIdB].nodeName+"->"+_nodesById[nodeIdA].nodeName) == true) {
					var dirAtraction = dir.x(1.0-targetsB);
					dirAtraction = dirAtraction.x(distanceN);
					d_a = d_a.add(dirAtraction);
										
					var dirRepulsion = dir.x(-1.0);
					dirRepulsion = dirRepulsion.x(targetsB);
					dirRepulsion = dirRepulsion.x(distanceN);					
					d_r = d_r.add(dirRepulsion);
				} else {
					var dirRepulsion = dir.x(-1.0);
					dirRepulsion = dirRepulsion.x(1.0-targetsB);
					dirRepulsion = dirRepulsion.x(1.0-distanceN);					
					d_r = d_r.add(dirRepulsion);
				}													
			}			
			d_a = $V3([d_a.e[0]/(arrayNodeData[id+3]), d_a.e[1]/(arrayNodeData[id+3]), d_a.e[2]/(arrayNodeData[id+3])]).x(10);
			d_r = $V3([d_r.e[0]/(arrayNodeData.length/4), d_r.e[1]/(arrayNodeData.length/4), d_r.e[2]/(arrayNodeData.length/4)]).x(0.5);
			
			
			var fd = d_r.add(d_a);
			arrayNodeDir[idDir] = fd.e[0];
			arrayNodeDir[idDir+1] = fd.e[1];
			arrayNodeDir[idDir+2] = fd.e[2];
			arrayNodeDir[idDir+3] = 1.0;
			
			nn++;
		}
	}


	self.postMessage({	'arrayNodeDir': arrayNodeDir_bv,
						'from': _from}, [arrayNodeDir_bv]);
	
}, false);