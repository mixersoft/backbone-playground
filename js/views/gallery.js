// /js/views/gallery.js

(function ( views ) {

/*
 * View: Gallery (same as App?)
 * properties:
 * methods:
 */

views.GalleryView = Backbone.View.extend({
	el: ".gallery .body",
	
	collection: null,	// Backbone.Paginator
	
	events: {
		
	},
	
	initialize: function(attributes, options){
		// _.bindAll(this);	// ???: what does this do?
		var collection = this.collection;
		// this.listenTo(collection, 'reset', this.addAll);
		this.listenTo(collection, 'sync', this.addAll);
		collection.pager({ remove: false });
		
		return;
		// this.listenTo(collection, 'all', this.render);
	},
	
	// called by paginator.nextPage() > paginator.pager()
	addAll : function(models, options) {
		options = $.extend(options || {}, {
			offscreen : $('<div></div>'),
			defer: true,
		});
		
		/*
		 * NOTE: use collection.pager({remove: false}) to append new models 
		 */
		var collection = this.collection; 
		options.skip = (collection.currentPage-1) * collection.perPage;
		if (!options.skip) this.$el.empty();
		_.each(this.collection.models, function(item,k,l){
			if (k < (options.skip||0)) return; 
			this.addOne(item, options);
		}, this);
		this.render(options.offscreen);
	},
	
	/**
	 * @param models.Shot item
	 * @param options { 
	 * 		container: jquery container to append rendered view 
	 * 		defer: boolean, default false, do NOT call this.render() if true
	 * }  
	 */
	addOne : function( item, options ) {
		var container = !!options && options.offscreen || this.$el,
			thumb = new views.ThumbView({model:item});
		container.append(thumb.render().el);
		if (!!options && !options.defer) this.render(container);
	},
	
	renderers: {
		flickr: function(parent){
			// add flickr style from flickr.js
			var qs = snappi.mixins.Href.parseQueryString();

			// requestPager
			var collection = this.collection,
				paging = collection.info(),
				cfg = {
					page: paging.currentPage,
					perpage: paging.perPage,
					pages: paging.totalPages,
					total: paging.totalRecords,
					targetHeight: qs.size || 160,
				};
			collection.rendered = collection.rendered || {}; 
			if (!collection.rendered[cfg.page]) {
				snappi.ImageMontage.render(parent.children(), cfg);	
				collection.rendered[cfg.page]=true;
			} else {
				console.log("page already rendered, scroll to page location");
			}
			
			// for debugging
			if (_DEBUG) this.introspect();
		},
	},
	/**
 	 * @param {jquery} container, jquery obj holding rendered items, may be offscreen
	 */
	render: function(container){
		container = container || this.$el;	
		var layout = 'flickr';
		this.renderers[layout].apply(this, arguments);
	},
	// debugging
	introspect: function() {
		var auditions = SNAPPI.Auditions;
		_.each(this.$('div.thumb'), function(el,k,l) {
			var id = $(el).attr('id'),
				models;
			models = (this.collection instanceof Backbone.Paginator.clientPager)
				? this.collection.origModels
				: this.collection.models;
			$(el).find('img').get(0).raw = auditions[id];
			$(el).find('img').get(0).parsed = _.findWhere(models, {id: id}).toJSON();
		}, this);
	},
});


})( snappi.views );