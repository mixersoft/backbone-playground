//Top-level namespaces for our code

(function() {

	/*
	*  Playground setup
	*/
	// same as json.response from $ajax({dataType: 'json'}).success.call(this, json, status, o);
	var json = {
		response : JSON.parse(SNAPPI.CFG.JSON.raw),
	}
	var cc = json.response['response'].castingCall;
	SNAPPI.CFG.JSON.data = cc;
	// for introspection
	var thumbnails = SNAPPI.parseCC(cc);

	/*
	 * setup snappi namespace
	 */
	window.snappi = {};
	snappi.collections = {};
	snappi.models = {};
	snappi.views = {};
	snappi.mixins = {};
	
	snappi.mixins.util = {
		parseQueryString : function(a) {
			a = a || (window.location.search.substr(1).split('&'));
		    if (a == "") return {};
		    var b = {};
		    for (var i = 0; i < a.length; ++i)
		    {
		        var p=a[i].split('=');
		        if (p.length != 2) continue;
		        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
		    }
		    return b;
		},
	}

	// Defer initialization until doc ready.
	$(function() {
		snappi.collections.paginatedGallery = new snappi.collections.GalleryCollection();
		snappi.views.app = new snappi.views.GalleryView({
			collection : snappi.collections.paginatedGallery
		});
		snappi.views.pager = new snappi.views.PagerView({
			collection : snappi.collections.paginatedGallery
		});
		
		return;

		/*
		 * get models from raw data
		 */
		// var bootstrap_shots = [];
		// _.each(SNAPPI.Auditions, function(v, k, l) {
			// bootstrap_shots.push(new snappi.models.Shot(v));
		// });
		// var myCollection = snappi.collections.paginatedGallery;
		// if (myCollection  instanceof Backbone.Paginator.clientPager) {
			// myCollection.bootstrap({
				// models : bootstrap_shots
			// });
		// } else {
			// myCollection.reset(bootstrap_shots);
		// }

	});
})();

