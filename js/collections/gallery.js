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
collections.GalleryCollection = paginator.clientPager.extend({
	
	model : model,	// snappi.models.Shot	


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
		// // the type of the request (GET by default)
		// type : 'GET',
// 
		// // the type of reply (jsonp by default)
		// dataType : 'jsonp',
// 
		// // the URL (or base URL) for the service
		// // if you want to have a more dynamic URL, you can make this a function
		// // that returns a string
		// // template:  http://snappi-dev/person/odesk_photos/51cad9fb-d130-4150-b859-1bd00afc6d44/page:2/perpage:32/sort:score/direction:desc/.json?debug=0
		// url : function(){
			// var request = {
				// ownerid : "51cad9fb-d130-4150-b859-1bd00afc6d44",	
			// }
			// var request_template = 'http://snappi-dev/person/odesk_photos/{{ownerid}}/sort:score/direction:desc/.json?debug=0'; 
			// return _.template(request_template, request);
		// }
	},
	
	parse : function(response) {
		var paging = response.response.castingCall.CastingCall.Auditions,
			cfg = {
				page: paging.Page,
				perpage: paging.Perpage,
				pages: paging.Pages,
				total: paging.Total,
				count: paging.Audition.length,
				targetHeight: 160,
			};
		this.perpage = cfg.perpage;	
		this.currentPage = cfg.page;
		this.totalPages = cfg.pages; 
		return paging.Audition;
	},
	
	server_api : {
		// // the query field in the request
		// '$filter' : 'substringof(\'america\',Name)',
// 
		// // number of items to return per request/page
		// '$top' : function() {
			// return this.perPage
		// },
// 
		// // how many results the request should skip ahead to
		// // customize as needed. For the Netflix API, skipping ahead based on
		// // page * number of results per page was necessary.
		// '$skip' : function() {
			// return this.currentPage * this.perPage
		// },
// 
		// // field to sort by
		// '$orderby' : 'score',
// 
		// // what format would you like to request results in?
		// '$format' : 'json',
// 
		// // custom parameters
		// '$inlinecount' : 'allpages',
		// '$callback' : 'callback'
	},


});


})( snappi.collections, snappi.models.Shot, Backbone.Paginator);