/** 
* WebCLGLBuffer
* @class
 * @param {WebGLRenderingContext} gl
 * @param {String} [type="FLOAT"]
 * @param {boolean} [linear=true]
 * @param {String} [mode="SAMPLER"] "SAMPLER", "ATTRIBUTE", "VERTEX_INDEX"
*/
var WebCLGLBuffer = function(gl, type, linear, mode) {
    this._gl = gl;

    this.type = (type != undefined) ? type : 'FLOAT';
    this._supportFormat = this._gl.FLOAT;

    this.linear = (linear != undefined) ? linear : true;
    this.mode = (mode != undefined) ? mode : "SAMPLER";

    this.W = null;
    this.H = null;

    this.textureData = null;
    this.textureDataTemp = null;
    this.vertexData0 = null;

    this.fBuffer = null;
    this.renderBuffer = null;
    this.fBufferTemp = null;
    this.renderBufferTemp = null;

    this._oldW = 0;

    if(this.mode == "SAMPLER") {
        this.textureData = this._gl.createTexture();
        this.textureDataTemp = this._gl.createTexture();
    }
    if(this.mode == "SAMPLER" || this.mode == "ATTRIBUTE" || this.mode == "VERTEX_INDEX") {
        this.vertexData0 = this._gl.createBuffer();
    }

    /**
     * createFramebufferAndRenderbuffer
     */
    this.createFramebufferAndRenderbuffer = function() {
        var createWebGLRenderBuffer = (function() {
            var rBuffer = this._gl.createRenderbuffer();
            this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, rBuffer);
            this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, this.W, this.H);
            this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, null);
            return rBuffer;
        }).bind(this);

        this.fBuffer = this._gl.createFramebuffer();
        this.renderBuffer = createWebGLRenderBuffer();
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this.fBuffer);
        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, this.renderBuffer);

        this.fBufferTemp = this._gl.createFramebuffer();
        this.renderBufferTemp = createWebGLRenderBuffer();
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this.fBufferTemp);
        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, this.renderBufferTemp);
    };

    /**
     * Write WebGLTexture buffer
     * @param {Array<float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} arr
     * @param {boolean} [flip=false]
     */
    this.writeWebGLTextureBuffer = function(arr, flip) {
        var ps = (function(tex, flip) {
            if(flip == false || flip == undefined)
                this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, false);
            else
                this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, true);

            this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            this._gl.bindTexture(this._gl.TEXTURE_2D, tex);
        }).bind(this);

        var writeTexNow = (function(arr) {
            if(arr instanceof HTMLImageElement)  {
                //this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, arr.width, arr.height, 0, this._gl.RGBA, this._gl.UNSIGNED_BYTE, arr);
                if(this.type == 'FLOAT4')
                    this._gl.texImage2D(	this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._supportFormat, arr);
            } else {
                //this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this.W, this.H, 0, this._gl.RGBA, this._supportFormat, arr, 0);
                this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this.W, this.H, 0, this._gl.RGBA, this._supportFormat, arr);
            }
        }).bind(this);

        var tp = (function() {
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

            /*this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
             this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR_MIPMAP_NEAREST);
             this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
             this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
             this._gl.generateMipmap(this._gl.TEXTURE_2D);*/
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

        this._oldW = this.W;

        this._gl.bindTexture(this._gl.TEXTURE_2D, null);
    };

    /**
     * Write on buffer
     * @param {Array<float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} arr
     * @param {boolean} [flip=false]
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
            this.writeWebGLTextureBuffer(prepareArr(arr), flip);
        }
        if(this.mode == "SAMPLER" || this.mode == "ATTRIBUTE") {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.vertexData0);
            this._gl.bufferData(this._gl.ARRAY_BUFFER, ((arr instanceof Float32Array) ? arr : new Float32Array(arr)), this._gl.STATIC_DRAW);
        }
        if(this.mode == "VERTEX_INDEX") {
            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.vertexData0);
            this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arr), this._gl.STATIC_DRAW);
        }

        this.createFramebufferAndRenderbuffer();
    };

    /**
     * Remove this buffer
     */
    this.remove = function() {
        if(this.mode == "SAMPLER") {
            this._gl.deleteTexture(this.textureData);
            this._gl.deleteTexture(this.textureDataTemp);
        }
        if(this.mode == "SAMPLER" || this.mode == "ATTRIBUTE" || this.mode == "VERTEX_INDEX") {
            this._gl.deleteBuffer(this.vertexData0);
        }
    };

};