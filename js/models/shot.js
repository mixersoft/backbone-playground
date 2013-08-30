// /js/models/shot.js

(function ( models ) {
	

// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	var options = _.extend({}, 
		// add mixins
		classDef
	);
	
	// merge Shot.properties with parent properties, add to Shot.prototype
	var prototypeAttrs = ['templates'],
		forPrototype = {};
	for (var i in prototypeAttrs) {
		forPrototype[prototypeAttrs[i]] = classDef[prototypeAttrs[i]];
		delete classDef[prototypeAttrs[i]];
	} 
	
	models.Shot = models.Photo.extend(
		options
	);
	
	var parentClass = models.Photo;
	for (var i in forPrototype) {
		models.Shot.prototype[i] = _.extend(parentClass.prototype[i] || {}, forPrototype[i]);
	} 
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
		response.stale = response.count>1; 
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
	},
	/**
	 * 
 	 * @param {Object} options.success
	 */
	fetchHiddenShots: function(options){
		if (this.count==1) return;
		
		options = options ? _.clone(options) : {};
		var success = options.success;
		var model = this;
		options.success = function(resp) {
			model.hiddenshots = hiddenshots;
			if (success) success(model, resp, options);
			model.stale = false;
			model.trigger('fetchedHiddenshots', model, resp, options);	// ThumbnailView is listening
		};
		wrapError(model, options);
		return model.fetch(options);
	},
	
};


/*
 *  protected methods
 */
// Wrap an optional error callback with a fallback error event.
var wrapError = function (model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
};

// put it all together at the bottom
extend(Shot);

})( snappi.models );