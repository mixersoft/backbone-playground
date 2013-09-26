// /js/models/photo.js
(function ( models ) {
	

/*
 * Model: Photo
 * properties
 * 	- src
 * 	- dateTaken
 *  - ts	// unixtime
 *  - W		// src.W
 * 	- H		// src.H
 * 	- origW
 * 	- origH
 *  - exifOrientation
 * 	- orientationLabel
 * 	- caption
 *  - score
 * 	- hasMany Rating
 * 	- hasMany Shot
 * methods:
 * 	- rotate()
 */

models.Photo = Backbone.Model.extend({
	defaults: {
		
	}, 
	
	urlRoot: function() {
		// return '/assets/restapi';
		return 'http://'+snappi.mixins.Href.hostname()+'/assets/restapi';	
	},	
	
	templates: {
		url_photo: _.template('http://'+snappi.mixins.Href.hostname()+'/photos/home/<%=id%>/.json'),
		url_rest: _.template('http://'+snappi.mixins.Href.hostname()+'/assets/rest:1'),
		rect: _.template('top:<%=y%>px;left:<%x%>px;width:<%w%>px;height:<%h%>px'),
	},
	
	// helper functions
	helper: {
		scaleImg: function(scale, o) {
			try {
				var scaled = {
					w: o.width*scale,
					h: o.height*scale,
				}
				scaled.x = (scaled.w - o.width)/2;
				scaled.y = (scaled.h - o.height)/2;
			} catch (ex) {
				return {w:o.width, h:o.height, x:0, y:0 };
			}
			return scaled;
		},
	},
	
	// backbone methods
	parse: function( response ){
		response.id = response.photoId;
		if (!response.origW) response.origW = response.W;
		if (!response.origH) response.origH = response.H;
		return response;
	},
	
	initialize: function(attributes, options){
		attributes = this.parse.apply(this, arguments);	// manually call for static JSON
		this.set( attributes );
		this.listenTo(this, 'request', this.request);
		this.listenTo(this, 'change', this.change);
	},
	sync: function(method, model, options) {
		options = _.extend(options,
			{emulateHTTP: true,
			 emulateJSON: true,
			 crossDomain: true,
			 });
		var useRestApi,
			cakeAttrs = {
			Asset:{id: model.get('id')}
		} 
		switch (method) {
			case 'patch': case 'put': // append Wo attrs if necessary
				cakeAttrs['Asset'] = _.extend(cakeAttrs['Asset'], options.attrs)
				cakeAttrs = this._getAsWorkorder(cakeAttrs);
			break;
		}
		if (useRestApi=true) options.attrs = cakeAttrs;  			// REST PUT
		else options.data = this._formatForCakePhp(cakeAttrs);	// Cake POST
		var beforeSend = options.beforeSend;
		options.beforeSend = function(xhr, options){
			if (!useRestApi) options.url += '/.json';	// for CakePhp form
			if (beforeSend) return beforeSend.apply(this, arguments);
		}
	    Backbone.sync(method, model, options);
	},
	_formatForCakePhp : function(attrs) {
		var key, formatted = {};
		for (var m in attrs) {
			for (var p in attrs[m]) {
				key = _.template('data[<%=model%>][<%=prop%>]', {model:m, prop:p});
				formatted[key] = attrs[m][p]; 
			}
		}
		return formatted;
	},
	_getAsWorkorder : function(attrs){
		try {
			var woAttrs = {},
				type = ['tw','TasksWorkorder','wo','Workorder'].indexOf(snappi.qs.type.split(':')[0]);	
			switch (type){
				case 0: 
				case 1:
					 attrs.Workorder = {
					 	type: 'TasksWorkorder',
					 	id: snappi.qs.type.split(':')[1],	
					 }
					break;
				case 2: 
				case 3:
					 attrs.Workorder = {
					 	type: 'Workorder',
					 	id: snappi.qs.type.split(':')[1],	
					 }
					break;
			}
		} catch (ex) {
			// not a workorder
		}
		return attrs;
	},
	// public methods
	rating: function(value){
		// this.model.set({rating: value});	// does not trigger sync()
		var attrs = {
			rating: value,
		}
		this.save(attrs, 	// trigger sync()
			{
				patch: true, 
				success: function(){
					console.info('restapi success');
				},
				error: function(){
					console.warn('restapi error');
				},
				
			});
	},
	/**
	 * 
 	 * @param String dir, [CW|CCW]
	 */
	rotate: function(dir) {
		
	},
	change: function(model, xhr){
		var check; // Photo.change;
	},
	request: function(model, xhr, attrs){
		var check; // Photo.request
	},
	
})


})( snappi.models );