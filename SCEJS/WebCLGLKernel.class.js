/**
* WebCLGLKernel Object
* @class
 * @param {WebGLRenderingContext} gl
 * @param {String} source
 * @param {String} header
*/
var WebCLGLKernel = function(gl, source, header) {
    "use strict";

    this._gl = gl;
    var highPrecisionSupport = this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);
    this._precision = (highPrecisionSupport.precision != 0) ? 'precision highp float;\n\nprecision highp int;\n\n' : 'precision lowp float;\n\nprecision lowp int;\n\n';

    var _glDrawBuff_ext = this._gl.getExtension("WEBGL_draw_buffers");
    this._maxDrawBuffers = null;
    if(_glDrawBuff_ext != null)
        this._maxDrawBuffers = this._gl.getParameter(_glDrawBuff_ext.MAX_DRAW_BUFFERS_WEBGL);

    this._utils = new WebCLGLUtils();

    this.name = "";
    this.viewSource = false;

    this.in_values = {};

    this.output = null; //String or Array<String> of arg names with the items in same order that in the final return
    this.outputTempModes = null;
    this.fBuffer = null;
    this.fBufferTemp = null;
    this.fBufferLength = 0;
    this.fBufferCount = 0;

    if(source != undefined)
        this.setKernelSource(source, header);


    /**
     * Update the kernel source
     * @param {String} source
     * @param {String} [header=undefined] Additional functions
     */
    this.setKernelSource = function(source, header) {
        var compile = (function() {
            var sourceVertex = 	""+
                this._precision+
                'attribute vec3 aVertexPosition;\n'+
                'varying vec2 global_id;\n'+

                'void main(void) {\n'+
                    'gl_Position = vec4(aVertexPosition, 1.0);\n'+
                    'global_id = aVertexPosition.xy*0.5+0.5;\n'+
                '}\n';
            var sourceFragment = '#extension GL_EXT_draw_buffers : require\n'+
                this._precision+

                this._utils.lines_fragment_attrs(this.in_values)+

                'varying vec2 global_id;\n'+
                'uniform float uBufferWidth;'+

                'vec2 get_global_id() {\n'+
                    'return global_id;\n'+
                '}\n'+

                this._utils.get_global_id3_GLSLFunctionString()+
                this._utils.get_global_id2_GLSLFunctionString()+

                this._head+

                //_utils.lines_drawBuffersWriteInit(8)+
                'void main(void) {\n'+
                    this._utils.lines_drawBuffersInit(8)+

                    this._source+

                    this._utils.lines_drawBuffersWrite(8)+
                '}\n';

            this.kernel = this._gl.createProgram();
            var result = new WebCLGLUtils().createShader(this._gl, "WEBCLGL", sourceVertex, sourceFragment, this.kernel);

            this.attr_VertexPos = this._gl.getAttribLocation(this.kernel, "aVertexPosition");

            this.uBufferWidth = this._gl.getUniformLocation(this.kernel, "uBufferWidth");

            for(var key in this.in_values) {
                var expectedMode = {'float4_fromSampler': "SAMPLER",
                                    'float_fromSampler': "SAMPLER",
                                    'float': "UNIFORM",
                                    'float4': "UNIFORM",
                                    'mat4': "UNIFORM"}[this.in_values[key].type];

                this._utils.checkArgNameInitialization(this.in_values, key);
                this.in_values[key].location = [this._gl.getUniformLocation(this.kernel, key)];
                this.in_values[key].expectedMode = expectedMode;
            }

            return "VERTEX PROGRAM\n"+sourceVertex+"\n FRAGMENT PROGRAM\n"+sourceFragment;
        }).bind(this);


        var argumentsSource = source.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"

        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*/gm) != null) {
                var argName = argumentsSource[n].split('*')[1].trim();
                this._utils.checkArgNameInitialization(this.in_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] != "") {
                var argName = argumentsSource[n].split(' ')[1].trim();
                this._utils.checkArgNameInitialization(this.in_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_values[argName].type = 'mat4';
            }
        }

        // parse header
        this._head =(header!=undefined)?header:'';
        this._head = this._head.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        this._head = this._utils.parseSource(this._head, this.in_values);

        // parse source
        this._source = source.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        this._source = this._source.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        this._source = this._utils.parseSource(this._source, this.in_values);

        var ts = compile();

        if(this.viewSource == true)
            console.log('%c KERNEL: '+this.name, 'font-size: 20px; color: blue'),
            console.log('%c WEBCLGL --------------------------------', 'color: gray'),
            console.log('%c '+header+source, 'color: gray'),
            console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray'),
            console.log('%c '+ts, 'color: darkgray');
    };

};