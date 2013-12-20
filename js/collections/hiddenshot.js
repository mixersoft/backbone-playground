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
		url_shot: _.template('http://<%=hostname%>/photos/hiddenShots/<%=id%>/Usershot/min:typeset/.json'),
	},
	
	url: function(){
		var collection = this;
		return this.backend.url.apply(collection, arguments);
	},
	
	initialize: function(models, options){
		// HACK: support for either node or cakephp backend, see Backend static class
		// this.backend = snappi.qs.backend=='node' ? _useNodeBackend : _useCakephpBackend;
		switch (snappi.qs.backend) {
			case 'node': case 'nodejs': 
				this.backend = Backend['nodejs']; break;
			case 'file':  
				// no separate file backend, use cake
			case 'cake': case 'cakephp': 
			default:
				this.backend = Backend['cakephp']; break;		
		}
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
		// $('body').addClass('wait');
	},
	
};



/*
 * Backend - static class, wrapper for different dev backends
 * 	'cakephp': original cakephp backend. DEFAULT
 * 		- a lot of bloat, but AAA properly implemented
 * 		- ex:  http://snappi-dev/person/photos/51cad9fb-d130-4150-b859-1bd00afc6d44/page:2/perpage:32/sort:score/direction:desc/.json?debug=0
 * 	'nodejs': nodejs, minimal REST API implemented in node.js, 
 * 		- use hostname=nodejs host, ?backend=node 
 * 		- GET eliminates a lot of bloat
 * 		- PUT/PATCH partially implemented using CakePHP backend
 * 		- WARNING: still USES BACKDOOR AUTHENTICATION, not appropriate for PRODUCTION release
 * 		- ex: http://localhost:3000/asset.json?userid=5013ddf3-069c-41f0-b71e-20160afc480d&type=Workorder:11&perpage=1000
 * 	'bootstrap': uses JS file with static JSON
 * 		- use ?bootstrap=[2011|mb|venice]
 * 		- see /js/snappi-bootstrap.js    
 */
var Backend = function(){}

// template: http://localhost:3000/asset.json?userid=5013ddf3-069c-41f0-b71e-20160afc480d&type=Workorder:11&perpage=1000
Backend.nodejs = {
	dataType: 'json',
	baseurl: 'localhost:3000', // nodejs.hostname
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
			bestshotId = collection.shot_core.bestshot.get('photoId');
		var shotRequestPage = collection.shot_core.bestshot.get('requestPage');

		var photos = _.chain(parsed)
			.filter(function(v,k,l){ return v.photoId!==bestshotId })
			.map(function(e,i,l){
				e.shotId = collection.shot_core.id; 
				e.bestshotId = bestshotId; 
				// add requestPage from parent
				e.requestPage = shotRequestPage;
				return new models.Hiddenshot(e);	
			}).value();

		var shot_extras = collection.parseShotExtras_Assets(response.assets, bestshotId);
		collection.shot_core = _.extend(collection.shot_core, shot_extras);
		collection.shot_core.stale = false;
		if (collection.shot_core.bestshot.get('id') !== collection.shot_core.id) {
			throw "ERROR: current bestshot does not match shot_extras result";
		}
		// $('body').removeClass('wait');
		return photos;		},
}

// template:  http://snappi-dev/person/photos/51cad9fb-d130-4150-b859-1bd00afc6d44/page:2/perpage:32/sort:score/direction:desc/.json?debug=0
Backend.cakephp = {
	dataType: 'jsonp',
	url:  function(){
		var collection = this, 
			qs = snappi.qs,	
			hostname = collection.hostname();
		var data = _.extend({hostname: hostname}, collection.shot_core);
		var url = collection.templates['url_shot'](data);
		return url;	},
	parse: function(response) {
		var that = this,
			parsed = this.parseShot_CC(response.response.castingCall), // from mixin
			bestshotId = this.shot_core.bestshot.get('photoId');

		var photos = _.chain(parsed)
			.filter(function(v,k,l){ return v.photoId!==bestshotId })
			.map(function(e,i,l){
				e.shotId = that.shot_core.id; 
				e.bestshotId = bestshotId; 
				return new models.Hiddenshot(e);	
			}).value();


		this.parseShotExtras_CC(response);
		var shot_extras = response.response.castingCall.shot_extras[this.shot_core.id];
		this.shot_core = _.extend(this.shot_core, shot_extras);
		this.shot_core.stale = false;
		if (this.shot_core.bestshot.get('id') !== this.shot_core.id) {
			throw "ERROR: current bestshot does not match shot_extras result";
		}
		// $('body').removeClass('wait');
		return photos;
	},
}



// put it all together at the bottom
extend(HiddenshotCollection);

})( snappi.collections, snappi.models, snappi.mixins );