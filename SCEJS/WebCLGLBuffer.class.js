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

    if(this.mode == "SAMPLER") {
        this.textureData = _gl.createTexture();
        this.textureDataTemp = _gl.createTexture();
    }
    if(this.mode == "SAMPLER" || this.mode == "ATTRIBUTE" || this.mode == "VERTEX_INDEX") {
        this.vertexData0 = _gl.createBuffer();
    }


    /**
     * Write WebGLTexture buffer
     * @param {Array|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} array
     * @param {Bool} [flip=false]
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @private
     */
    var writeWebGLTextureBuffer = (function(arr, flip, overrideDimensions) {
        var tp = (function() {
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
            _gl.bindTexture(_gl.TEXTURE_2D, null);
        }).bind(this);
        var writeTexNow = (function(arr) {
            if(arr instanceof HTMLImageElement)  {
                //texImage2D(			target, 			level, 	internalformat, 	format, 		type, 			TexImageSource);
                if(this.type == 'FLOAT4') {
                    _gl.texImage2D(	_gl.TEXTURE_2D, 0, 		_gl.RGBA, 		_gl.RGBA, 	this._supportFormat, 	arr);
                    tp();
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
                    _gl.texImage2D(_gl.TEXTURE_2D, 	0, 		_gl.RGBA, 		this.W, this.H, 0, 	_gl.RGBA, 	this._supportFormat, 	arrt);
                    tp();
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
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, this.W, this.H, 0, _gl.RGBA, this._supportFormat, arr);
                    tp();
                }
            }
        }).bind(this);



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
    }).bind(this);

    /**
     * Write WebGL buffer
     * @param {Array|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} array
     * @param {Bool} [flip=false]
     * @private
     */
    var writeWebGLBuffer = (function(arr, flip) {
        if(this.mode == "VERTEX_INDEX") { // "VERTEX_INDEX" ELEMENT_ARRAY_BUFFER
            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, this.vertexData0);
            _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arr), _gl.STATIC_DRAW);
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
            _gl.bufferData(_gl.ARRAY_BUFFER, arrt, _gl.STATIC_DRAW);
        }
    }).bind(this);

    /**
     * Write on buffer
     * @type Void
     * @param {Array|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} array
     * @param {Bool} [flip=false]
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     */
    this.writeBuffer = function(arr, flip, overrideDimensions) {
        if(overrideDimensions == undefined) {
            if(arr instanceof HTMLImageElement)
                this.length = (arr.width*arr.height);
            else
                this.length = ((this.type == "FLOAT4") ? arr.length/4 : arr.length);
        } else
            this.length = [overrideDimensions[0], overrideDimensions[1]];

        this.W = Math.ceil(Math.sqrt(this.length));
        if(new WebCLGLUtils().isPowerOfTwo(this.W) == false)
            this.W = new WebCLGLUtils().nextHighestPowerOfTwo(this.W);
        this.H = this.W;


        if(this.mode == "SAMPLER") {
            writeWebGLTextureBuffer(arr, flip, overrideDimensions);
        }
        if(this.mode == "SAMPLER" || this.mode == "ATTRIBUTE" || this.mode == "VERTEX_INDEX") {
            writeWebGLBuffer(arr, flip);
        }
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