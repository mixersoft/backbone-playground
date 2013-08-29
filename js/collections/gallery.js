// /js/collections/gallery.js

(function (collections, model, mixins, paginator) {

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
	
	model : model,	// snappi.models.Shot	
	
	templates: {
		url_photo_guest: 'http://dev.snaphappi.com/person/odesk_photos/<%=ownerid%><%=rating%>/perpage:<%=perpage%>/page:<%=page%>/sort:<%=sort%>/direction:<%=direction%>/.json',
		url_photo_workorder: 'http://dev.snaphappi.com/<%=controller%>/photos/<%=id%><%=rating%>/perpage:<%=perpage%>/page:<%=page%>/sort:<%=sort%>/direction:<%=direction%>/.json',
		url_shot: 'http://dev.snaphappi.com/photos/hiddenShots/<%=shotId%>/Usershot/.json',
	},
	
	events: {
		// 'repaginate':'repaginate',		// doesn't work for Collections
	},
	
	initialize: function(){
		// compile templates
		for (var i in this.templates) {
			if (_.isString(this.templates[i])) this.templates[i] = _.template(this.templates[i]); 
		}
		console.info("GalleryCollection initialized");
		this.listenTo(this, 'repaginate', this.repaginate);
		this.listenTo(this, 'fetchHiddenShots', this.fetchHiddenShots);
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
	 * get Hiddenshots and add to Collection
 	 * @param {Object} options = {model: [models.Shot]}
 	 * 
 	 * url form: http://dev.snaphappi.com/photos/hiddenShots/[shotId]/Usershot/.json
	 */
	fetchHiddenShots: function(options) {
		var url = this.templates['url_shot']({shotId: options.model.get('shotId')});
		// ???: should I be using model.urlRoot, etc?
		var check = options.model.fetch({url:url});		
	}
};

var setup_DisplayOptions = {
	gallery_display_options_ui: {
		'size': [
			{label:'S', size: 100, },
			{label:'M', size: 160, active:'active'  },
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
		pagesInRange : 3
	},

	paginator_core : {
		// the type of the request (GET by default)
		type : 'GET',

		// the type of reply (jsonp by default)
		dataType : 'jsonp',

		// the URL (or base URL) for the service
		// if you want to have a more dynamic URL, you can make this a function
		// that returns a string
		// template:  http://snappi-dev/person/odesk_photos/51cad9fb-d130-4150-b859-1bd00afc6d44/page:2/perpage:32/sort:score/direction:desc/.json?debug=0
		url : function(){
			$('body').addClass('wait');
			var qs = this.parseQueryString();
			if (qs.perpage) this.perPage = this.paginator_ui.perPage = parseInt(qs.perpage);
			var templateId, type, 
				request = {
					sort: qs.sort || 'score',
					direction: qs.direction || qs.dir || 'desc',
					ownerid : qs.owner || "51cad9fb-d130-4150-b859-1bd00afc6d44",
					page: this.currentPage,
					perpage: this.perPage, 
					rating: _.isString(qs.rating) ? '/rating:'+qs.rating : '',
				}
				
			// adjust for request by workorder, 
			// 	ex. ?type=tw&id=22 => /tasks_workorders/photos/22/perpage:162	
			type = ['tw','TasksWorkorder','wo','Workorder'].indexOf(qs.type);	
			if ( type > -1) { // show workorders
				request.id = qs.id;
				request.controller = type>1 ? 'workorders' : 'tasks_workorders';
				templateId = 'workorder'; 
			} else {	// normal guest access
				templateId = 'guest';
				this.paginator_core.dataType = 'json';
			}
			return this.templates['url_photo_'+templateId](request);
		}
	},
	
	parse : function(response) {
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
		
		var parsed = this.parseShot(response.response.castingCall),
			shots = [];
		_.each(parsed, function(v, k, l) {
			shots.push(new snappi.models.Shot(v));
		});
		$('body').removeClass('wait');
		return shots;
	},
	
	server_api: {
		// custom parameters
		// 'callback': '?',
	},
}

// put it all together at the bottom
extend(GalleryCollection);
	

})( snappi.collections, snappi.models.Shot, snappi.mixins, Backbone.Paginator);