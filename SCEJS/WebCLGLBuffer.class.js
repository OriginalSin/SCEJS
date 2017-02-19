/** 
* WebCLGLBuffer Object 
* @class
* @constructor
* @property {Float} length
*/
WebCLGLBuffer = function(gl, type, offset, linear, mode) {
    "use strict";

    var _gl = gl;

    this.type = (type != undefined) ? type : 'FLOAT';
    this._supportFormat = _gl.FLOAT;

    this.offset = (offset != undefined) ? offset : 0;
    this.linear = (linear != undefined && linear == true) ? true : false;
    this.mode = (mode != undefined) ? mode : "SAMPLER"; // "SAMPLER", "ATTRIBUTE", "VERTEX_INDEX"

    this.textureData = null;
    this.textureDataTemp = null;
    this.vertexData0 = null;

    var _oldW = 0;

    if(this.mode == "SAMPLER") {
        this.textureData = _gl.createTexture();
        this.textureDataTemp = _gl.createTexture();
    }
    if(this.mode == "SAMPLER" || this.mode == "ATTRIBUTE" || this.mode == "VERTEX_INDEX") {
        this.vertexData0 = _gl.createBuffer();
    }



    this.createFramebufferAndRenderbuffer = function() {
        var createWebGLRenderBuffer = (function() {
            var rBuffer = _gl.createRenderbuffer();
            _gl.bindRenderbuffer(_gl.RENDERBUFFER, rBuffer);
            _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.DEPTH_COMPONENT16, this.W, this.H);
            _gl.bindRenderbuffer(_gl.RENDERBUFFER, null);
            return rBuffer;
        }).bind(this);

        this.fBuffer = _gl.createFramebuffer();
        this.renderBuffer = createWebGLRenderBuffer();
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, this.fBuffer);
        _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, this.renderBuffer);

        this.fBufferTemp = _gl.createFramebuffer();
        this.renderBufferTemp = createWebGLRenderBuffer();
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, this.fBufferTemp);
        _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, this.renderBufferTemp);
    };

    /**
     * Write WebGLTexture buffer
     * @param {Array|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} array
     * @param {Bool} [flip=false]
     * @private
     */
    var writeWebGLTextureBuffer = (function(arr, flip) {
        var ps = (function(tex, flip) {
            if(flip == false || flip == undefined)
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
            else
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);

            _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            _gl.bindTexture(_gl.TEXTURE_2D, tex);
        }).bind(this);

        var writeTexNow = (function(arr) {
            if(arr instanceof HTMLImageElement)  {
                //_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, arr.width, arr.height, 0, _gl.RGBA, _gl.UNSIGNED_BYTE, arr);
                if(this.type == 'FLOAT4')
                    _gl.texImage2D(	_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, this._supportFormat, arr);
            } else {
                //_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, this.W, this.H, 0, _gl.RGBA, this._supportFormat, arr, 0);
                _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, this.W, this.H, 0, _gl.RGBA, this._supportFormat, arr);
            }
        }).bind(this);

        var tp = (function() {
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);

            /*_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
             _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
             _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
             _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
             _gl.generateMipmap(_gl.TEXTURE_2D);*/
        }).bind(this);


        if(arr instanceof WebGLTexture) {
            this.textureData = arr;
            this.textureDataTemp = arr;
        } else {
            ps(this.textureData, flip);
            writeTexNow(arr);
            tp();

            ps(this.textureDataTemp, flip);
            writeTexNow(arr);
            tp();
        }

        _oldW = this.W;

        _gl.bindTexture(_gl.TEXTURE_2D, null);
    }).bind(this);

    /**
     * Write on buffer
     * @type Void
     * @param {Array|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} array
     * @param {Bool} [flip=false]
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     */
    this.writeBuffer = function(arr, flip, overrideDimensions) {
        var prepareArr = (function(arr) {
            if(!(arr instanceof HTMLImageElement))  {
                if(this.length.constructor === Array) {
                    this.length = this.length[0]*this.length[1];
                    this.W = this.length[0];
                    this.H = this.length[1];
                } else {
                    this.W = Math.ceil(Math.sqrt(this.length));
                    this.H = this.W;
                }

                if(this.type == 'FLOAT4') {
                    arr = (arr instanceof Float32Array) ? arr : new Float32Array(arr);

                    var l = (this.W*this.H*4);
                    if(arr.length != l) {
                        var arrt = new Float32Array(l);
                        for(var n=0; n < l; n++) {
                            arrt[n] = (arr[n] != null) ? arr[n] : 0.0;
                        }
                        arr = arrt;
                    }
                } else if(this.type == 'FLOAT') {
                    var l = (this.W*this.H*4);
                    var arrayTemp = new Float32Array(l);
                    for(var n = 0, f = this.W*this.H; n < f; n++) {
                        var idd = n*4;
                        arrayTemp[idd] = (arr[n] != null) ? arr[n] : 0.0;
                        arrayTemp[idd+1] = 0.0;
                        arrayTemp[idd+2] = 0.0;
                        arrayTemp[idd+3] = 0.0;
                    }
                    arr = arrayTemp;
                }
            }
            return arr;
        }).bind(this);


        if(overrideDimensions == undefined) {
            if(arr instanceof HTMLImageElement)
                this.length = (arr.width*arr.height);
            else
                this.length = ((this.type == "FLOAT4") ? arr.length/4 : arr.length);
        } else
            this.length = [overrideDimensions[0], overrideDimensions[1]];


        if(this.mode == "SAMPLER") {
            writeWebGLTextureBuffer(prepareArr(arr), flip);
        }
        if(this.mode == "SAMPLER" || this.mode == "ATTRIBUTE") {
            _gl.bindBuffer(_gl.ARRAY_BUFFER, this.vertexData0);
            _gl.bufferData(_gl.ARRAY_BUFFER, ((arr instanceof Float32Array) ? arr : new Float32Array(arr)), _gl.STATIC_DRAW);
        }
        if(this.mode == "VERTEX_INDEX") {
            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, this.vertexData0);
            _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arr), _gl.STATIC_DRAW);
        }

        this.createFramebufferAndRenderbuffer();
    };

    /**
     * Remove this buffer
     */
    this.remove = function() {
        if(this.mode == "SAMPLER") {
            _gl.deleteTexture(this.textureData);
            _gl.deleteTexture(this.textureDataTemp);
        }
        if(this.mode == "SAMPLER" || this.mode == "ATTRIBUTE" || this.mode == "VERTEX_INDEX") {
            _gl.deleteBuffer(this.vertexData0);
        }
    };


};