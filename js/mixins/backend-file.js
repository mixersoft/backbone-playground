(function ( mixins ) {

var File = {
	url: function(){ // hijack xhr, just add new models
		this.listenToOnce(this, 'request', function(collection, xhr, queryOptions){
			var collection = this, 
				models = collection.parse();
			collection.fetchedServerPages[collection.currentPage]=true  
			_.each(models, function(item){
				collection.models.push(item);
			});
			collection.trigger('sync', collection.models);
		});
		return false;
	},
	parsed: null,	// just parse once
	parse: function(json){
		var collection = this;
		if (!Backend['file'].parsed) {
			var paging = json.response.castingCall.CastingCall.Auditions,
				serverPaging = {
					page: collection.currentPage || snappi.qs.page || paging.Page,
					perpage: snappi.qs.perpage || paging.Perpage,
					pages: paging.Pages,
					total: paging.Total,
					count: snappi.qs.perpage || paging.Audition.length,
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
			this.currentPage = serverPaging.page;
			this.totalRecords = serverPaging.total;
			this.totalPages = serverPaging.pages;
			
			
			var parsed = this.parseShot_CC(json.response.castingCall); // from mixin
			Backend['file'].parsed = parsed;
		}
		// slice response to match page/perpage 
		var start = ((collection.currentPage || serverPaging.page) -1) * collection.perPage,
			end = start + collection.perPage ,
			photos = [],
			i=-1;
		_.each(Backend['file'].parsed, function(v, k, l) {
			if (++i < start) return true;
			if (i >= end) return false;
			v.requestPage = Math.ceil(i/collection.perPage);
			if (v.shotId) photos.push(new models.Shot(v));
			else photos.push(new models.Photo(v));
		});
		return photos;
	},
}

var Backend = _.extend(mixins.BackendHelpers && mixins.BackendHelpers['Backend']  || {}, {
	'File': File,
});
mixins.BackendHelpers = mixins.BackendHelpers || {Backend:{}};
mixins.BackendHelpers['Backend'] = Backend;
var check;
})( snappi.mixins);