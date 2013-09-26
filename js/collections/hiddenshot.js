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

var _useNodeBackend = {
	dataType: 'json',
	url: function(){
		var collection = this, 
			qs = snappi.qs,	
			defaults = {
				userid: '5013ddf3-069c-41f0-b71e-20160afc480d', // manager
				// ownerid: "51cad9fb-d130-4150-b859-1bd00afc6d44", // melissa-ben
			},
			request = _.defaults({page:1, perpage:999}, qs, defaults);
		var url = _.template('/shot/<%=id%>.json?', collection.shot_core)+$.param(request);
		return url;
	},
	parse: function(response){
		var collection = this,
			parsed = collection.parseShot_Assets(response), // from mixin
			photos = [],
			bestshotId = collection.shot_core.bestshot.get('photoId');
			
		_.each(parsed, function(v, k, l) {
			// only Photos here, no Shots
			if ( v.photoId !== bestshotId){
				v.shotId = collection.shot_core.id; 
				v.bestshotId = bestshotId; 
				photos.push(new models.Photo(v));
			}
		}, collection);
		var shot_extras = collection.parseShotExtras_Assets(response.assets, bestshotId);
		collection.shot_core = _.extend(collection.shot_core, shot_extras);
		collection.shot_core.stale = false;
		if (collection.shot_core.bestshot.get('id') !== collection.shot_core.id) {
			throw "ERROR: current bestshot does not match shot_extras result";
		}
		$('body').removeClass('wait');
		return photos;		
	},
}
var _useCakephpBackend = {
	dataType: 'jsonp',
	url: function(){
		var collection = this, 
			qs = snappi.qs,	
			hostname = collection.hostname();
		var data = _.extend({hostname: hostname}, collection.shot_core);
		var url = collection.templates['url_shot'](data);
		return url;
	},
	parse: function(response){
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
		this.parseShotExtras_CC(response);
		var shot_extras = response.response.castingCall.shot_extras[this.shot_core.id];
		this.shot_core = _.extend(this.shot_core, shot_extras);
		this.shot_core.stale = false;
		if (this.shot_core.bestshot.get('id') !== this.shot_core.id) {
			throw "ERROR: current bestshot does not match shot_extras result";
		}
		$('body').removeClass('wait');
		return photos;
	},
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
		url_shot: _.template('http://<%=hostname%>/photos/hiddenShots/<%=id%>/Usershot/min:typeset/.json'),
	},
	
	url: function(){
		var collection = this;
		return this.backend.url.apply(collection, arguments);
	},
	
	initialize: function(models, options){
		// HACK: support for either node or cakephp backend
		this.backend = snappi.qs.backend=='node' ? _useNodeBackend : _useCakephpBackend;
		this.dataType = this.backend.dataType;
		// end
		
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
		this.listenTo(this, 'request', this.request);
	},
	
	// stack: Collection.parse > mixin.parseShot > Shot.initialize > Shot.parse
	parse: function( response ){
		var collection = this;
		return this.backend.parse.apply(collection, arguments);
	},
	request: function(collection, xhr, queryOptions){
		$('body').addClass('wait');
	},
	
};


// put it all together at the bottom
extend(HiddenshotCollection);

})( snappi.collections, snappi.models, snappi.mixins );