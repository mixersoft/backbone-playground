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
		snappi.PAGER_STYLE = 'timeline';
		
		// config image server, to set explicitly, use &host=[hostname]
		var imgHost = {};		// default is snappi[N].snaphappi.com
		if (/snaphappi.com$/.test(mixins.Href.hostname())==false){
			imgHost = {		// use localhost config for img hosting
				hostname: mixins.Href.hostname('snappi-dev'),
				subdomains : [''],
			};
		}
		mixins.Href.imgServer(imgHost);
		var timeline = new snappi.models.Timeline(), 
			collection = new snappi.collections.GalleryCollection(),
			app = new snappi.views.GalleryView({
				collection : collection,
				timeline: timeline, 		 
			});
		// for debugging
		snappi.collections.paginatedGallery = collection;
	});
})();

