// /js/models/shot.js

(function ( models , HiddenshotCollection) {
	

// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	var options = _.extend({}, 
		// add mixins
		classDef
	);
	
	models.Shot = models.Photo.extend(
		options
	);
	
	_overloadClassAttrs(models.Shot, models.Photo, ['templates']);
}	


/*
 * Model: Shot, a wrapper around bestshot/photo
 * properties
 *  - bestshotId
 *  - count
 *  - stale
 *  Photo attributes (inherited)
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
 *  - fetchHidden()
 * 	- Photo.rotate()
 * 
 */

var Shot = {
	
	url: function(options){
		options = options || this.toJSON();
		return this.templates['url_shot'](options);
	},
	
	templates: {
		url_shot: _.template('http://dev.snaphappi.com/photos/hiddenShots/<%=shotId%>/Usershot/.json'),
	},
	
	// backbone methods
	// stack: Collection.parse > mixin.parseShot > Shot.initialize > Shot.parse
	parse: function( response ){
		response = models.Photo.prototype.parse.call(this, response);	// manually call for static JSON
		// convert models.Photo into snappi.Shot
		response.id = response.shotId || response.photoId;
		response.bestshotId = response.photoId;
		response.count = response.shotId  ? parseInt(response.shotCount) : 1;
		// response.stale = response.count>1; // moved to this.hiddenshot.shot_core.stale 
		delete response.shotCount;
		return response;
	},
	
	initialize: function(attributes, options){
		attributes = this.parse.apply(this, arguments);	// manually call for static JSON
		// var position = {x:'auto',y:'auto',w:attributes.width, h:attributes.height};
		// this.set('crop', this.templates.rect(position));
		models.Photo.prototype.initialize.call(this, attributes, options);
		this.set( {
			bestshotId: attributes.bestshotId,
			count: attributes.count,
			stale: attributes.stale,
			// scale: attributes.scale,
		});
		// add HiddenshotCollection
		this.set( {
			hiddenshot: new HiddenshotCollection([this])
		})
	},
};

/*
 *  protected methods
 */
var _overloadClassAttrs = function(childClass, parentClass, attrs) {
	for (var i in attrs) {
		childClass.prototype[attrs[i]] = _.extend(parentClass.prototype[attrs[i]] || {}, childClass.prototype[attrs[i]]);
	} 
}



// put it all together at the bottom
extend(Shot);

})( snappi.models , snappi.collections.HiddenshotCollection);