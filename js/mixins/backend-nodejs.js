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
var Nodejs = {
	dataType: 'json',
	baseurl: 'localhost:3000', // nodejs.hostname
	url: function(){
		var url; 
		switch (snappi.PAGER_STYLE) {
			case 'timeline':
				// override from GalleryView.onTimelineChangePeriod
				url = _.template('http://<%=baseurl%>/asset.json?', Nodejs); 
				break;
			case 'placeline':
				url = _.template('http://<%=baseurl%>/asset.json?', Nodejs);
				// url = this.FlickrAPI.photos()
				break;
			case 'page':
			default: 
				var collection = this, 
				qs = snappi.qs,	
				defaults = {
					sort: 'score',
					direction : 'desc',
					userid: '5013ddf3-069c-41f0-b71e-20160afc480d', // manager
					ownerid: "51cad9fb-d130-4150-b859-1bd00afc6d44", // melissa-ben
				},
				request = _.defaults(qs, defaults);
				request.page = collection.currentPage;		
				request.perpage = collection.perPage;
				url = _.template('http://<%=baseurl%>/asset.json?', Nodejs)+$.param(request); 
				break;
		} 	
		return url;
	},
	parse: function(response){
if (_DEBUG) console.timeEnd("GalleryCollection.fetch()");		

		var paging = response.request;
			serverPaging = {
				page: parseInt(paging.page),
				perpage: parseInt(paging.perpage),
				pages: parseInt(paging.pages),
				total: parseInt(paging.total),
				count: response.assets.length,
				// targetHeight: 160,
			};
			
		// config image server for this request
		snappi.mixins.Href.imgServer({
			baseurl: paging.baseurl,
		});
			
		// for clientPaging	
		this.paginator_ui.totalPages = Math.ceil(serverPaging.total / this.paginator_ui.perPage); 
		this.paginator_ui.serverPaging = serverPaging;
		
		
		// for requestPaging template
		if (!this.fetchedServerPages) this.fetchedServerPages = {}; 
		this.fetchedServerPages[serverPaging.page]=true  
		this.totalRecords = serverPaging.total;
		this.totalPages = serverPaging.pages;
		var parsed = this.parseShot_Assets(response), // from mixin
			photos = [];
if (_DEBUG) console.time("GalleryCollection: create models");			
		_.each(parsed, function(v, k, l) {
			if (v.shotId) photos.push(new models.Shot(v));
			else photos.push(new models.Photo(v));
		});
if (_DEBUG) console.timeEnd("GalleryCollection: create models");		
		$('body').removeClass('wait');
		return photos;
	},	
}

var Backend = _.extend(mixins.BackendHelpers && mixins.BackendHelpers['Backend']  || {}, {
	'Nodejs': Nodejs,
});
mixins.BackendHelpers = mixins.BackendHelpers || {Backend:{}};
mixins.BackendHelpers['Backend'] = Backend;
var check;
})( snappi.mixins, snappi.models);