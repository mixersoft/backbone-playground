// /js/collections/gallery.js

(function (collections, models, mixins, paginator) {

// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	var options = _.extend({}, 
		mixins.RestApi,
		mixins.Href, 
		classDef,
		setup_Paginator, 
		setup_DisplayOptions 
	);
	collections.GalleryCollection = paginator.requestPager.extend(
		options
	);
}

// template: http://localhost:3000/asset.json?userid=5013ddf3-069c-41f0-b71e-20160afc480d&type=Workorder:11&perpage=1000
var _useNodeBackend = {
	dataType: 'json',
	url: function(){
		var collection = this, 
			qs = snappi.qs,	
			defaults = {
				sort: 'score',
				direction : 'desc',
				userid: '5013ddf3-069c-41f0-b71e-20160afc480d', // manager
				ownerid: "51cad9fb-d130-4150-b859-1bd00afc6d44", // melissa-ben
			},
			request = _.defaults(qs, defaults);
			// override with live data
			request.page = collection.currentPage;
			request.perpage = collection.perPage; 
		var url = '/asset.json?'+$.param(request);
		return url;
	},
	parse: function(response){
if (_DEBUG) console.timeEnd("GalleryView.fetch()");		

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
		// $('body').removeClass('wait');
		return photos;
	},
}


// template:  http://snappi-dev/person/photos/51cad9fb-d130-4150-b859-1bd00afc6d44/page:2/perpage:32/sort:score/direction:desc/.json?debug=0
var _useCakephpBackend = {
	dataType: 'jsonp',
	url:  function(){
		var collection = this, 
			qs = collection.parseQueryString();		
		var templateId, type, 
			request = {
				hostname: collection.hostname(),
				sort: qs.sort || 'score',
				direction: qs.direction || qs.dir || 'desc',
				ownerid : qs.owner || "51cad9fb-d130-4150-b859-1bd00afc6d44",
				page: collection.currentPage,
				perpage: collection.perPage, 
				rating: _.isString(qs.rating) ? '/rating:'+qs.rating : '',
			}
			
		// adjust for request by workorder, 
		type = !!qs.type && ['owner', 'odesk', 'tw','TasksWorkorder','wo','Workorder'].indexOf(qs.type.split(':')[0]);
			
		switch (type){
			case false:
			case -1: // guest access, default, show public photos for userid
				templateId = 'guest';		// ?owner=[uuid] || "51cad9fb-d130-4150-b859-1bd00afc6d44"
				if (qs.owner && /^[a-z]+$/i.test(qs.owner)) {
					templateId = 'odesk';   // same as ?type=odesk&owner=paris
				}
				break;
			case 0: // guest access, show public photos for userid
				templateId = 'owner'; 
				delete request.ownerid;		// ?type=owner, fetch /my/photos, ignore &owner=[] param
				break;
			case 1:
				templateId = 'odesk';		// ?type=odesk&owner=paris or ?type=demo&owner=paris  
				break; 
			default: // workorder access, 
				request.id = qs.type.split(':')[1];
				request.controller = type>3 ? 'workorders' : 'tasks_workorders';
				templateId = 'workorder'; 	// ?type=wo:17 or ?type=workorder:17
				break;
		}
		return function(){ // return as function to modify queryOptions using this  
			var queryOptions = this, 
				url;
			switch (queryOptions.type){
				case 'GET':
					url = collection.templates['url_photo_'+templateId](request);
					break;
				case 'PUT':	
					// use model.save() instead
				default:
			}
			return url;
		};
	},
	parse: function(response) {
if (_DEBUG) console.timeEnd("GalleryView.fetch()");		

		var paging = response.response.castingCall.CastingCall.Auditions,
			serverPaging = {
				page: paging.Page,
				perpage: paging.Perpage,
				pages: paging.Pages,
				total: paging.Total,
				count: paging.Audition.length,
				targetHeight: 160,
			};
			
		// config image server for this request
		snappi.mixins.Href.imgServer({
			baseurl: paging.Baseurl,
		});
			
		// for clientPaging	
		this.paginator_ui.totalPages = Math.ceil(serverPaging.total / this.paginator_ui.perPage); 
		this.paginator_ui.serverPaging = serverPaging;
		
		
		// for requestPaging template
		if (!this.fetchedServerPages) this.fetchedServerPages = {}; 
		this.fetchedServerPages[serverPaging.page]=true  
		this.totalRecords = serverPaging.total;
		this.totalPages = serverPaging.pages;
		var parsed = this.parseShot_CC(response.response.castingCall), // from mixin
			photos = [];
if (_DEBUG) console.time("GalleryCollection: create models");			
		_.each(parsed, function(v, k, l) {
			if (v.shotId) photos.push(new models.Shot(v));
			else photos.push(new models.Photo(v));
		});
if (_DEBUG) console.timeEnd("GalleryCollection: create models");		
		// $('body').removeClass('wait');
		return photos;
	},
};
 

