(function ( mixins, models ) {
	"use strict";

var File = {
	datatype: null,		// for $.ajax request dataType
	url: function(){ // bypass sync entirely
		return false;
	},
	sync: function(method, model, options) {
		var collection = this;
		var deferred = new $.Deferred();
		_.defer(function(){
			collection.trigger('request');
			if ( collection.fetchedServerPages && collection.fetchedServerPages[collection.currentPage] ) {
				deferred.resolve().then(function(){
					collection.trigger('change:page');
				});
				return deferred;
			}
			var paginatedModels = collection.parse();
			options.parse = false;	// don't parse again in options.success()
			collection.fetchedServerPages[collection.currentPage]=true;  
			if (_.isFunction(options.success)) options.success(paginatedModels);
			deferred.resolve();
		});
		return deferred;
	},
	parsed: null,	// just parse once
	parse: function(){
		var collection = this,
			paging, serverPaging;
		if (!Backend['File'].parsed) { // parse everything the first time
			var user = snappi.qs.owner || 'venice';	// valid = [venice|mb|2011]
			var json = JSON.parse(SNAPPI.CFG.JSON[user].raw);
			paging = json.response.castingCall.CastingCall.Auditions;
			serverPaging = {
				page: collection.currentPage || snappi.qs.page || paging.Page,
				perpage: snappi.qs.perpage || paging.Perpage,
				pages: null,
				total: paging.Total,
				count: snappi.qs.perpage || paging.Audition.length,
				targetHeight: 160,
			};
			serverPaging.pages = Math.ceil( serverPaging.perpage);
				
			// config image server for this request
			snappi.mixins.Href.imgServer({
				baseurl: paging.Baseurl,
			});
				
			// for clientPaging	
			this.paginator_ui.serverPaging = serverPaging;
			if (!this.fetchedServerPages) this.fetchedServerPages = {};
			this.firstPage = 1; 
			this.currentPage = serverPaging.page;
			this.totalRecords = serverPaging.total;
			this.totalPages = Math.ceil(serverPaging.total / this.paginator_ui.perPage);
			this.lastPage = this.totalPages; 
			this.pagesInRange = this.paginator_ui.pagesInRange;	// ???:not being set
			
			
			var parsed = this.parseShot_CC(json.response.castingCall); // from mixin
			File.parsed = parsed;
		} else {
			serverPaging = collection.paginator_ui.serverPaging;
		}
		// slice response to match page/perpage 
		var perpage = parseInt(collection.perPage || serverPaging.perpage),
			start = ((collection.currentPage || serverPaging.page) -1) * perpage,
			end = start + perpage;

		var hash = Backend['File'].parsed,
			keep = _.first(_.keys(hash), end),
			photos = [],
			attr, m;
		for (var i=start;i<keep.length;i++){	// use i to calc requestPage
			attr = hash[keep[i]];
			attr.requestPage = Math.ceil( i / perpage );
			if (attr.shotId) m = new models.Shot(attr);
			else m = new models.Photo(attr);
			photos.push(m);
		};
		return photos;
	},
};

var Backend = _.extend(mixins.BackendHelpers && mixins.BackendHelpers['Backend']  || {}, {
	'File': File,
});
mixins.BackendHelpers = mixins.BackendHelpers || {Backend:{}};
mixins.BackendHelpers['Backend'] = Backend;
var check;
})( snappi.mixins, snappi.models);