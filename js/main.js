//Top-level namespaces for our code

(function() {

	_DEBUG = window.location.search.indexOf('debug') > -1;
	window.SNAPPI = window.SNAPPI || {};
	
	/*
	 * setup snappi namespace
	 */
	window.snappi = {};
	snappi.collections = {};
	snappi.models = {};
	snappi.views = {};
	snappi.mixins = {};
	
	// Defer initialization until doc ready.
	$(function() {
		var mixins = snappi.mixins;
		// config image server
		if (0 && /snaphappi.com$/.test(mixins.Href.hostname())==false){
			// use localhost config for img hosting
			var localhost = {
				hostname: mixins.Href.hostname(),
				subdomains : [''],
			};
		}
		snappi.qs = mixins.Href.parseQueryString();
		mixins.Href.imgServer(localhost || {});
		
		snappi.collections.paginatedGallery = new snappi.collections.GalleryCollection();
		
		var bootstrap = /bootstrap/.test(window.location.search);
		if (bootstrap){
			var user = 'venice';
			var json = JSON.parse(SNAPPI.CFG.JSON[user].raw);
			var shots = snappi.collections.paginatedGallery.parse(json);
			shots = shots.slice(0,20);
			snappi.collections.paginatedGallery.reset(shots);
		} 		
		
		snappi.views.app = new snappi.views.GalleryView({
			collection : snappi.collections.paginatedGallery
		});
		
	});
})();