/*
 * Collection: GalleryCollection
 * properties:
 * - thumbSize
 * - layout
 * methods:
 * - nextPage()
 * - prevPage()
 */
	
var GalleryCollection =	{
	
	model : models.Photo,	// snappi.models.Shot	
	
	templates: {
		url_photo_guest: _.template('http://<%=hostname%>/person/photos/<%=ownerid%><%=rating%>/perpage:<%=perpage%>/page:<%=page%>/sort:<%=sort%>/direction:<%=direction%>/min:typeset/.json'),
		url_photo_odesk: _.template('http://<%=hostname%>/person/odesk_photos/<%=ownerid%><%=rating%>/perpage:<%=perpage%>/page:<%=page%>/sort:<%=sort%>/direction:<%=direction%>/min:typeset/.json'),
		url_photo_owner: _.template('http://<%=hostname%>/my/photos<%=rating%>/perpage:<%=perpage%>/page:<%=page%>/sort:<%=sort%>/direction:<%=direction%>/min:typeset/.json'),
		url_photo_workorder: _.template('http://<%=hostname%>/<%=controller%>/photos/<%=id%><%=rating%>/perpage:<%=perpage%>/page:<%=page%>/sort:<%=sort%>/direction:<%=direction%>/min:typeset/.json'),
		url_shot: _.template('http://<%=hostname%>/photos/hiddenShots/<%=shotId%>/Usershot//min:typeset/.json'),
	},
	
	events: {
		// 'repaginate':'repaginate',		// doesn't work for Collections
	},
	
	initialize: function(){
		// HACK: support for either node or cakephp backend
		this.backend = snappi.qs.backend=='node' ? _useNodeBackend : _useCakephpBackend;
		this.paginator_core.dataType = this.backend.dataType;
		if (snappi.qs.page) this.paginator_ui.currentPage = snappi.qs.page;
		if (snappi.qs.perpage) this.paginator_ui.perPage = snappi.qs.perpage;
		// end
		
		this.listenTo(this, 'repaginate', this.repaginate);
		this.listenTo(this, 'fetchHiddenShots', this.fetchHiddenShots);
		this.listenTo(this, 'request', this.request);
	},
	
	/**
	 * repaginate models for client side paging
	 * - adds shot.clientPage
	 * - call repaginate BEFORE sync()
	 * 
	 * when page boundaries change, it's not clear that 
	 * are inserted into this.models in the correct sort order
	 *  
	 */
	repaginate: function(perpage){
		perpage = perpage || this.perPage;
		// reset cached pages index because we don't know which serverPages 
		// are completely loaded anymore
		this.fetchedServerPages = {};
		var activePageCount = {},
			newPageCounter = {},
			activePerpage,		// old perpage
			newPage, index;	
		
		// TODO: this.models.sort() must match server sort()
		
		var p, activePaging;
		_.each(this.models, function(model){
			// estimate clientPage based on serverPage math
			if (p = model.get('clientPage')) {
				activePerpage = this.perPage;
			} else {
				p = model.get('requestPage');
				activePerpage = this.paginator_ui.serverPaging.perpage;
			}
			if (activePageCount[p]) activePageCount[p]++;
			else activePageCount[p]=1;	// 1 based
			
			index = (p-1)*activePerpage + activePageCount[p]-1;	// 0-based
			newPage =  Math.floor(index/perpage)+1;	// 0-19 => 1, based on new perpage
			model.set({
				clientPage: newPage,
				requestPage: null,// unknown, will be updated in this.parse()
			});
			
			if (typeof newPageCounter[newPage] != 'undefined') {
				newPageCounter[newPage]++;
				if (newPageCounter[newPage] == perpage) {
					this.fetchedServerPages[newPage] = true;
				}
			}
			else newPageCounter[newPage]=1;	// 1-based
			
		}, this);	
		this.trigger('repaginated', newPageCounter);
	},
	/**
	 * get Hiddenshots and add to Collection, fired by ThumbnailView via click event
 	 * @param {Object} options = {model: [models.Shot]}
 	 * 
 	 * url form: http://dev.snaphappi.com/photos/hiddenShots/[shotId]/Usershot/.json
	 */
	fetchHiddenShots: function(options) {
		var model = options.model;
		if (!(model instanceof models.Shot)) return;
		var that = this;
		var success = function(hiddenshotC, response, options){
			// NOTE: model.get('hiddenshot') == collection
			console.info("GalleryCollection received new Hiddenshots");
			var bestshot = hiddenshotC.shot_core.bestshot;
			that.add(hiddenshotC.models, {silent:false, merge:true, remove:false} );
			// TODO: GalleryView is not getting this event
			that.trigger('addedHiddenshots', hiddenshotC.models, {
				shotId : hiddenshotC.shot_core.id,
				bestshot : hiddenshotC.shot_core.bestshot,
				viewClass : 'PhotoView',
				wrap: false, 
			});
			model.trigger('fetchedHiddenshots', hiddenshotC, response, options);	// ThumbnailView is listening
		}
		var hiddenshotCollection = model.get('hiddenshot');
		var hiddenshot_options = {
			success: success,
			dataType: hiddenshotCollection.backend.dataType,
			// callback: '?',
			merge: true,
			remove: false,
		};
		hiddenshotCollection.fetch(hiddenshot_options);
	}
};

