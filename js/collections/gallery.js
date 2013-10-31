// /js/collections/gallery.js

(function (collections, models, mixins, paginator) {

// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	var options = _.extend( {}, 
		mixins.RestApi,
		// mixins.FlickrPlaces,
		mixins.Href, 
		mixins.BackendHelpers,
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
	
	// model : models.Photo,
	
	initialize: function(models, options){
		// HACK: support for either node or cakephp backend, see Backend static class
		// this.backend = snappi.qs.backend=='node' ? _useNodeBackend : _useCakephpBackend;
		switch (snappi.qs.backend) {
			case 'node': case 'nodejs': 
				this.backend = this.Backend['Nodejs']; break;
			case 'flickr': 
				this.backend = this.Backend['Flickr']; 
				this.sync = this.Backend['Flickr'].sync;
				this.sortBy_0 = 'longitude';
				this.sortBy_1 = 'dateTaken';
				break;
			case 'file':  
				this.backend = this.Backend['File']; break;
			case 'cake': case 'cakephp': 
			default:
				this.backend = this.Backend['Cakephp']; break;		
		}
		
		this.paginator_core.dataType = this.backend.dataType;
		if (snappi.qs.page) this.paginator_ui.currentPage = snappi.qs.page;
		if (snappi.qs.perpage) this.paginator_ui.perPage = snappi.qs.perpage;
		if (snappi.qs.rating) {
			this.gallery_display_options_ui['rating'][0].label = snappi.qs.rating;
		}
		if (options && options.sort) this.pager_ui.direction = options.sort;
		// end
		this.listenTo(this, 'repaginate', this.repaginate);
		this.listenTo(this, 'fetchHiddenShots', this.fetchHiddenShots);
		this.listenTo(this, 'request', this.request);
		// this.listenTo(this, 'filterChanged', this.filterChanged);
		this.listenTo(this, 'change:direction', function(dir){
			this.pager_ui.direction = dir; 
			return "how do we listing to a change in TimelineView???"
		});
	},
	
	// comparator: function( photo ){
		// return photo.get('dateTaken');
	// },
	sortBy_0: 'dateTaken', 
	sortBy_1: 'score', 
	comparator: function( a, b, sortBy ){
		sortBy = sortBy || this.sortBy_0;

		var aVal = a.get(sortBy),
			bVal = b.get(sortBy),
			ret;

		if (aVal < bVal) ret = -1;
		else if (aVal > bVal) ret = 1;
		else 
			return (!sortBy && this.sortBy_1) ? this.comparator(a,b, this.sortBy_1) : 0;
		// check models.Timeline.get('direction)
		if (this.pager_ui.direction == 'desc') ret *= -1;
		return ret;
	},


	request: function(collection, xhr, queryOptions){
		var index;
		switch (snappi.PAGER_STYLE) {
			case 'timeline': 
				index = "timeline should know"
				break;
			case 'placeline':
				index = "placeline should know";
				break;
			case 'page':
				index = this.currentPage;
				break;
		}
		this.trigger('xhr-fetching', index);
		if (_DEBUG) console.time("GalleryCollection.fetch()");
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
			// TODO: GalleryCollection. is not getting this event
			that.trigger('addedHiddenshots', hiddenshotC.models, {
				shotId : hiddenshotC.shot_core.id,
				bestshot : hiddenshotC.shot_core.bestshot,
				viewClass : 'PhotoView',
				wrap: false, 
			});
			// us GalleryView.addedHiddenshots to add .showing class
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
	},

	/**
	 * get Zoom and add to Collection, fired by ThumbnailView via click event
 	 * @param {Object} pivot = {
			place_id: mPhoto.place_id,
			lat: mPhoto.latitude,
			lon: mPhoto.longitude,
			accuracy: mPhoto.accuracy,
			currentZoom: currentZoom,
			dir: 'zoom-in',
			pivot: thumb,
			pivot_model: mPhoto,	// ???: this needed?
		}
 	 * 
	 */
	fetchZoom: function(pivot, options) {
		var collection = this;

		var newZoom = collection.backend.getZoom(pivot.currentZoom, pivot.dir);
		var req_getPlaceInfo = collection.backend.getReq('zoomOut', {
			place_id:pivot.place_id
		});
		var options_placeInfo = req_getPlaceInfo.xhrOptions;
		options_placeInfo.url = req_getPlaceInfo.url;
		options_placeInfo.data = req_getPlaceInfo.data;
		options_placeInfo.cache = true;
		var success = options.success;
		$.ajax(options_placeInfo)
			.success(function(resp){
				var curPlaces = resp.place,
					curPlace = curPlaces[newZoom],
					options_Zoom = {
						place_id: curPlace.place_id
					};
				_.defaults(options_Zoom, options.fetchOptions)
				// set models.Placeline.active
				if (options.placeline) {
					var periods = options.placeline.get('periods');
					var found = _.find(options.placeline.get('periods'), function(e,i,l){
						if (e.place_id==options_Zoom.place_id) {
							found = i;
							options.placeline.set('active',i,{silent:true});
							return true;
						}
					});
					if (!found) {
						console.warn("no period found for zoom="+ newZoom +", place_id="+curPlace.place_id);
						// ex: zoomOnPivot massachusetts, but not in place_db['region']
						// HACK: add MISSING period to Placeline.periods
						var addPeriod = {
							longitude: curPlace.longitude,
							place_id: curPlace.place_id, 
							period: curPlace.place_id, 
							place_type: newZoom,
							place_type_id: mixins.FlickrPlaces['FlickrApi'].lookups.place_type_id[newZoom],
							latitude: curPlace.latitude,
							label: curPlace._content,
							name: curPlace._content,
						}
						// TODO: trigger Placeline.trigger('insertPeriod', addPeriod)
						var insertAt = _.sortedIndex(periods, addPeriod, 'longitude');
						periods.splice(insertAt, 0, addPeriod);
						options.placeline.set('active',insertAt,{silent:true});
						options.placeline.trigger('sync', options.placeline);
					}
				}
				// here is the actual flickr fetch
				collection.fetch({
					remove: false,
					data: options_Zoom,
					success: function(collection, response, options){
						var check;
						// insert around options.pivot
						if (_.isFunction(success)) success.apply(collection, arguments);
					},
					complete: function(){
						collection.trigger('xhr-fetched');
						if (_.isFunction(options.complete)) options.complete.apply(collection, arguments);
					},
				});
			})
			.fail(function(){
				var check;
			});
		return;
	},

	filterFn : {
		rating: function(model, changed){
			var remove = model.get('rating') < changed.rating;
			return remove;
		},
		zoom: function(){
			return false;
		},
	},
	filterChanged: function (changed, galleryView) {
		console.info("GalleryView.onTimelineChangeFilter() Filter changed");
		// update TimelineView to reflect current filter
		// might have to filter collection.models, too
		// isFetched() should compare filter  
		var that = this;
		// previous = this.pager.previousAttributes(),
		// CHECK if filter requires a fetch
		// 		for all pages, set page stale=true;
		var filtered, remove, id, 
			options = {}, 
			keep_models = [],
			remove_models = [];

		if (changed.fetch==false) {
			_.filter(that.models,function(model,i,l){
				// handle filtered.changed.rating='off'
				
				// find first remove
				remove = _.find(changed, function(v,key,l){
					if (that.filterFn[key]) 
						return that.filterFn[key](model, changed);
					else return false;
				})
				
				if (remove) {
					model.trigger('hide');
					remove_models.push(model);
					// TODO: get the page of thumbView for addBack
				} else 
					keep_models.push(model);
			}, that);
			// do in GalleryCollection
			options = {silent:true};
			that.remove(remove_models, options);
			var filtered = _.union(that.filteredModels||[], remove_models);
			that.filteredModels = filtered;
			
			// render page
			_.delay(function(){
				that.trigger('refreshLayout');	
			}, snappi.TIMINGS.thumb_fade_transition+100)
		} else {
			// Timeline.validate_ChangeFilter() already marked all pages a stale
			
			// filter filtered models, then addback
			_.filter(that.filteredModels,function(model,i,l){
				// handle filtered.changed.rating='off'
				
				// find first remove
				remove = _.find(changed, function(v,key,l){
					if (that.filterFn[key]) 
						return that.filterFn[key](model, changed);
					else return false;
				})
				
				if (remove) {
					remove_models.push(model);
				} else 
					keep_models.push(model);
			}, that);
			that.filteredModels = remove_models;
			// why is this Triggered?
			
			var addBack_photoIds = _.map(keep_models, function(v,k,l){
				return v.get('photoId');
			});
			that.add(keep_models, {merge: true, sort: true});
			galleryView.trigger('addBack', that, addBack_photoIds);
			
			// render page, then remove .fade-out 
			_.defer(function(){
				galleryView.$('.page .thumb.fade-out').removeClass('fade-out');
				that.trigger('refreshLayout');	
			});
			
			// check if fetch still required
			// is filter complete after addBack?
			
// NOTE: only tested for pager=timeline	
var pagerHelper;
switch (snappi.PAGER_STYLE) {
	case 'timeline': 
		pagerHelper = galleryView.Pager['Timeline']
		break;
	case 'placeline':
	case 'page':
	break;
}			
			options = pagerHelper['GalleryView'].getXhrFetchOptions(galleryView);
console.log(options.filters);
			// fetch() > Coll."sync" > success(), View.addPage() > complete()
			that.fetch({
				remove: false,
				data: options,
				success: function(){
console.info("Collection.filterChanged success()");
					// don't let addPage() add offscreen
					// how?					
				},
				complete: function() {
console.info("Collection.filterChanged complete()");					
					// timeline.fetched[] already marked as true
					// no one currently listening, maybe TimelineView?
					that.trigger('xhr-fetched');
				},
			});
		}
	}
};

var setup_DisplayOptions = {
	// override GalleryDisplayOptions.ui_defaults
	gallery_display_options_ui: {
		'size': [
			{label:'S', size: 100, active:'active' },
			{label:'M', size: 160,  },
			{label:'L', size: 240, },
		],
		'rating': [
			{label: 0, active:'active' },
		],
	}, 
	pager_ui: {
		direction: 'desc',
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
}


// put it all together at the bottom
extend(GalleryCollection);
	

})( snappi.collections, snappi.models, snappi.mixins, Backbone.Paginator);