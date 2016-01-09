/**
* @class
* @constructor

* @param	{Object} jsonIn
* 	@param {String} jsonIn.id
* 	@param {String} jsonIn.paneltitle
* 	@param {String} [jsonIn.html=""]
*   @param {Function} [jsonIn.ondragstart= undefined]
*   @param {Function} [jsonIn.ondragstop=undefined]
*   @param {Function} [jsonIn.onresizestart=undefined]
*   @param {Function} [jsonIn.onresizestop=undefined]
*/
StormPanel = function(jsonIn) {
	//************************************************
	// PRIVATE METHODS
	//************************************************
	this.appendStringChild = function(str, target, location) {
		var loc = (location != undefined) ? location : "end";
		var parser = new DOMParser();
		var e = parser.parseFromString(str, "text/html");
		
		if(loc == "end") 
			target.appendChild(e.body.firstChild);
		else 
			target.insertBefore(e.body.firstChild, target.firstChild);
		//return e.body.firstChild;
	};
	
	this.upZindex = function() {
		$(".SECmenu").css('z-index','0');
		$("#"+this.strAttrID+"_MENU").css('z-index','99');
	};
	
	this.updatePanel = function() {
		var left = (localStorage[this.strAttrID+'_left'] != undefined) ? localStorage[this.strAttrID+'_left'] : (screen.availWidth/4)+"px";
		var top = (localStorage[this.strAttrID+'_top'] != undefined) ? localStorage[this.strAttrID+'_top'] : (screen.availHeight/6)+"px";
		var width = (localStorage[this.strAttrID+'_width'] != undefined) ? localStorage[this.strAttrID+'_width'] : "300px";
		var height = (localStorage[this.strAttrID+'_height'] != undefined) ? localStorage[this.strAttrID+'_height'] : "auto";
		
		var e = document.getElementById(this.strAttrID+'_MENU');
		e.style.position = "absolute";
		e.style.left = left;
		e.style.top = top;
		e.style.width = width;
		e.style.height = height;
		
		//$("#"+this.strAttrID+"_MENU").css({width: ui.size.width, height: ui.size.height});
		$("#"+this.strAttrID+"_MENU .SECmenuContent").css({	"height": (parseInt(height)-$("#"+this.strAttrID+"_MENU .SECmenuTitle").height()-10)+'px'});
	};
	
	//************************************************
	// ATTRIBUTES
	//************************************************
	this.strAttrID = jsonIn.id;
	var paneltitle = jsonIn.paneltitle;
	htmlStr = (jsonIn.html != undefined) ? jsonIn.html : "";
	this.ondragstart_callback = (jsonIn != undefined && jsonIn.ondragstart != undefined) ? jsonIn.ondragstart : undefined;
	this.ondragstop_callback = (jsonIn != undefined && jsonIn.ondragstop != undefined) ? jsonIn.ondragstop : undefined;
	this.onresizestart_callback = (jsonIn != undefined && jsonIn.onresizestart != undefined) ? jsonIn.onresizestart : undefined;
	this.onresizestop_callback = (jsonIn != undefined && jsonIn.onresizestop != undefined) ? jsonIn.onresizestop : undefined;
	
	this.timeout_onresizestop;
	
	var str = ''+
		'<div id="'+this.strAttrID+'_MENU" class="SECmenu SECround5">'+ 
			'<div class="SECround5TL SECround5TR SECmenuTitle">'+
				'<div class="SECmenuTitleText">'+paneltitle+'</div>'+
				'<div class="SECmenuTitleClose"><div class="SECmenuTitleCloseImg"></div></div>'+
			'</div>'+
			'<div id="'+this.strAttrID+'_content" class="SECround5BL SECround5BR SECmenuContent">'+ 
				
			'</div>'+
		'</div>';
	this.appendStringChild(str, document.getElementsByTagName("body")[0], "init");
	
	if(htmlStr == undefined) {
		var e = document.getElementById(this.strAttrID);
		e.parentNode.removeChild(e);
		document.getElementById(this.strAttrID+'_content').appendChild(e);  
	} else document.getElementById(this.strAttrID+'_content').innerHTML = htmlStr;  
	
	//this.$ = $("#"+this.strAttrID+"_MENU");
	//this.De = DGE(this.strAttrID+"_MENU");
	
	//$(document).ready((function() {				
	//}).bind(this));
	
	$("#"+this.strAttrID+"_MENU").draggable({
		"start": (function(event, ui) {
			if(this.ondragstart_callback != undefined) this.ondragstart_callback(); 
		}).bind(this), "stop": (function(event, ui) {
			localStorage[this.strAttrID+'_left'] = ui.position.left+"px";
			localStorage[this.strAttrID+'_top'] = ui.position.top+"px";
			if(this.ondragstop_callback != undefined) this.ondragstop_callback();
	}).bind(this)});
	
	$("#"+this.strAttrID+"_MENU").resizable({resize: (function(event, ui) {
		localStorage[this.strAttrID+'_width'] = ui.size.width+"px";
		localStorage[this.strAttrID+'_height'] = ui.size.height+"px";
		this.updatePanel();	
		
		if(this.onresizestart_callback != undefined) this.onresizestart_callback();
		
		clearTimeout(this.timeout_onresizestop);
		this.timeout_onresizestop = setTimeout((function() {
			if(this.onresizestop_callback != undefined) this.onresizestop_callback();
		}).bind(this), 100);
		
	}).bind(this)});
	
	
	
	$("#"+this.strAttrID+"_MENU .SECmenuTitle").on('mousedown', (function() {
		this.upZindex();    
	}).bind(this));	
	
	$("#"+this.strAttrID+"_MENU .SECmenuTitleCloseImg").on('mousedown', (function(e) {
		e.stopPropagation(); 
	}).bind(this));		
	
	$("#"+this.strAttrID+"_MENU .SECmenuTitleCloseImg").on('click', (function(e) {
		var e = document.getElementById(this.strAttrID+'_MENU');
		e.style.display = "none";
	}).bind(this));	
	
	$("#"+this.strAttrID+"_MENU .SECmenuContent").on('mousedown', (function(e) {
		e.stopPropagation();
		
		this.upZindex();
	}).bind(this));	
	
	
};

StormPanel.prototype.show = function() {
	var e = document.getElementById(this.strAttrID+'_MENU');
	e.style.display = "block";
	
	this.updatePanel();
	
	this.upZindex();
};