var setup_DisplayOptions = {
	gallery_display_options_ui: {
		'size': [
			{label:'S', size: 100, active:'active' },
			{label:'M', size: 160,  },
			{label:'L', size: 240, },
		],
	}
}

var setup_Paginator = {
	// properties for use with Backbone.Paginator	
	paginator_ui : {
		// the lowest page index your API allows to be accessed
		firstPage : 1,

		// which page should the paginator start from
		// (also, the actual page the paginator is on)
		currentPage : 1,

		// how many items per page should be shown
		perPage : 20,

		// a default number of total pages to query in case the API or
		// service you are using does not support providing the total
		// number of pages for us.
		// 10 as a default in case your service doesn't return the total
		totalPages : 5,

		// The total number of page numbers to be shown in pagination UI
		// list is calculated by (pagesInRange * 2) + 1.
		pagesInRange : 7
	},

	paginator_core : {
		// the type of the request (GET by default)
		type : 'GET',

		// the type of reply (jsonp by default)
		dataType : 'jsonp',

		// the URL (or base URL) for the service
		// if you want to have a more dynamic URL, you can make this a function
		// that returns a string
		url : function() {
			var collection = this;
			return this.backend.url.apply(collection, arguments);
		},
		
	},
		
	parse : function() {
		var collection = this;
		return this.backend.parse.apply(collection, arguments);
	},	
	
	server_api: {	
		// custom parameters appended to querystring via queryAttributes
	},
	request: function(collection, xhr, queryOptions){
		var check; // GalleryCollection
		this.trigger('xhr-fetch-page', this.currentPage);
		if (_DEBUG) console.time("GalleryView.fetch()");
	},
}

// put it all together at the bottom
extend(GalleryCollection);
	

})( snappi.collections, snappi.models, snappi.mixins, Backbone.Paginator);