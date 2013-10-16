(function ( mixins, models ) {
/*
 * Backend - wrapper for different dev backends
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
var FlickrApi = mixins.FlickrPlaces['FlickrApi'];

var Flickr = {
	url: "/wrong/place",
	getLocalities: function(method, model, options) {
		var that = this,
			data = options.data,
			allPhotos = [],
			allComplete = function(){
				if (_.isFunction(options.success)) options.success(allPhotos);
				if (_.isFunction(options.complete)) options.complete();
			},
			queued = [];
		switch (data.filters.zoom)	{
			case "country": case "region":
				var oneComplete = _.after(data.localities.length, allComplete)
				var oneSuccess = function(photos){
					allPhotos = _.union(allPhotos, photos);
					var next = queued.shift()
console.info("FlickrApi.getPhotos, remaining="+queued.length);					
					if (next) FlickrApi.getPhotos.apply(that, next);
					oneComplete();
				};
				var fetchOptions = _.clone(data);
				delete fetchOptions.localities;
				delete fetchOptions.sort;

				_.each(data.localities, function(e,i,l){
					fetchOptions.longitude = e.locality_longitude;
					fetchOptions.place_id = e.locality_place_id;

					var place_id = e.place_id || e.locality_place_id;
					queued.push([
						fetchOptions.place_id, 
						fetchOptions, 
						oneSuccess
					]);
				}, this);
				var next = queued.shift();
				if (next) FlickrApi.getPhotos.apply(that, next);	
				break;
			default: 
				var complete = function() {
					that.collection.trigger('xhr-fetched');
				};
				FlickrApi.getPhotos(
					data.place_id, 
					data, 
					allComplete
				);
				break;
		}
	},
	sync: function(method, model, options) {
		// timeline fetch paging does not follow asset paging
		switch (method) {
			case "read":
				Flickr.getLocalities.call(this, method, model, options);
				break;
			default:
				options.data.page = 1;
				options.data.perpage = 99;
				// hijack method='read'
			    Backbone.sync.call(this, method, model, options);
			break;
		}
	},
	parse: function(response){
		var parsed = response,
			photos = [];
if (_DEBUG) console.time("GalleryCollection: create models");			
		_.each(parsed, function(v, k, l) {
			v.photoId = v.id;
			v.rootSrc = v.url;
			var scale = 240/500;	// _m is 240px, origH/W is 500px
			v.origH = v.H;
			v.origW = v.W;
			v.H *= scale;
			v.W *= scale;
			photos.push(new models.Photo(v));
		});
if (_DEBUG) console.timeEnd("GalleryCollection: create models");		
		$('body').removeClass('wait');
		return photos;
	},	
}

var Backend = _.extend(mixins.BackendHelpers && mixins.BackendHelpers['Backend']  || {}, {
	'Flickr': Flickr,
});
mixins.BackendHelpers = mixins.BackendHelpers || {Backend:{}};
mixins.BackendHelpers['Backend'] = Backend;
var check;
})( snappi.mixins, snappi.models);