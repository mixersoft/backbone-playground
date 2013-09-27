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
		snappi.qs = mixins.Href.parseQueryString();		// global parsed qs
		
		// config image server, to set explicitly, use &host=[hostname]
		var imgHost = {};		// default is snappi[N].snaphappi.com
		if (/snaphappi.com$/.test(mixins.Href.hostname())==false){
			imgHost = {		// use localhost config for img hosting
				hostname: mixins.Href.hostname('snappi-dev'),
				subdomains : [''],
			};
		}
		mixins.Href.imgServer(imgHost);
		
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

