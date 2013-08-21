// /js/collections/gallery.js

(function (collections, model, paginator) {

/*
 * notes from Robert
 * - GalleryCollection extends paginator
 * - pass constructor array of Shots
 * - should auto render grid of Thumbs
 *
 */

/*
 * Collection: GalleryCollection
 * properties:
 * - thumbSize
 * - layout
 * methods:
 * - nextPage()
 * - prevPage()
 */
collections.GalleryCollection = paginator.requestPager.extend({
	
	model : model,	// snappi.models.Shot	
	// reset works with clientPager
	reset: function(new_models){
		var models, args=[];
		// update this.information with serverPaging
		if (0 && this.length) { 
			// append to current page
			models = this.models.slice(0, this.length-1).concat(new_models);
			args.push(models);
			args.push({ 
				skip: this.length-1,
				length: models.length
			});
			// note, only render NEW models
			this.length = models.length;
			
			/*
			 * TODO: clientPager.reset() should append
			 * 	- keep track of rendered pages
			 *  - prevPage() should scrollTo() prev page 
			 */
			paginator.clientPager.prototype.reset.apply(this, args);
		} else 
			paginator.clientPager.prototype.reset.apply(this, arguments);
	},
	// sync works with requestPager
		
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
			var qs = snappi.mixins.util.parseQueryString();
			if (qs.perpage) this.perPage = parseInt(qs.perpage);
			var request = {
				ownerid : qs.owner || "51cad9fb-d130-4150-b859-1bd00afc6d44",
				page: this.currentPage,
				perpage: this.perPage, 
			}
			var request_template = 'http://snappi-dev/person/odesk_photos/<%=ownerid%>/perpage:<%=perpage%>/page:<%=page%>/sort:score/direction:desc/.json?'; 
			return _.template(request_template, request);
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
		// for clientPaging	
		this.paginator_ui.totalPages = Math.ceil(serverPaging.total / this.paginator_ui.perPage); 
		this.paginator_ui.serverPaging = serverPaging;
		
		// for requestPaging template
		this.totalRecords = serverPaging.total;
		this.totalPages = serverPaging.pages;
		
		var parsed = SNAPPI.parseCC(response.response.castingCall, 'force'),
			shots = [];
		_.each(parsed, function(v, k, l) {
			shots.push(new snappi.models.Shot(v));
		});
		return shots;
	},
	
	server_api: {
		// custom parameters
		'callback': '?',
	},

});


})( snappi.collections, snappi.models.Shot, Backbone.Paginator);