//Top-level namespaces for our code

(function() {

	_DEBUG = 0;
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
		
		// config image server
		snappi.mixins.Href.imgServer({
			hostname: 'snaphappi.com',
			subdomains: ['snappi','snappi1','snappi2'],
			baseurl: '/svc/STAGING/',
			template: 'http://{{subdomain}}.{{hostname}}{{baseurl}}{{stage}}/.thumbs/{{size}}~{{filename}}',
		});
		
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

