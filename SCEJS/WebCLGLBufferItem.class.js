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

    this.length = length; // maintain this value for VERTEX_INDEX

    this.W = Math.ceil(Math.sqrt(length));
    if(new WebCLGLUtils().isPowerOfTwo(this.W) == false)
        this.W = new WebCLGLUtils().nextHighestPowerOfTwo(this.W);
    this.H = this.W;

    this.type = (type != undefined) ? type : 'FLOAT';
    this._supportFormat = _gl.FLOAT;

    this.offset = (offset != undefined) ? offset : 0;
    this.linear = (linear != undefined && linear == true) ? true : false;

    var inData; // enqueueWriteBuffer user data

    this.mode = (mode != undefined) ? mode : "SAMPLER"; // "SAMPLER", "ATTRIBUTE", "VERTEX_INDEX"

    /**
     * initialize
     */
    this.initialize = function() {
        if(this.mode == "SAMPLER") {
            this.textureData = createWebGLTextureBuffer();
            this.textureDataTemp = createWebGLTextureBuffer();
            this.vertexData0 = createWebGLBuffer();
        }
        if(this.mode == "ATTRIBUTE" || this.mode == "VERTEX_INDEX") {
            this.vertexData0 = createWebGLBuffer();
        }
    };

    /**
     * createWebGLTextureBuffer
     * @private
     */
    var createWebGLTextureBuffer = (function() {
        var textureData = _gl.createTexture();
        _gl.bindTexture(_gl.TEXTURE_2D, textureData);
        _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, this.W,this.H, 0, _gl.RGBA, this._supportFormat, null);

        //if(this.linear != undefined && this.linear == true) {
            //_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR);
            //_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
            //_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);

            //_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
            //_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
            //_gl.generateMipmap(_gl.TEXTURE_2D);
        //} else {
            //_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
            //_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
            //_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
            //_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
        //}
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);

        _gl.bindTexture(_gl.TEXTURE_2D, null);

        return textureData;
    }).bind(this);

    /**
     * createWebGLBuffer
     * @private
     */
    var createWebGLBuffer = (function() {
        var vertexData = _gl.createBuffer();

        return vertexData;
    }).bind(this);

    /**
     * writeTexNow
     * @private
     */
    var writeTexNow = (function(arr) {
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
    }).bind(this);

    /**
     * Write WebGLTexture buffer
     * @param {Array|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} array
     * @param {Bool} [flip=false]
     */
    this.writeWebGLTextureBuffer = function(arr, flip) {
        inData = arr;

        if(arr instanceof WebGLTexture) {
            this.textureData = arr;
            this.textureDataTemp = arr;
        } else {
            if(flip == false || flip == undefined)
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
            else
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);

            _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            _gl.bindTexture(_gl.TEXTURE_2D, this.textureData);

            writeTexNow(arr);
            _gl.bindTexture(_gl.TEXTURE_2D, this.textureDataTemp);
            writeTexNow(arr);
        }

        //if(this.linear) _gl.generateMipmap(_gl.TEXTURE_2D);
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
        if(this.mode == "SAMPLER") {
            _gl.deleteTexture(this.textureData);
            _gl.deleteTexture(this.textureDataTemp);
            _gl.deleteBuffer(this.vertexData0);
        }
        if(this.mode == "ATTRIBUTE" || this.mode == "VERTEX_INDEX") {
            _gl.deleteBuffer(this.vertexData0);
        }
    };
};


