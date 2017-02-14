/**
 * @class
 * @constructor
 */
Component_GPU = function() {
    "use strict";

    this.gpufG = null;
    this.args = {};


    /**
     * setGPUFor
     */
    this.setGPUFor = function() {
        for(var key in arguments[1]) {
            var expl = key.split(" ");
            if(expl != null && expl.length > 1) {
                var argName = expl[1];
                this.args[argName] = {
                	"fnvalue": arguments[1][key],
                    "updatable": null,
                    "splits": null,
                    "overrideDimensions": null};
            }
            arguments[1][key] = arguments[1][key]();
        }

        var F = (function(args) {
            return gpufor.apply(this, args);
        }).bind(this, arguments);
        this.gpufG = new F();
    };


    /**
     * getWebCLGL
     * @returns {WebCLGL}
     */
    this.getWebCLGL = function() {
        return this.gpufG.getWebCLGL();
    };


    // █████╗ ██████╗  ██████╗ ██╗   ██╗███╗   ███╗███████╗███╗   ██╗████████╗███████╗
    //██╔══██╗██╔══██╗██╔════╝ ██║   ██║████╗ ████║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
    //███████║██████╔╝██║  ███╗██║   ██║██╔████╔██║█████╗  ██╔██╗ ██║   ██║   ███████╗
    //██╔══██║██╔══██╗██║   ██║██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
    //██║  ██║██║  ██║╚██████╔╝╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   ███████║
    //╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝

    /**
     *
     */
    this.addArgument = function(arg, value) {
        this.args[arg.split(" ")[1]] = {
            "fnvalue": value,
            "updatable": null,
            "splits": null,
            "overrideDimensions": null};

        this.gpufG.addArgument(arg, value());
    };

    /**
     * @param {String} argument Argument to set
     * @param {Function} fnvalue
     * @param {Array<Float>} [splits=[array.length]]
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @returns {WebCLGLBuffer}
     */
    this.setArg = function(argument, fnvalue, splits, overrideDimensions) {
        var buff = this.gpufG.setArg(argument, fnvalue(), splits, overrideDimensions);
        this.args[argument] = {	"fnvalue": fnvalue,
            "updatable": null,
            "splits": splits,
            "overrideDimensions": overrideDimensions};

        return buff;
    };

    /**
     * getComponentBufferArg
     * @param {String} argument Argument to set
     * @param {ComponentRenderer} comp_renderer
     */
    this.getComponentBufferArg = function(argument, comp_renderer) {
        this.gpufG.getGPUForPointerArg(argument, comp_renderer.gpufG);
        this.args[argument] = {	"fnvalue": null,
            "updatable": null,
            "splits": null,
            "overrideDimensions": null};
    };

    /**
     * getArgs
     * @returns {Object}
     */
    this.getArgs = function() {
        return this.args;
    };

    /**
     * getAllArgs
     * @returns {Object}
     */
    this.getAllArgs = function() {
        return this.gpufG.getAllArgs();
    };

    /**
     * getBuffers
     * @returns {Array<WebCLGLBuffer>}
     */
    this.getBuffers = function() {
        return this.gpufG.buffers;
    };

    /**
     * @param {String} argument Argument to set
     * @param {Bool} value
     */
    this.setArgUpdatable = function(argument, value) {
        this.args[argument].updatable = value;
    };

    /**
     * tickArguments
     * @private
     */
    this.tickArguments = function() {
        for(var key in this.args) {
            if(this.args[key].updatable == true) {
                var arg = this.args[key];
                this.gpufG.setArg(key, arg.fnvalue(), arg.splits, arg.overrideDimensions);
            }
        }
    };

};