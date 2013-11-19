// /js/models/hiddenshot.js

(function ( models ) {
	

// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	var options = _.extend({}, 
		// add mixins
		classDef
	);
	
	models.Hiddenshot = models.Photo.extend(
		options
	);
	
	_overloadClassAttrs(models.Hiddenshot, models.Photo);
}	


/*
 * Model: Hiddenshot, a subclass of Photo with extra shot attrs
 * properties
 *	- shotId
 *  - bestshotId
 *	- belongsTo Shot
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
 * 
 */

var Hiddenshot = {
	
	// NOTE: there is no sync method for Hiddenshot, access from model.Shot instead
	// url: {}, 
	// templates: {},
	// parse: {},

	initialize: function(attributes, options){
		attributes = this.parse.apply(this, arguments);	
		models.Photo.prototype.initialize.call(this, attributes, options);
		var shotId = attributes.shotId || options.shotId;
		var bestshotId = attributes.bestshotId || options.bestshotId;
		if (shotId && bestshotId) {
			this.set( {
				shotId: shotId,
				bestshotId: bestshotId,
			}, {silent: true});
		} else {
			throw "model.Hiddenshot error: bestshot not found ";
		}
	},
};

/*
 *  protected methods
 */
var _overloadClassAttrs = function(childClass, parentClass, attrs) {
	_.each(attrs, function(e,i,l) {
		childClass.prototype[e] = _.extend(parentClass.prototype[e] || {}, childClass.prototype[e]);
	}); 
}



// put it all together at the bottom
extend(Hiddenshot);

})( snappi.models );