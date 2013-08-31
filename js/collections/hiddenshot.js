// /js/collections/hidddenshot.js

(function ( collections, models, mixins ) {
	
// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	var options = _.extend({}, 
		mixins.RestApi,
		mixins.Href, 
		classDef
	);
	collections.HiddenshotCollection = Backbone.Collection.extend(
		options
	);
}

/*
 * Collection: HiddenshotCollection
 * 	constructor called by models.Shot.hiddenshot = new HiddenShotCollection([this])
 * properties:
 * methods:
 */
var HiddenshotCollection = {
	
	model: models.Photo,
	
	templates: {
		url_shot: _.template('http://dev.snaphappi.com/photos/hiddenShots/<%=id%>/Usershot/.json'),
	},
	
	url: function(){
		$('body').addClass('wait');
		return this.templates['url_shot'](this.shot_core);
	},
	
	initialize: function(models, options){
		// HiddenshotCollection attr
		if (models.length==1 && models[0] instanceof snappi.models.Shot) {
			// assume the 1st model is bestshot
			var m = models[0];
			this.shot_core = {
				id: m.get('shotId'),
				count: m.get('shotCount'),
				bestshot: m,
				active: null,		// don't get this values until shot_extras
				owner_id: null,
				priority: null,
				stale: true,
			}
		} else {
			throw "Hiddenshot Collection must be initialized with exactly 1 models.Shot";
		}
	},
	
	// stack: Collection.parse > mixin.parseShot > Shot.initialize > Shot.parse
	parse: function( response ){
		var parsed = this.parseShot(response.response.castingCall), // from mixin
			photos = []
			bestshotId = this.shot_core.bestshot.get('photoId');
		_.each(parsed, function(v, k, l) {
			// only Photos here, no Shots
			if ( v.photoId != bestshotId){
				v.shotId = this.shot_core.id; 
				v.bestshotId = bestshotId; 
				photos.push(new models.Photo(v));
			}
		}, this);
		this.parseShotExtras(response);
		var shot_extras = response.response.castingCall.shot_extras[this.shot_core.id];
		this.shot_core = _.extend(this.shot_core, shot_extras);
		this.shot_core.stale = false;
		if (this.shot_core.bestshot.get('id') !== this.shot_core.id) {
			throw "ERROR: current bestshot does not match shot_extras result";
		}
		$('body').removeClass('wait');
		return photos;
	},
	
};


// put it all together at the bottom
extend(HiddenshotCollection);

})( snappi.collections, snappi.models, snappi.mixins );