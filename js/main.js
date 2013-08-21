//Top-level namespaces for our code

(function() {

	_DEBUG = 0;
	
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
		
		if (false) {	
			/*
			*  Playground setup using bootstrapped JSON data
			*/
			// same as json.response from $ajax({dataType: 'json'}).success.call(this, json, status, o);
			var json = {
				response : JSON.parse(SNAPPI.CFG.JSON.raw),
			}
			SNAPPI.CFG.JSON.data = json.response['response'].castingCall;
		}
		
		snappi.collections.paginatedGallery = new snappi.collections.GalleryCollection();
		snappi.views.app = new snappi.views.GalleryView({
			collection : snappi.collections.paginatedGallery
		});
		snappi.views.pager = new snappi.views.PagerView({
			collection : snappi.collections.paginatedGallery
		});
	});
})();

