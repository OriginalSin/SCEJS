/**
* @class
* @constructor
*/
UIComponentGPU = function(compTypeKey, selectedNode) {
    "use strict";

    var ah = new ActionHelpers();

    var comp = selectedNode.getComponent(Constants.COMPONENT_TYPES.GPU);

    var args = comp.getAllArgs();


    var str = ""+
        "<div id='DIVID_"+compTypeKey+"' class='component_section'>"+
            "<div id='DIVID_"+compTypeKey+"_args' style='width:300px;display:inline-block;float:left;'></div>"+
            "<div id='DIVID_"+compTypeKey+"_kernelsvfps' style='display:inline-block;overflow-x:auto;'></div>"+
        "</div>";
    ah.appendStringChild(str, document.getElementById('DIVID_component_'+compTypeKey));



    // INDICES
    new UIComponent_Indices(document.getElementById('DIVID_'+compTypeKey), selectedNode, comp, args);

    // ARGS
    new UIComponent_Argument(document.getElementById('DIVID_'+compTypeKey+'_args'), selectedNode, comp, args);

    //KERNELS
    new UIComponent_Kernel(document.getElementById('DIVID_'+compTypeKey+'_kernelsvfps'), selectedNode, comp, args);

    // VFPS
    new UIComponent_Vfp(document.getElementById('DIVID_'+compTypeKey+'_kernelsvfps'), selectedNode, comp, args);
};
