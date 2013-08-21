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
		snappi.views.app = new snappi.views.GalleryView({
			collection : snappi.collections.paginatedGallery
		});
		snappi.views.pager = new snappi.views.PagerView({
			collection : snappi.collections.paginatedGallery
		});
	});
})();

