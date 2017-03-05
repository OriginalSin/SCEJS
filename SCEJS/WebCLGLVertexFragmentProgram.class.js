/**
* WebCLGLVertexFragmentProgram Object
* @class
 * @param {WebGLRenderingContext} gl
 * @param {String} vertexSource
 * @param {String} vertexHeader
 * @param {String} fragmentSource
 * @param {String} fragmentHeader
*/
var WebCLGLVertexFragmentProgram = function(gl, vertexSource, vertexHeader, fragmentSource, fragmentHeader) {
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

    this.in_vertex_values = {};
    this.in_fragment_values = {};

    this._vertexP_ready = false;
    this._fragmentP_ready = false;

    this._vertexHead = null;
    this._vertexSource = null;
    this._fragmentHead = null;
    this._fragmentSource = null;

    this.output = null; //String or Array<String> of arg names with the items in same order that in the final return
    this.outputTempModes = null;
    this.fBuffer = null;
    this.fBufferTemp = null;

    this.drawMode = 4;

    if(vertexSource != undefined)
        this.setVertexSource(vertexSource, vertexHeader);

    if(fragmentSource != undefined)
        this.setFragmentSource(fragmentSource, fragmentHeader);


    /**
     * compileVertexFragmentSource
     */
    this.compileVertexFragmentSource = function() {
        var sourceVertex = 	""+
            this._precision+
            'uniform float uOffset;\n'+
            'uniform float uBufferWidth;'+

            this._utils.lines_vertex_attrs(this.in_vertex_values)+

            this._utils.unpackGLSLFunctionString()+

            this._utils.get_global_id3_GLSLFunctionString()+
            this._utils.get_global_id2_GLSLFunctionString()+

            this._vertexHead+

            'void main(void) {\n'+

                this._vertexSource+

            '}\n';
        var sourceFragment = '#extension GL_EXT_draw_buffers : require\n'+
            this._precision+

            this._utils.lines_fragment_attrs(this.in_fragment_values)+

            this._fragmentHead+

            //_utils.lines_drawBuffersWriteInit(8)+
            'void main(void) {\n'+
                this._utils.lines_drawBuffersInit(8)+

                this._fragmentSource+

                this._utils.lines_drawBuffersWrite(8)+
            '}\n';

        this.vertexFragmentProgram = this._gl.createProgram();
        var result = this._utils.createShader(this._gl, "WEBCLGL VERTEX FRAGMENT PROGRAM", sourceVertex, sourceFragment, this.vertexFragmentProgram);

        this.uOffset = this._gl.getUniformLocation(this.vertexFragmentProgram, "uOffset");
        this.uBufferWidth = this._gl.getUniformLocation(this.vertexFragmentProgram, "uBufferWidth");

        for(var key in this.in_vertex_values) {
            var expectedMode = {'float4_fromSampler': "SAMPLER",
                                'float_fromSampler': "SAMPLER",
                                'float4_fromAttr': "ATTRIBUTE",
                                'float_fromAttr': "ATTRIBUTE",
                                'float': "UNIFORM",
                                'float4': "UNIFORM",
                                'mat4': "UNIFORM"}[this.in_vertex_values[key].type];

            this._utils.checkArgNameInitialization(this.in_vertex_values, key);
            var loc = (expectedMode == "ATTRIBUTE") ? this._gl.getAttribLocation(this.vertexFragmentProgram, key) : this._gl.getUniformLocation(this.vertexFragmentProgram, key);
            this.in_vertex_values[key].location = [loc];
            this.in_vertex_values[key].expectedMode = expectedMode;
        }

        for(var key in this.in_fragment_values) {
            var expectedMode = {'float4_fromSampler': "SAMPLER",
                                'float_fromSampler': "SAMPLER",
                                'float': "UNIFORM",
                                'float4': "UNIFORM",
                                'mat4': "UNIFORM"}[this.in_fragment_values[key].type];

            this._utils.checkArgNameInitialization(this.in_fragment_values, key);
            this.in_fragment_values[key].location = [this._gl.getUniformLocation(this.vertexFragmentProgram, key)];
            this.in_fragment_values[key].expectedMode = expectedMode;
        }


        return "VERTEX PROGRAM\n"+sourceVertex+"\n FRAGMENT PROGRAM\n"+sourceFragment;
    };

    /**
     * Update the vertex source
     * @param {String} vertexSource
     * @param {String} vertexHeader
     */
    this.setVertexSource = function(vertexSource, vertexHeader) {
        var argumentsSource = vertexSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"

        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*attr/gm) != null) {
                var argName = argumentsSource[n].split('*attr')[1].trim();
                this._utils.checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4_fromAttr';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float_fromAttr';
            } else if(argumentsSource[n].match(/\*/gm) != null) {
                var argName = argumentsSource[n].split('*')[1].trim();
                this._utils.checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] != "") {
                var argName = argumentsSource[n].split(' ')[1].trim();
                this._utils.checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_vertex_values[argName].type = 'mat4';
            }
        }

        // parse header
        this._vertexHead =(vertexHeader!=undefined)?vertexHeader:'';
        this._vertexHead = this._vertexHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        this._vertexHead = this._utils.parseSource(this._vertexHead, this.in_vertex_values);

        // parse source
        this._vertexSource = vertexSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        this._vertexSource = this._vertexSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        this._vertexSource = this._utils.parseSource(this._vertexSource, this.in_vertex_values);

        this._vertexP_ready = true;
        if(this._fragmentP_ready == true) {
            var ts = this.compileVertexFragmentSource();

            if(this.viewSource == true)
                console.log('%c VFP: '+this.name, 'font-size: 20px; color: green'),
                console.log('%c WEBCLGL --------------------------------', 'color: gray'),
                console.log('%c '+vertexHeader+vertexSource, 'color: gray'),
                console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray'),
                console.log('%c '+ts, 'color: darkgray');
        }
    };

    /**
     * Update the fragment source
     * @param {String} fragmentSource
     * @param {String} fragmentHeader
     */
    this.setFragmentSource = function(fragmentSource, fragmentHeader) {
        var argumentsSource = fragmentSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"

        for(var n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*/gm) != null) {
                var argName = argumentsSource[n].split('*')[1].trim();
                this._utils.checkArgNameInitialization(this.in_fragment_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_fragment_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_fragment_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] != "") {
                var argName = argumentsSource[n].split(' ')[1].trim();
                this._utils.checkArgNameInitialization(this.in_fragment_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_fragment_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_fragment_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_fragment_values[argName].type = 'mat4';
            }
        }

        // parse header
        this._fragmentHead =(fragmentHeader!=undefined)?fragmentHeader:'';
        this._fragmentHead = this._fragmentHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        this._fragmentHead = this._utils.parseSource(this._fragmentHead, this.in_fragment_values);

        // parse source
        this._fragmentSource = fragmentSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        this._fragmentSource = this._fragmentSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        this._fragmentSource = this._utils.parseSource(this._fragmentSource, this.in_fragment_values);


        this._fragmentP_ready = true;
        if(this._vertexP_ready == true) {
            var ts = this.compileVertexFragmentSource();

            if(this.viewSource == true)
                console.log('%c VFP: ', 'font-size: 20px; color: green'),
                console.log('%c WEBCLGL --------------------------------', 'color: gray'),
                console.log('%c '+fragmentHeader+fragmentSource, 'color: gray'),
                console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray'),
                console.log('%c '+ts, 'color: darkgray');
        }
    };

};