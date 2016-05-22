/**
 * WebCLGLBuffer Object
 * @class
 * @constructor
 * @property {WebGLTexture} textureData
 * @property {Array<Float>} inData Original array
 * @property {Int} [offset=0] offset of buffer
 */
WebCLGLBufferItem = function(gl, length, type, offset, linear, mode) {
    "use strict";

    var _gl = gl;

    if(length.constructor === Array) {
        this.length = length[0]*length[1];
        this.W = length[0];
        this.H = length[1];
    } else {
        this.length = length;
        this.W = Math.ceil(Math.sqrt(this.length));
        this.H = this.W;
    }

    this.type = (type != undefined) ? type : 'FLOAT';
    this._supportFormat = _gl.FLOAT;
    //this._supportFormat = _gl.UNSIGNED_BYTE;

    this.offset = (offset != undefined) ? offset : 0;
    this.linear = (linear != undefined && linear == true) ? true : false;

    var inData; // enqueueWriteBuffer user data

    this.mode = (mode != undefined) ? mode : "SAMPLER"; // "SAMPLER", "ATTRIBUTE", "VERTEX_INDEX"


    this.initialize = function() {
        if(this.mode == "SAMPLER") {
            // Create WebGLTexture buffer
            this.textureData = createWebGLTextureBuffer();
            this.vertexData0 = createWebGLBuffer();
        }
        if(this.mode == "ATTRIBUTE" || this.mode == "VERTEX_INDEX") {
            // Create WebGL buffer
            this.vertexData0 = createWebGLBuffer();
        }
    };


    this.createWebGLRenderBuffer = function() {
        var rBuffer = _gl.createRenderbuffer();
        _gl.bindRenderbuffer(_gl.RENDERBUFFER, rBuffer);
        _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.DEPTH_COMPONENT16, this.W, this.H);
        _gl.bindRenderbuffer(_gl.RENDERBUFFER, null);
        return rBuffer;
    };
    this.createWebGLFrameBuffer = function(rBuffer) {
        if(rBuffer == undefined)
            rBuffer = this.createWebGLRenderBuffer();

        this.fBuffer = _gl.createFramebuffer();
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, this.fBuffer);
        _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, rBuffer);

        return rBuffer;
    };

    /**
     * Create the WebGLTexture buffer
     */
    var createWebGLTextureBuffer = (function() {
        _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
        _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

        var textureData = _gl.createTexture();
        _gl.bindTexture(_gl.TEXTURE_2D, textureData);
        if(this.linear != undefined && this.linear == true) {
            _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, this.W,this.H, 0, _gl.RGBA, this._supportFormat, null);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
            _gl.generateMipmap(_gl.TEXTURE_2D);
        } else {
            _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, this.W,this.H, 0, _gl.RGBA, this._supportFormat, null);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
        }

        return textureData;
    }).bind(this);

    /**
     * Create the WebGL buffer
     */
    var createWebGLBuffer = (function() {
        var vertexData = _gl.createBuffer();

        return vertexData;
    }).bind(this);

    /**
     * Write WebGLTexture buffer
     * @param {Array|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} array
     * @param {Bool} [flip=false]
     */
    this.writeWebGLTextureBuffer = function(arr, flip) {
        inData = arr;

        if(arr instanceof WebGLTexture)
            this.textureData = arr;
        else {
            if(flip == false || flip == undefined)
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
            else
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);

            _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            _gl.bindTexture(_gl.TEXTURE_2D, this.textureData);

            if(arr instanceof HTMLImageElement)  {
                inData = new WebCLGLUtils().getUint8ArrayFromHTMLImageElement(arr);
                //texImage2D(			target, 			level, 	internalformat, 	format, 		type, 			TexImageSource);
                if(this.type == 'FLOAT4') {
                    _gl.texImage2D(	_gl.TEXTURE_2D, 0, 		_gl.RGBA, 		_gl.RGBA, 	_gl.FLOAT, 	arr);
                }/* else if(this.type == 'INT4') {
                 _gl.texImage2D(	_gl.TEXTURE_2D, 0, 		_gl.RGBA, 		_gl.RGBA, 	_gl.UNSIGNED_BYTE, 	arr);
                 }*/
            } else {
                if(this.type == 'FLOAT4') {
                    var arrt;
                    if(arr.length != (this.W*this.H*4)) {
                        arrt = new Float32Array((this.W*this.H)*4);
                        for(var n=0; n < arr.length; n++)
                            arrt[n] = arr[n];
                    } else
                        arrt = arr;

                    arrt = (arrt instanceof Float32Array) ? arrt : new Float32Array(arrt);

                    //texImage2D(			target, 			level, 	internalformat, 	width, height, border, 	format, 		type, 			pixels);
                    _gl.texImage2D(_gl.TEXTURE_2D, 	0, 		_gl.RGBA, 		this.W, this.H, 0, 	_gl.RGBA, 	_gl.FLOAT, 	arrt);
                } else if(this.type == 'FLOAT') {
                    var arrayTemp = new Float32Array(this.W*this.H*4);

                    for(var n = 0, f = this.W*this.H; n < f; n++) {
                        var idd = n*4;
                        arrayTemp[idd] = arr[n];
                        arrayTemp[idd+1] = 0.0;
                        arrayTemp[idd+2] = 0.0;
                        arrayTemp[idd+3] = 0.0;
                    }
                    arr = arrayTemp;
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, this.W, this.H, 0, _gl.RGBA, _gl.FLOAT, arr);
                }
            }
        }
        if(this.linear) _gl.generateMipmap(_gl.TEXTURE_2D);
    };

    /**
     * Write WebGL buffer
     * @param {Array|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} array
     * @param {Bool} [flip=false]
     */
    this.writeWebGLBuffer = function(arr, flip) {
        inData = arr;
        if(this.mode == "VERTEX_INDEX") { // "VERTEX_INDEX" ELEMENT_ARRAY_BUFFER
            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, this.vertexData0);
            _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arr), _gl.DYNAMIC_DRAW);
        } else { // "ATTRIBUTE" ARRAY_BUFFER
            var arrt;
            if(arr.length != (this.W*this.H*4)) {
                arrt = new Float32Array((this.W*this.H)*4);
                for(var n=0; n < arr.length; n++)
                    arrt[n] = arr[n];
            } else
                arrt = arr;

            arrt = (arrt instanceof Float32Array) ? arrt : new Float32Array(arrt);

            _gl.bindBuffer(_gl.ARRAY_BUFFER, this.vertexData0);
            _gl.bufferData(_gl.ARRAY_BUFFER, arrt, _gl.DYNAMIC_DRAW);
        }
    };

    /**
     * Remove this buffer
     */
    this.remove = function() {
        _gl.deleteRenderbuffer(this.rBuffer);
        _gl.deleteFramebuffer(this.fBuffer);

        if(this.mode == "SAMPLER")
            _gl.deleteTexture(this.textureData);

        if(this.mode == "ATTRIBUTE" || this.mode == "VERTEX_INDEX")
            _gl.deleteBuffer(this.vertexData0);
    };
};


