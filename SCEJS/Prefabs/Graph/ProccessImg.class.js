var ProccessImg = function(jsonIn) {
    var stackNodesImg = jsonIn.stackNodesImg;
    var drawedImages = 0;
    var output = {
        "nodesImg": null,
        "nodesImgCrosshair": null};

    var NODE_IMG_WIDTH = jsonIn.NODE_IMG_WIDTH;
    var NODE_IMG_COLUMNS = jsonIn.NODE_IMG_COLUMNS;
    var NODE_IMG_SPRITE_WIDTH = NODE_IMG_WIDTH/NODE_IMG_COLUMNS;

    var nodesImgMask = jsonIn.nodesImgMask;
    var datMask = new Utils().getUint8ArrayFromHTMLImageElement(nodesImgMask);
    var nodesImgCrosshair = jsonIn.nodesImgCrosshair;
    var datCrosshair = new Utils().getUint8ArrayFromHTMLImageElement(nodesImgCrosshair);

    var canvasNodeImg = document.createElement('canvas');
    canvasNodeImg.width = NODE_IMG_WIDTH;
    canvasNodeImg.height = NODE_IMG_WIDTH;
    var ctxNodeImg = canvasNodeImg.getContext('2d');

    var canvasNodeImgCrosshair = document.createElement('canvas');
    canvasNodeImgCrosshair.width = NODE_IMG_WIDTH;
    canvasNodeImgCrosshair.height = NODE_IMG_WIDTH;
    var ctxNodeImgCrosshair = canvasNodeImgCrosshair.getContext('2d');

    var canvasNodeImgTMP = document.createElement('canvas');
    canvasNodeImgTMP.width = NODE_IMG_SPRITE_WIDTH;
    canvasNodeImgTMP.height = NODE_IMG_SPRITE_WIDTH;
    var ctxNodeImgTMP = canvasNodeImgTMP.getContext('2d');


    var generateAll = (function() {
        var drawOnAtlas = (function(currStack, ctx, newImgData) {
            var get2Dfrom1D = (function(/*Int*/ idx, /*Int*/ columns) {
                var n = idx/columns;
                var row = parseFloat(parseInt(n));
                var col = new Utils().fract(n)*columns;

                return {
                    "col": col,
                    "row": row};
            }).bind(this);

            var readAll = (function(onend) {
                var pasteImg = (function(onend, imgname, img) {
                    output[imgname] = img;
                    if(output.nodesImg != null && output.nodesImgCrosshair != null)
                        onend(output);
                }).bind(this, onend);

                new Utils().getImageFromCanvas(canvasNodeImg, (function(imgAtlas) {
                    pasteImg("nodesImg", imgAtlas);
                }).bind(this));
                new Utils().getImageFromCanvas(canvasNodeImgCrosshair, (function(imgAtlas) {
                    pasteImg("nodesImgCrosshair", imgAtlas);
                }).bind(this));
            }).bind(this, jsonIn.onend);

            new Utils().getImageFromCanvas( new Utils().getCanvasFromUint8Array(newImgData, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH), (function(currStack, ctx, imgB) {
                // draw image on atlas
                var loc = get2Dfrom1D(currStack.locationIdx, NODE_IMG_COLUMNS);
                ctx.drawImage(imgB, loc.col*NODE_IMG_SPRITE_WIDTH, loc.row*NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH);

                drawedImages++;
                if(drawedImages == (stackNodesImg.length*2))
                    readAll();
            }).bind(this, currStack, ctx));
        }).bind(this);

        for(var n=0; n < stackNodesImg.length; n++) {
            var currStack = stackNodesImg[n];
            var newImgData = stackNodesImg[n].image;

            // masked image
            for(var nb=0; nb < datMask.length/4; nb++) {
                var idx = nb*4;
                if(newImgData[idx+3] > 0) newImgData[idx+3] = datMask[idx+3];
            }
            drawOnAtlas(currStack, ctxNodeImg, newImgData);

            // crosshair image
            for(var nb=0; nb < datCrosshair.length/4; nb++) {
                var idx = nb*4;

                newImgData[idx] = ((datCrosshair[idx]*datCrosshair[idx+3]) + (newImgData[idx]*(255-datCrosshair[idx+3])))/255;
                newImgData[idx+1] =( (datCrosshair[idx+1]*datCrosshair[idx+3]) + (newImgData[idx+1]*(255-datCrosshair[idx+3])))/255;
                newImgData[idx+2] = ((datCrosshair[idx+2]*datCrosshair[idx+3]) + (newImgData[idx+2]*(255-datCrosshair[idx+3])))/255;
                newImgData[idx+3] = ((datCrosshair[idx+3]*datCrosshair[idx+3]) + (newImgData[idx+3]*(255-datCrosshair[idx+3])))/255;
            }
            drawOnAtlas(currStack, ctxNodeImgCrosshair, newImgData);
        }
    }).bind(this);

    for(var n=0; n < stackNodesImg.length; n++) {
        var currStack = stackNodesImg[n];
        var image = new Image();
        image.onload = (function(image, currStack) {
            ctxNodeImgTMP.clearRect(0, 0, NODE_IMG_SPRITE_WIDTH, NODE_IMG_SPRITE_WIDTH);
            var quarter = NODE_IMG_SPRITE_WIDTH/4;
            ctxNodeImgTMP.drawImage(image, 0, 0, image.width, image.height, quarter, quarter, NODE_IMG_SPRITE_WIDTH/2, NODE_IMG_SPRITE_WIDTH/2);

            new Utils().getImageFromCanvas(canvasNodeImgTMP, (function(currStack, img) {
                currStack.image = new Utils().getUint8ArrayFromHTMLImageElement( img );

                var allImg = true;
                for(var nb=0; nb < stackNodesImg.length; nb++) {
                    if(stackNodesImg[nb].image == null) {
                        allImg = false;
                        break;
                    }
                }

                if(allImg == true)
                    generateAll();
            }).bind(this, currStack));
        }).bind(this, image, currStack);
        image.src = currStack.url;
    }
};