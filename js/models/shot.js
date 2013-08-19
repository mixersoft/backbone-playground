
// /js/models/photo.js

// user {{}} for underscore templates
_.templateSettings = { interpolate : /\{\{(.+?)\}\}/g };


/*
 * notes from Robert
 * - Shot wrapper around each Photo/bestshot
 * - use something like Shot.photos.fetch() to get hiddenshots
 */ 

var snappi = snappi || {};

/*
 * Model: Shot, a wrapper around bestshot/photo
 * properties
 *  - count
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
 * methods:
 * 	- rotate()
 */

snappi.Shot = snappi.Photo.extend({
	
	// backbone methods
	parse: function( response ){
		response = snappi.Photo.prototype.parse.call(this, response);	// manually call for static JSON
		// convert snappi.Photo into snappi.Shot
		response.id = response.shotId || response.photoId;
		response.bestshotId = response.photoId;
		response.count = response.shotId  ? parseInt(response.shotCount) : 1;
		response.stale = response.count>1; 
		delete response.shotCount;
		return response;
	},
	
	initialize: function(attributes, options){
		attributes = this.parse.apply(this, arguments);	// manually call for static JSON
		this.set( {
			id: attributes.id,
			bestshotId: attributes.bestshotId,
			count: attributes.count,
			stale: attributes.stale,
			scale: attributes.scale,
		});
		var position = {x:'auto',y:'auto',w:attributes.width, h:attributes.height};
		this.set('crop', this.templates.rect(position));
		snappi.Photo.prototype.initialize.apply(this, arguments);
	},
	
	// public methods
	/**
	 * 
 	 * @param String dir, [CW|CCW]
	 */
	rotate: function(dir) {
		
	}
	
})
