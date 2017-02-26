/*
The MIT License (MIT)

Copyright (c) <2013> <Roberto Gonzalez. http://stormcolour.appspot.com/>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

var webCLGLDirectory = document.querySelector('script[src$="WebCLGL.class.js"]').getAttribute('src');
var page = webCLGLDirectory.split('/').pop();
webCLGLDirectory = webCLGLDirectory.replace('/'+page,"");

var includesF = ['/WebCLGLUtils.class.js',
    '/WebCLGLBuffer.class.js',
    '/WebCLGLKernel.class.js',
    '/WebCLGLVertexFragmentProgram.class.js',
    '/WebCLGLFor.class.js'];
for(var n = 0, f = includesF.length; n < f; n++) document.write('<script type="text/javascript" src="'+webCLGLDirectory+includesF[n]+'"></script>');

/**
* Class for parallelization of calculations using the WebGL context similarly to webcl
* @class
* @param {WebGLRenderingContext} [webglcontext=undefined] your WebGLRenderingContext
*/
var WebCLGL = function(webglcontext) {
    "use strict";

	this.utils = new WebCLGLUtils();

	// WEBGL CONTEXT
	var _gl;
	this.e = undefined;
	if(webglcontext == undefined) {
		this.e = document.createElement('canvas');
		this.e.width = 32;
		this.e.height = 32;
		_gl = this.utils.getWebGLContextFromCanvas(this.e, {antialias: false});
	} else _gl = webglcontext;

    var _arrExt = {"OES_texture_float":null, "OES_texture_float_linear":null, "OES_element_index_uint":null, "WEBGL_draw_buffers":null};
    for(var key in _arrExt) {
        _arrExt[key] = _gl.getExtension(key);
        if(_arrExt[key] == null)
            console.error("extension "+key+" not available");
    }
    var _maxDrawBuffers = null;
    if(_arrExt.hasOwnProperty("WEBGL_draw_buffers") && _arrExt["WEBGL_draw_buffers"] != null) {
        _maxDrawBuffers = _gl.getParameter(_arrExt["WEBGL_draw_buffers"].MAX_DRAW_BUFFERS_WEBGL);
        console.log("Max draw buffers: "+_maxDrawBuffers);
    } else
        console.log("Max draw buffers: 1");

    var highPrecisionSupport = _gl.getShaderPrecisionFormat(_gl.FRAGMENT_SHADER, _gl.HIGH_FLOAT);
    this.precision = (highPrecisionSupport.precision != 0) ? 'precision highp float;\n\nprecision highp int;\n\n' : 'precision lowp float;\n\nprecision lowp int;\n\n';
	//this.precision = '#version 300 es\nprecision highp float;\n\nprecision highp int;\n\n';
    var _currentTextureUnit;
    var _bufferWidth = 0;

	// QUAD
	var mesh = this.utils.loadQuad(undefined,1.0,1.0);
	this.vertexBuffer_QUAD = _gl.createBuffer();
	_gl.bindBuffer(_gl.ARRAY_BUFFER, this.vertexBuffer_QUAD);
	_gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(mesh.vertexArray), _gl.STATIC_DRAW);
	this.indexBuffer_QUAD = _gl.createBuffer();
	_gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_QUAD);
	_gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indexArray), _gl.STATIC_DRAW);


    var arrayCopyTex = [];

	// SHADER READPIXELS
	var sourceVertex = 	this.precision+
			'attribute vec3 aVertexPosition;\n'+
			'varying vec2 vCoord;\n'+

			'void main(void) {\n'+
				'gl_Position = vec4(aVertexPosition, 1.0);\n'+
				'vCoord = aVertexPosition.xy*0.5+0.5;\n'+
			'}\n';
	var sourceFragment = this.precision+
			'uniform sampler2D sampler_buffer;\n'+

			'uniform int u_vectorValue;\n'+
			'uniform int u_offset;\n'+

			'varying vec2 vCoord;\n'+

			this.utils.packGLSLFunctionString()+

            //'out vec4 fragmentColor;'+

			'void main(void) {\n'+
				'gl_FragColor = texture2D(sampler_buffer, vCoord);'+
			'}\n';

	this.shader_readpixels = _gl.createProgram();
	this.utils.createShader(_gl, "CLGLREADPIXELS", sourceVertex, sourceFragment, this.shader_readpixels);

	this.u_offset = _gl.getUniformLocation(this.shader_readpixels, "u_offset");
	this.u_vectorValue = _gl.getUniformLocation(this.shader_readpixels, "u_vectorValue");

	this.sampler_buffer = _gl.getUniformLocation(this.shader_readpixels, "sampler_buffer");

	this.attr_VertexPos = _gl.getAttribLocation(this.shader_readpixels, "aVertexPosition");
    // END SHADER READPIXELS

    // SHADER COPYTEXTURE
    var lines_drawBuffersEnable = (function() {
        return ((_maxDrawBuffers != null) ? '#extension GL_EXT_draw_buffers : require\n' : "");
    }).bind(this);
    var lines_drawBuffersWriteInit = (function() {
        var str = '';
        for(var n= 0, fn=_maxDrawBuffers; n < fn; n++)
            str += 'layout(location = '+n+') out vec4 outCol'+n+';\n';

        return str;
    }).bind(this);
    var lines_drawBuffersWrite = (function() {
        var str = '';
        for(var n= 0, fn=_maxDrawBuffers; n < fn; n++)
            str += 'gl_FragData['+n+'] = texture2D(uArrayCT['+n+'], vCoord);\n';

        return str;
    }).bind(this);
	var sourceVertex = 	""+
        this.precision+
		'attribute vec3 aVertexPosition;\n'+
		'varying vec2 vCoord;\n'+

		'void main(void) {\n'+
			'gl_Position = vec4(aVertexPosition, 1.0);\n'+
			'vCoord = aVertexPosition.xy*0.5+0.5;\n'+
		'}';
	var sourceFragment = lines_drawBuffersEnable()+
	    this.precision+

        'uniform sampler2D uArrayCT['+_maxDrawBuffers+'];\n'+

		'varying vec2 vCoord;\n'+

        //lines_drawBuffersWriteInit()+
		'void main(void) {\n'+
            lines_drawBuffersWrite()+
		'}';
	this.shader_copyTexture = _gl.createProgram();
	this.utils.createShader(_gl, "CLGLCOPYTEXTURE", sourceVertex, sourceFragment, this.shader_copyTexture);

	this.attr_copyTexture_pos = _gl.getAttribLocation(this.shader_copyTexture, "aVertexPosition");

    for(var n= 0, fn=_maxDrawBuffers; n < fn; n++)
        arrayCopyTex[n] = _gl.getUniformLocation(this.shader_copyTexture, "uArrayCT["+n+"]");
    // END SHADER COPYTEXTURE

    this.textureDataAux = _gl.createTexture();
    _gl.bindTexture(_gl.TEXTURE_2D, this.textureDataAux);
    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, 2, 2, 0, _gl.RGBA, _gl.FLOAT, new Float32Array([1,0,0,1, 0,1,0,1, 0,0,1,1, 1,1,1,1]));
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
    _gl.bindTexture(_gl.TEXTURE_2D, null);

    /**
     * getContext
     * @returns {WebGLRenderingContext}
     */
    this.getContext = function() {
        return _gl;
    };

    /**
     * getMaxDrawBuffers
     * @returns {int}
     */
    this.getMaxDrawBuffers = function() {
        return _maxDrawBuffers;
    };

    /**
     * copy
     * @param {WebCLGLKernel|WebCLGLVertexFragmentProgram} pgr
     * @param {Array<WebCLGLBuffer>} [webCLGLBuffers=null]
     */
    this.copy = function(pgr, webCLGLBuffers) {
        if(webCLGLBuffers != null) {
            if(webCLGLBuffers[0] != null) {
                _gl.viewport(0, 0, webCLGLBuffers[0].W, webCLGLBuffers[0].H);

                _gl.bindFramebuffer(_gl.FRAMEBUFFER, webCLGLBuffers[0].fBuffer);
                var arrDBuff = [];
                for(var n= 0, fn=webCLGLBuffers.length; n < fn; n++) {
                    if(webCLGLBuffers[n] != null) {
                        _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT'+n+'_WEBGL'], _gl.TEXTURE_2D, webCLGLBuffers[n].textureData, 0);
                        arrDBuff[n] = _arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT'+n+'_WEBGL'];
                    } else
                        arrDBuff[n] = _gl['NONE'];
                }
                _arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(arrDBuff);

                _gl.useProgram(this.shader_copyTexture);

                for(var n= 0, fn=webCLGLBuffers.length; n < fn; n++) {
                    _gl.activeTexture(_gl["TEXTURE"+n]);
                    if(webCLGLBuffers[n] != null)
                        _gl.bindTexture(_gl.TEXTURE_2D, webCLGLBuffers[n].textureDataTemp);
                    else
                        _gl.bindTexture(_gl.TEXTURE_2D, this.textureDataAux);
                    _gl.uniform1i(arrayCopyTex[n], n);
                }

                copyNow(webCLGLBuffers);
            } else {
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
            }
        } else
            _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    };
    var copyNow = (function(webCLGLBuffers) {
        _gl.enableVertexAttribArray(this.attr_copyTexture_pos);
        _gl.bindBuffer(_gl.ARRAY_BUFFER, this.vertexBuffer_QUAD);
        _gl.vertexAttribPointer(this.attr_copyTexture_pos, 3, _gl.FLOAT, false, 0, 0);

        _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_QUAD);
        _gl.drawElements(_gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0);
    }).bind(this);

    /**
     * Create a empty WebCLGLBuffer
     * @param {String} [type="FLOAT"] type FLOAT4 OR FLOAT
     * @param {Float} [offset=0.0] If 0 the range is from 0.0 to 1.0 else if >0 then the range is from -offset.0 to offset.0
     * @param {boolean} [linear=false] linear texParameteri type for the WebGLTexture
     * @param {String} [mode="SAMPLER"] Mode for this buffer. "SAMPLER", "ATTRIBUTE", "VERTEX_INDEX"
     * @returns {WebCLGLBuffer}
     */
    this.createBuffer = function(type, offset, linear, mode) {
        return new WebCLGLBuffer(_gl, type, offset, linear, mode);
    };

    /**
     * Create a kernel
     * @returns {WebCLGLKernel}
     * @param {String} [source=undefined]
     * @param {String} [header=undefined] Additional functions
     */
    this.createKernel = function(source, header) {
        return new WebCLGLKernel(_gl, source, header);
    };

    /**
     * Create a vertex and fragment programs for a WebGL graphical representation after some enqueueNDRangeKernel
     * @returns {WebCLGLVertexFragmentProgram}
     * @param {String} [vertexSource=undefined]
     * @param {String} [vertexHeader=undefined]
     * @param {String} [fragmentSource=undefined]
     * @param {String} [fragmentHeader=undefined]
     */
    this.createVertexFragmentProgram = function(vertexSource, vertexHeader, fragmentSource, fragmentHeader) {
        return new WebCLGLVertexFragmentProgram(_gl, vertexSource, vertexHeader, fragmentSource, fragmentHeader);
    };

    /**
     * fillBuffer with color
     * @param {WebGLTexture} texture
     * @param {Array<Float>} clearColor
     * @param {WebGLFramebuffer} fBuffer
     */
    this.fillBuffer = function(texture, clearColor, fBuffer) {
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, fBuffer);
        _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL'], _gl.TEXTURE_2D, texture, 0);

        var arrDBuff = [_arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL']];
        _arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(arrDBuff);
        //_gl.clearBufferfv(_gl.COLOR, 0, clearColor);

        /*var arrDBuff = [_gl['NONE']];
        _gl.drawBuffers(arrDBuff);
        _gl.clearBufferfv(_gl.DEPTH, 0, clearColor);*/

        if(clearColor != undefined)
            _gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        _gl.clear(_gl.COLOR_BUFFER_BIT);
    };

    /**
     * bindAttributeValue
     * @param {Object} inValue
     * @param {WebCLGLBuffer} buff
     * @private
     */
    var bindAttributeValue = (function(inValue, buff) {
        if(buff != null) {
            if(inValue.type == 'float4_fromAttr') {
                _gl.enableVertexAttribArray(inValue.location[0]);
                _gl.bindBuffer(_gl.ARRAY_BUFFER, buff.vertexData0);
                _gl.vertexAttribPointer(inValue.location[0], 4, _gl.FLOAT, false, 0, 0);
            } else if(inValue.type == 'float_fromAttr') {
                _gl.enableVertexAttribArray(inValue.location[0]);
                _gl.bindBuffer(_gl.ARRAY_BUFFER, buff.vertexData0);
                _gl.vertexAttribPointer(inValue.location[0], 1, _gl.FLOAT, false, 0, 0);
            }
        } else
            _gl.disableVertexAttribArray(inValue.location[0]);
    }).bind(this);

    /**
     * bindSamplerValue
     * @pram {WebGLLocation} uBufferWidth
     * @param {Object} inValue
     * @param {WebCLGLBuffer} buff
     * @private
     */
    var bindSamplerValue = (function(uBufferWidth, inValue, buff) {
        if(_currentTextureUnit < 16)
            _gl.activeTexture(_gl["TEXTURE"+_currentTextureUnit]);
        else
            _gl.activeTexture(_gl["TEXTURE16"]);

        if(buff != null) {
            _gl.bindTexture(_gl.TEXTURE_2D, buff.textureData);

            if(_bufferWidth == 0) {
                _bufferWidth = buff.W;
                _gl.uniform1f(uBufferWidth, _bufferWidth);
            }
        } else
            _gl.bindTexture(_gl.TEXTURE_2D, this.textureDataAux);
        _gl.uniform1i(inValue.location[0], _currentTextureUnit);

        _currentTextureUnit++;
    }).bind(this);

    /**
     * bindUniformValue
     * @param {Object} inValue
     * @param {WebCLGLBuffer} buff
     * @private
     */
    var bindUniformValue = (function(inValue, buff) {
        if(buff != null) {
            if(inValue.type == 'float')
                _gl.uniform1f(inValue.location[0], buff);
            else if(inValue.type == 'float4')
                _gl.uniform4f(inValue.location[0], buff[0], buff[1], buff[2], buff[3]);
            else if(inValue.type == 'mat4')
                _gl.uniformMatrix4fv(inValue.location[0], false, buff);
        }
    }).bind(this);

    /**
     * bindValue
     * @param {WebCLGLKernel|WebCLGLVertexFragmentProgram} webCLGLProgram
     * @param {Object} inValue
     * @param {WebCLGLBuffer|Float|Array<Float>|Float32Array|Uint8Array} argValue
     * @private
     */
    var bindValue = (function(webCLGLProgram, inValue, argValue) {
        switch(inValue.expectedMode) {
            case "ATTRIBUTE":
                bindAttributeValue(inValue, argValue);
                break;
            case "SAMPLER":
                bindSamplerValue(webCLGLProgram.uBufferWidth, inValue, argValue);
                break;
            case "UNIFORM":
                bindUniformValue(inValue, argValue);
                break;
        }
    }).bind(this);

    /**
     * bindFB
     * @param {Array<WebCLGLBuffer>} [webCLGLBuffers=null]
     * @param {WebCLGLKernel|WebCLGLVertexFragmentProgram} pgr
     * @param {boolean} outputToTemp
     * @private
     */
    var bindFB = (function(webCLGLBuffers, pgr, outputToTemp) {
        if(webCLGLBuffers != null) {
            if(webCLGLBuffers[0] != null) {
                _gl.viewport(0, 0, webCLGLBuffers[0].W, webCLGLBuffers[0].H);

                _gl.bindFramebuffer(_gl.FRAMEBUFFER, ((outputToTemp == true) ? webCLGLBuffers[0].fBufferTemp:webCLGLBuffers[0].fBuffer));
                var arrDBuff = [];
                for(var n= 0, fn=webCLGLBuffers.length; n < fn; n++) {
                    if(webCLGLBuffers[n] != null) {
                        var o = (outputToTemp == true) ? webCLGLBuffers[n].textureDataTemp : webCLGLBuffers[n].textureData;
                        _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT'+n+'_WEBGL'], _gl.TEXTURE_2D, o, 0);
                        arrDBuff[n] = _arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT'+n+'_WEBGL'];
                    } else
                        arrDBuff[n] = _gl['NONE'];
                }
                _arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(arrDBuff);

                // checkFramebufferStatus
                var sta = _gl.checkFramebufferStatus(_gl.FRAMEBUFFER);
                var ferrors = {};
                ferrors[_gl.FRAMEBUFFER_COMPLETE] = true;
                ferrors[_gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT] = "FRAMEBUFFER_INCOMPLETE_ATTACHMENT: The attachment types are mismatched or not all framebuffer attachment points are framebuffer attachment complete";
                ferrors[_gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT] = "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: There is no attachment";
                ferrors[_gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS] = "FRAMEBUFFER_INCOMPLETE_DIMENSIONS: Height and width of the attachment are not the same";
                ferrors[_gl.FRAMEBUFFER_UNSUPPORTED] = "FRAMEBUFFER_UNSUPPORTED: The format of the attachment is not supported or if depth and stencil attachments are not the same renderbuffer";
                if(ferrors[sta] != true) {
                    console.log(ferrors[sta]); debugger;
                }
            } else {
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
            }
        } else
            _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    }).bind(this);

    /**
     * Perform calculation and save the result on a WebCLGLBuffer
     * @param {WebCLGLKernel} webCLGLKernel
     * @param {WebCLGLBuffer|Array<WebCLGLBuffer>} [webCLGLBuffer=null]
     * @param {boolean} outputToTemp
     * @param {Object} argValues
     */
    this.enqueueNDRangeKernel = function(webCLGLKernel, webCLGLBuffer, outputToTemp, argValues) {
        _bufferWidth = 0;

        _gl.useProgram(webCLGLKernel.kernel);

        bindFB(webCLGLBuffer, webCLGLKernel, outputToTemp);

        _currentTextureUnit = 0;
        for(var key in webCLGLKernel.in_values)
            bindValue(webCLGLKernel, webCLGLKernel.in_values[key], argValues[key]);

        _gl.enableVertexAttribArray(webCLGLKernel.attr_VertexPos);
        _gl.bindBuffer(_gl.ARRAY_BUFFER, this.vertexBuffer_QUAD);
        _gl.vertexAttribPointer(webCLGLKernel.attr_VertexPos, 3, _gl.FLOAT, false, 0, 0);

        _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_QUAD);
        _gl.drawElements(_gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0);
    };



    /**
     * Perform WebGL graphical representation
     * @param {WebCLGLVertexFragmentProgram} webCLGLVertexFragmentProgram
     * @param {WebCLGLBuffer} bufferInd Buffer to draw type (type indices or vertex)
     * @param {int} [drawMode=4] 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
     * @param {WebCLGLBuffer|Array<WebCLGLBuffer>} [webCLGLBuffer=null]
     * @param {boolean} outputToTemp
     * @param {Object} argValues
     */
    this.enqueueVertexFragmentProgram = function(webCLGLVertexFragmentProgram, bufferInd, drawMode, webCLGLBuffer, outputToTemp, argValues) {
        _bufferWidth = 0;

        _gl.useProgram(webCLGLVertexFragmentProgram.vertexFragmentProgram);

        var Dmode = (drawMode != undefined) ? drawMode : 4;

        bindFB(webCLGLBuffer, webCLGLVertexFragmentProgram, outputToTemp);

        if(bufferInd != undefined) {
            _gl.uniform1f(webCLGLVertexFragmentProgram.uOffset, bufferInd.offset);

            _currentTextureUnit = 0;
            for(var key in webCLGLVertexFragmentProgram.in_vertex_values)
                bindValue(webCLGLVertexFragmentProgram, webCLGLVertexFragmentProgram.in_vertex_values[key], argValues[key]);

            for(var key in webCLGLVertexFragmentProgram.in_fragment_values)
                 bindValue(webCLGLVertexFragmentProgram, webCLGLVertexFragmentProgram.in_fragment_values[key], argValues[key]);

            if(bufferInd.mode == "VERTEX_INDEX") {
                _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, bufferInd.vertexData0);
                _gl.drawElements(Dmode, bufferInd.length, _gl.UNSIGNED_SHORT, 0);
            } else
                _gl.drawArrays(Dmode, 0, bufferInd.length);
        }
    };

    /**
     * Get the internally WebGLTexture (type FLOAT), if the WebGLRenderingContext was given.
     * @returns {WebGLTexture}
     */
    this.enqueueReadBuffer_WebGLTexture = function(buffer) {
        return buffer.textureData;
    };

    /** @private **/
    var enqueueReadBuffer = (function(buffer, item) {
        _gl.uniform1i(this.u_vectorValue, item);

        _gl.uniform1i(this.u_offset, buffer.offset);

        _gl.activeTexture(_gl.TEXTURE0);
        _gl.bindTexture(_gl.TEXTURE_2D, buffer.textureData);
        _gl.uniform1i(this.sampler_buffer, 0);


        _gl.enableVertexAttribArray(this.attr_VertexPos);
        _gl.bindBuffer(_gl.ARRAY_BUFFER, this.vertexBuffer_QUAD);
        _gl.vertexAttribPointer(this.attr_VertexPos, 3, buffer._supportFormat, false, 0, 0);

        _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_QUAD);
        _gl.drawElements(_gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0);

        var arrLength = buffer.W*buffer.H*4;
        if(buffer.outArrayFloat == undefined)
            buffer.outArrayFloat = new Float32Array((buffer.W*buffer.H)*4);
        _gl.readPixels(0, 0, buffer.W, buffer.H, _gl.RGBA, _gl.FLOAT, buffer.outArrayFloat);

        return buffer.outArrayFloat;
    }).bind(this);

    /** @private **/
    var prepareViewportForBufferRead = (function(buffer) {
        _gl.viewport(0, 0, buffer.W, buffer.H);
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, buffer.fBufferTemp);

        var arrDBuff = [];
        var o = buffer.textureDataTemp;
        _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL'], _gl.TEXTURE_2D, o, 0);
        arrDBuff[0] = _arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL'];
        _arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(arrDBuff);

        //_gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, nTexture, 0);
        if(this.e != undefined) {
            this.e.width = buffer.W;
            this.e.height = buffer.H;
        }
    }).bind(this);

    /**
     * Get Float32Array array from a WebCLGLBuffer
     * @param {WebCLGLBuffer} buffer
     * @returns {Float32Array}
     */
    this.readBuffer = function(buffer) {
        prepareViewportForBufferRead(buffer);
        _gl.useProgram(this.shader_readpixels);
        var arr = enqueueReadBuffer(buffer, 0, f);

        if(buffer.type == "FLOAT") {
            var Float_Un = new Float32Array(arr.length/4);
            for(var n=0, fn= arr.length/4; n < fn; n++)
                Float_Un[n] = arr[n*4];

            arr = Float_Un;
        }

        return arr;
    };
};