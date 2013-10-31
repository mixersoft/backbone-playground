(function ( mixins, models ) {

var File = {
	datatype: null,		// for $.ajax request dataType
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
		if (!Backend['File'].parsed) {
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
			Backend['File'].parsed = parsed;
		}
		// slice response to match page/perpage 
		var perpage = parseInt(collection.perPage || serverPaging.perpage),
			start = ((collection.currentPage || serverPaging.page) -1) * perpage,
			end = start + perpage;

		var hash = Backend['File'].parsed,
			keep = _.first(_.keys(hash), end),
			photos = [],
			attr, m;
			_.each(keep, function(id,i,l){
				if (i>=start) {
					attr = hash[id];
					attr.requestPage = Math.ceil( i / perpage );
					if (attr.shotId) m = new models.Shot(attr);
					else m = new models.Photo(attr);
					photos.push(m);
				}
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
})( snappi.mixins, snappi.models);