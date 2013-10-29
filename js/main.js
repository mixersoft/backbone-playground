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
		snappi.TIMINGS = mixins.UiActions.TIMINGS;
		snappi.PAGER_STYLE = snappi.qs.pager || 'timeline'; // timeline, placeline, page
		
		// config image server, to set explicitly, use &host=[hostname]
		mixins.Href.imgServer({		
			// use localhost config for img hosting
			hostname: mixins.Href.hostname(),
		});
		var timelinePager; 
		switch (snappi.PAGER_STYLE) {
			case 'timeline': 
				timelinePager = new snappi.models.Timeline();
				var collection = new snappi.collections.GalleryCollection(null,
					{
						sort: timelinePager.get('direction')
					});
				snappi.app = new snappi.views.GalleryView({
					collection : collection,
					timeline: timelinePager, 		 
				}); 
				break;
			case 'placeline': 
				snappi.qs.backend = 'flickr';	// force
				timelinePager = new snappi.models.Placeline(); 
				var collection = new snappi.collections.GalleryCollection(null,
					{
						sort: timelinePager.get('direction'), // 'asc'
					});
				snappi.app = new snappi.views.GalleryView({
					collection : collection,
					timeline: timelinePager, 		 
				});
				break;
			case 'page': 
				var collection = new snappi.collections.GalleryCollection();
				snappi.app = new snappi.views.GalleryView({
					collection : collection
				});
				break;
		} 
		snappi.collections.paginatedGallery = collection;
	});
})();

