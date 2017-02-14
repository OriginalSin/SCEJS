/**
* WebCLGLKernel Object
* @class
* @constructor
*/
WebCLGLKernel = function(gl, source, header) {
    "use strict";

	var _gl = gl;
	//var highPrecisionSupport = _gl.getShaderPrecisionFormat(_gl.FRAGMENT_SHADER, _gl.HIGH_FLOAT);
	var _precision = '#version 300 es\nprecision highp float;\n\nprecision highp int;\n\n';

    //var _glDrawBuff_ext = _gl.getExtension("WEBGL_draw_buffers");
    var _maxDrawBuffers = 8;
    //if(_glDrawBuff_ext != null)
    //    _maxDrawBuffers = _gl.getParameter(_glDrawBuff_ext.MAX_DRAW_BUFFERS_WEBGL);

    var _utils = new WebCLGLUtils();

    var _showSource = true;

	this.in_values = {};

    this.output = null; //String or Array<String> of arg names with the items in same order that in the final return
    this.outputTempModes = null;
    this.fBuffer = null;
    this.fBufferTemp = null;
    this.fBufferLength = 0;
    this.fBufferCount = 0;


    /**
     * Update the kernel source
     * @type Void
     * @param {String} source
     * @param {String} [header=undefined] Additional functions
     */
    this.setKernelSource = function(source, header) {
        var compile = (function() {
            var sourceVertex = 	""+
                _precision+
                'in vec3 aVertexPosition;\n'+
                'in vec2 aTextureCoord;\n'+
                'out vec2 global_id;\n'+

                'void main(void) {\n'+
                    'gl_Position = vec4(aVertexPosition, 1.0);\n'+
                    'global_id = aTextureCoord;\n'+
                '}\n';
            var sourceFragment = ''+
                _precision+

                _utils.lines_fragment_attrs(this.in_values)+

                'in vec2 global_id;\n'+
                'uniform float uBufferWidth;'+

                'vec2 get_global_id() {\n'+
                    'return global_id;\n'+
                '}\n'+

                _utils.get_global_id3_GLSLFunctionString()+
                _utils.get_global_id2_GLSLFunctionString()+

                _head+

                _utils.lines_drawBuffersWriteInit(8)+
                'void main(void) {\n'+
                    _utils.lines_drawBuffersInit(8)+

                    _source+

                    _utils.lines_drawBuffersWrite(8)+
                '}\n';


            //this.kernelPrograms = [	new WebCLGLKernelProgram(_gl, sourceVertex, sourceFrag, this.in_values) ];

            //this.fBuffer = _gl.createFramebuffer();
            //this.fBufferTemp = _gl.createFramebuffer();

            this.kernel = _gl.createProgram();
            var result = new WebCLGLUtils().createShader(_gl, "WEBCLGL", sourceVertex, sourceFragment, this.kernel);

            this.attr_VertexPos = _gl.getAttribLocation(this.kernel, "aVertexPosition");
            this.attr_TextureCoord = _gl.getAttribLocation(this.kernel, "aTextureCoord");

            this.uBufferWidth = _gl.getUniformLocation(this.kernel, "uBufferWidth");

            for(var key in this.in_values) {
                var expectedMode = {'float4_fromSampler': "SAMPLER",
                                    'float_fromSampler': "SAMPLER",
                                    'float': "UNIFORM",
                                    'float4': "UNIFORM",
                                    'mat4': "UNIFORM"}[this.in_values[key].type];

                _utils.checkArgNameInitialization(this.in_values, key);
                this.in_values[key].location = [_gl.getUniformLocation(this.kernel, key)];
                this.in_values[key].expectedMode = expectedMode;
            }

            return "VERTEX PROGRAM\n"+sourceVertex+"\n FRAGMENT PROGRAM\n"+sourceFragment;
        }).bind(this);


        var argumentsSource = source.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"
        //console.log(argumentsSource);
        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*/gm) != null) {
                var argName = argumentsSource[n].split('*')[1].trim();
                _utils.checkArgNameInitialization(this.in_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] != "") {
                var argName = argumentsSource[n].split(' ')[1].trim();
                _utils.checkArgNameInitialization(this.in_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_values[argName].type = 'mat4';
            }
        }
        //console.log(this.in_values);

        // parse header
        var _head =(header!=undefined)?header:'';
        _head = _head.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _head = _utils.parseSource(_head, this.in_values);

        // parse source
        var _source = source.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _source = _source.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        //console.log('minified source: '+_source);
        _source = _utils.parseSource(_source, this.in_values);

        var ts = compile();

        if(_showSource == true)
            console.log('%c KERNEL', 'font-size: 20px; color: blue'),
            console.log('%c WEBCLGL --------------------------------', 'color: gray'),
            console.log('%c '+header+source, 'color: gray'),
            console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray');
            console.log('%c '+ts, 'color: darkgray');
    };
    if(source != undefined)
        this.setKernelSource(source, header);



    /**
     * Bind float or a WebCLGLBuffer to a kernel argument
     * @type Void
     * @param {Int|String} argument Id of argument or name of this
     * @param {Float|Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} data
     * @param {Object} buffers
     */
    this.setKernelArg = function(argument, data, buffers) {
		var arg = (typeof argument == "string") ? argument : Object.keys(this.in_values)[argument];
        this.in_values[arg].value = data;

        //new WebCLGLUtils().checkUpdateFBs(_gl, _maxDrawBuffers, this, argument, data, buffers);
    };

    /**
     * clearArg
     */
    /*this.clearArg = function(webCLGL, buff, clearColor, buffers) {
        webCLGL.fillBuffer(buff.textureData, clearColor, this.fBuffer);
        webCLGL.fillBuffer(buff.textureDataTemp, clearColor, this.fBufferTemp);
    };*/
};


