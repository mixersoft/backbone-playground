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
	
	templates: {
		url_photo: _.template('http://'+snappi.mixins.Href.hostname()+'/photos/home/<%=id%>/.json'),
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
	},
	
	// public methods
	/**
	 * 
 	 * @param String dir, [CW|CCW]
	 */
	rotate: function(dir) {
		
	}
	
})


})( snappi.models );