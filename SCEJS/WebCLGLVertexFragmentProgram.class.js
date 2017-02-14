/**
* WebCLGLVertexFragmentProgram Object
* @class
* @constructor
*/
WebCLGLVertexFragmentProgram = function(gl, vertexSource, vertexHeader, fragmentSource, fragmentHeader) {
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

	this.in_vertex_values = {};
	this.in_fragment_values = {};

	var _vertexP_ready = false;
    var _fragmentP_ready = false;

    var _vertexHead;
    var _vertexSource;
    var _fragmentHead;
    var _fragmentSource;

    this.output = null; //String or Array<String> of arg names with the items in same order that in the final return
    this.outputTempModes = null;
    this.fBuffer = null;
    this.fBufferTemp = null;
    this.fBufferLength = 0;
    this.fBufferCount = 0;

    this.drawMode = 4;


    /** @private **/
    var compileVertexFragmentSource = (function() {
        var sourceVertex = 	""+
            _precision+
            'uniform float uOffset;\n'+
            'uniform float uBufferWidth;'+

            _utils.lines_vertex_attrs(this.in_vertex_values)+

            _utils.unpackGLSLFunctionString()+

            _utils.get_global_id3_GLSLFunctionString()+
            _utils.get_global_id2_GLSLFunctionString()+

            _vertexHead+

            'void main(void) {\n'+

            _vertexSource+

            '}\n';
        //console.log(sourceVertex);
        var sourceFragment = ''+
            _precision+

            _utils.lines_fragment_attrs(this.in_fragment_values)+

            _fragmentHead+

            _utils.lines_drawBuffersWriteInit(8)+
            'void main(void) {\n'+
                _utils.lines_drawBuffersInit(8)+

                _fragmentSource+

                _utils.lines_drawBuffersWrite(8)+
            '}\n';
        //console.log(sourceFragment);

        //this.fBuffer = _gl.createFramebuffer();
        //this.fBufferTemp = _gl.createFramebuffer();

        this.vertexFragmentProgram = _gl.createProgram();
        var result = _utils.createShader(_gl, "WEBCLGL VERTEX FRAGMENT PROGRAM", sourceVertex, sourceFragment, this.vertexFragmentProgram);

        this.uOffset = _gl.getUniformLocation(this.vertexFragmentProgram, "uOffset");
        this.uBufferWidth = _gl.getUniformLocation(this.vertexFragmentProgram, "uBufferWidth");

        for(var key in this.in_vertex_values) {
            var expectedMode = {'float4_fromSampler': "SAMPLER",
                                'float_fromSampler': "SAMPLER",
                                'float4_fromAttr': "ATTRIBUTE",
                                'float_fromAttr': "ATTRIBUTE",
                                'float': "UNIFORM",
                                'float4': "UNIFORM",
                                'mat4': "UNIFORM"}[this.in_vertex_values[key].type];

            _utils.checkArgNameInitialization(this.in_vertex_values, key);
            var loc = (expectedMode == "ATTRIBUTE") ? _gl.getAttribLocation(this.vertexFragmentProgram, key) : _gl.getUniformLocation(this.vertexFragmentProgram, key);
            this.in_vertex_values[key].location = [loc];
            this.in_vertex_values[key].expectedMode = expectedMode;
        }

        for(var key in this.in_fragment_values) {
            var expectedMode = {'float4_fromSampler': "SAMPLER",
                                'float_fromSampler': "SAMPLER",
                                'float': "UNIFORM",
                                'float4': "UNIFORM",
                                'mat4': "UNIFORM"}[this.in_fragment_values[key].type];

            _utils.checkArgNameInitialization(this.in_fragment_values, key);
            this.in_fragment_values[key].location = [_gl.getUniformLocation(this.vertexFragmentProgram, key)];
            this.in_fragment_values[key].expectedMode = expectedMode;
        }


        return "VERTEX PROGRAM\n"+sourceVertex+"\n FRAGMENT PROGRAM\n"+sourceFragment;
    }).bind(this);

    /**
     * Update the vertex source
     * @type Void
     * @param {String} vertexSource
     * @param {String} vertexHeader
     */
    this.setVertexSource = function(vertexSource, vertexHeader) {
        var argumentsSource = vertexSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"
        //console.log(argumentsSource);
        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*attr/gm) != null) {
                var argName = argumentsSource[n].split('*attr')[1].trim();
                _utils.checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4_fromAttr';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float_fromAttr';
            } else if(argumentsSource[n].match(/\*/gm) != null) {
                var argName = argumentsSource[n].split('*')[1].trim();
                _utils.checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] != "") {
                var argName = argumentsSource[n].split(' ')[1].trim();
                _utils.checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_vertex_values[argName].type = 'mat4';
            }
        }
        //console.log(this.in_vertex_values);

        // parse header
        _vertexHead =(vertexHeader!=undefined)?vertexHeader:'';
        _vertexHead = _vertexHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _vertexHead = _utils.parseSource(_vertexHead, this.in_vertex_values);

        // parse source
        _vertexSource = vertexSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _vertexSource = _vertexSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        //console.log('minified source: '+_vertexSource);
        _vertexSource = _utils.parseSource(_vertexSource, this.in_vertex_values);

        _vertexP_ready = true;
        if(_fragmentP_ready == true) {
            var ts = compileVertexFragmentSource();

            if(_showSource == true)
                console.log('%c VFP', 'font-size: 20px; color: green'),
                console.log('%c WEBCLGL --------------------------------', 'color: gray'),
                console.log('%c '+vertexHeader+vertexSource, 'color: gray'),
                console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray');
                console.log('%c '+ts, 'color: darkgray');
        }
    };
    if(vertexSource != undefined)
        this.setVertexSource(vertexSource, vertexHeader);



    /**
     * Update the fragment source
     * @type Void
     * @param {String} fragmentSource
     * @param {String} fragmentHeader
     */
    this.setFragmentSource = function(fragmentSource, fragmentHeader) {
        var argumentsSource = fragmentSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"
        //console.log(argumentsSource);
        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*/gm) != null) {
                var argName = argumentsSource[n].split('*')[1].trim();
                _utils.checkArgNameInitialization(this.in_fragment_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_fragment_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_fragment_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] != "") {
                var argName = argumentsSource[n].split(' ')[1].trim();
                _utils.checkArgNameInitialization(this.in_fragment_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_fragment_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_fragment_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_fragment_values[argName].type = 'mat4';
            }
        }
        //console.log(this.in_fragment_values);

        // parse header
        _fragmentHead =(fragmentHeader!=undefined)?fragmentHeader:'';
        _fragmentHead = _fragmentHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _fragmentHead = _utils.parseSource(_fragmentHead, this.in_fragment_values);

        // parse source
        if(_showSource == true)

        _fragmentSource = fragmentSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        _fragmentSource = _fragmentSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        //console.log('minified source: '+_fragmentSource);
        _fragmentSource = _utils.parseSource(_fragmentSource, this.in_fragment_values);


        _fragmentP_ready = true;
        if(_vertexP_ready == true) {
            var ts = compileVertexFragmentSource();

            if(_showSource == true)
                console.log('%c VFP', 'font-size: 20px; color: green'),
                console.log('%c WEBCLGL --------------------------------', 'color: gray'),
                console.log('%c '+fragmentHeader+fragmentSource, 'color: gray'),
                console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray');
                console.log('%c '+ts, 'color: darkgray');
        }
    };
    if(fragmentSource != undefined)
        this.setFragmentSource(fragmentSource, fragmentHeader);


















    /**
     * Bind float, mat4 or a WebCLGLBuffer to a vertex argument
     * @param {Int|String} argument Id of argument or name of this
     * @param {Float|Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} data
     * @param {Object} buffers
     */
    this.setVertexArg = function(argument, data, buffers) {
		var arg = (typeof argument == "string") ? argument : Object.keys(this.in_vertex_values)[argument];
        this.in_vertex_values[arg].value = data;

        //new WebCLGLUtils().checkUpdateFBs(_gl, _maxDrawBuffers, this, argument, data, buffers);
    };

    /**
     * Bind float or a WebCLGLBuffer to a fragment argument
     * @param {Int|String} argument Id of argument or name of this
     * @param {Float|Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} data
     * @param {Object} buffers
     */
    this.setFragmentArg = function(argument, data, buffers) {
		var arg = (typeof argument == "string") ? argument : Object.keys(this.in_fragment_values)[argument];
        this.in_fragment_values[arg].value = data;

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


