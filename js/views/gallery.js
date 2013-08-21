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
		$(window).on('scroll', $.proxy(this.onContainerScroll, this));
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
	
	/**
     * Called on the scroll event of the container element.  Used only in the non-paginated mode.
     * When the scroll threshold is reached a new page of thumbs is requested.
     * @param event e - the scroll event object
     */
    onContainerScroll : Cowboy.throttle( 250,function(e) {
    	self = this;
        var containerHeight = self.$el.outerHeight(), //_outerContainer.outerHeight;
        	outerContainerHeight =  $(window).outerHeight(),
       		scrollTop = $(window).scrollTop()
       		collection = self.collection;
        
        if((containerHeight-scrollTop) <= outerContainerHeight 
        	&& (collection.currentPage+1) <= collection.totalPages
        ) {
        	// $(window).off('scroll',self.onContainerScroll);
        	$(window).off('scroll');
        	console.info("fetch next, page="+(collection.currentPage+1));
            self.collection.nextPage({ merge: true, remove: false });
        }
        
        if((collection.currentPage+1) > collection.totalPages
        	&& collection.models.length  
        ) {
			// $(window).off('scroll',self.onContainerScroll);
			$(window).off('scroll');
	    }
    }),
	
	renderers: {
		flickr: function(parent){
			// add flickr style from flickr.js
			var qs = snappi.mixins.Href.parseQueryString();

			// requestPager
			var paging = this.collection.info(),
				cfg = {
					page: paging.currentPage,
					perpage: paging.perPage,
					pages: paging.totalPages,
					total: paging.totalRecords,
					targetHeight: qs.size || 160,
				};
			snappi.ImageMontage.render(parent.children(), cfg);	
		},
	},
	/**
 	 * @param {jquery} container, jquery obj holding rendered items, may be offscreen
	 */
	render: function(container){
		container = container || this.$el;
		var collection = this.collection;	
		collection.rendered = collection.rendered || {}; 
		if (!collection.rendered[collection.currentPage]) {
			/*
			 * the actual render statement
			 */
			this.renderers['flickr'].apply(this, arguments);
			/*
			 */
			collection.rendered[collection.currentPage]=true;
			this.$el.css('min-height', $(window).outerHeight()-160);
			
			// for debugging
			if (_DEBUG) this.introspect();
		} else {
			console.log("page already rendered, scroll to page location, page="+collection.currentPage);
		}
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