//Top-level namespaces for our code

(function() {
	"use strict";

	window._DEBUG = window.location.search.indexOf('debug') > -1;
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
		if (/file|cake/.test(snappi.qs.backend)) snappi.PAGER_STYLE = 'page';
		
		// config image server, to set explicitly, use &host=[hostname]
		mixins.Href.imgServer({		
			// use localhost config for img hosting
			hostname: mixins.Href.hostname(),
		});
		var pager, collection; 
		switch (snappi.PAGER_STYLE) {
			case 'timeline': 
				pager = new snappi.models.Timeline();
				collection = new snappi.collections.GalleryCollection(null,
					{
						sort: pager.get('direction')
					});
				snappi.app = new snappi.views.GalleryView({
					collection : collection,
					pager: pager,
				}); 
				break;
			case 'placeline': 
				snappi.qs.backend = 'flickr';	// force
				pager = new snappi.models.Placeline(); 
				collection = new snappi.collections.GalleryCollection(null,
					{
						sort: pager.get('direction'), // 'asc'
					});
				snappi.app = new snappi.views.GalleryView({
					collection : collection,
					pager: pager,
				});
				break;
			case 'page': 
				collection = new snappi.collections.GalleryCollection(null, 
					{
						// default sort: 'asc'
					});
				snappi.app = new snappi.views.GalleryView({
					collection : collection
				});
				break;
		} 
		snappi.collections.paginatedGallery = collection;
	});
})();

