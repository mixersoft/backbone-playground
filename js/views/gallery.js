// /js/views/gallery.js

(function ( views ) {

/*
 * View: Gallery (same as App?)
 * properties:
 * methods:
 */

views.GalleryView = Backbone.View.extend({
	el: ".gallery",
	
	collection: null,	// Backbone.Paginator
	
	templates: {
		pageTemplate: _.template('<div class="page" data-page="<%=currentPage%>"></div>'),
	},
	
	events: {
		'keypress .body': 'onKeyPressNav',
		'click .display-options': 'toggleDisplayOptions', 
		'scroll window': 'onContainerScroll',	// not sure this is valid 
	},
	
	initialize: function(attributes, options){
		this.render();
		
		var collection = this.collection;
		this.listenTo(collection, 'reset', this.addAll);
		this.listenTo(collection, 'relayout', this.relayout);
		this.listenTo(collection, 'sync', this.addPage);
		
		
		// calls colletion.sync and makes request from DB
		collection.pager({ remove: false });
		
	},
	
	render: function(){
		/*
		 * create delegated views
		 */
		this.pager = new views.PagerView({
			el: this.$('.header .pager'),
			collection : this.collection,
		});
		this.displayOptions = new views.GalleryDisplayOptionsView({
			el: this.$('.header .display-options'),
			collection : this.collection,
		});
	},
	
	relayout: function(options) {
		options = options || {};
		$(window).off('scroll');	// will enable after renderBody?
		var displayOptions = this.collection.gallery_display_options_ui;
			var active = _.findWhere(displayOptions.size, {active:'active'});
		snappi.ImageMontage.instance.relayout(null, active.size);
		$(window).on('scroll', $.proxy(this.onContainerScroll, this));
		return;
		
		var thumbEls = this.$('.body .thumb');
		var pages = _.keys(this.collection.rendered);
		pages.sort();
		var batch, count, 
			start = 0;
		_.each(pages, function(i){
			count = this.collection.rendered[i];
			batch = thumbEls.slice(start, count);
			start = count;
			// this.bodyRenderers['flickr'].call(this, batch, options);
		}, this);
		
		// don't do this twice
		// $(window).on('scroll', $.proxy(this.onContainerScroll, this));
	},
	
	addAll : function(models, options) {
		
	},
	
	// called by paginator.nextPage() > paginator.pager() > 'sync'
	addPage : function(models, options) {
		options = $.extend(options || {}, {
			offscreen : $('<div></div>'),	// build page in orphaned el
		});
		
		/*
		 * NOTE: use collection.pager({remove: false}) to append new models 
		 */
		var collection = this.collection; 
		if (typeof options.skip == 'undefined') options.skip = (collection.currentPage-1) * collection.perPage;
		_.each(collection.models, function(item,k,l){
			if (k < (options.skip||0)) return; 
			this.addOne(item, options);
		}, this);
		this.renderBody(options.offscreen);
		$(window).on('scroll', $.proxy(this.onContainerScroll, this));
	},
	
	/**
	 * @param models.Shot item
	 * @param options { 
	 * 		offscreen: jquery container to append rendered view 
	 * }  
	 */
	addOne : function( item, options ) {
		thumb = new views.ThumbView({model:item});
		if (!!options && options.offscreen ){
			// from addPage()
			options.offscreen.append(thumb.render().el);
		} else {
			this.$('.body').append(thumb.render().el);
		}
	},
	
	onKeyPressNav: function(){
		// PageDown call onContainerScroll?
		
	},
	
	onSetPerpage: function(){
		// calls this.collection.howManyPer()
		// also called from PagerView.changeCount()
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
	bodyRenderers: {
		Typeset: function(container, items){
			var layoutState,
				displayOptions = this.collection.gallery_display_options_ui,
				displayOptionSize = _.findWhere(displayOptions.size, {active:'active'});
				
			var layoutOptions = {
				outerContainer: this.$el,
				thumbsContainer: container || this.$('.body'),		// or .body .page[data-page=N]
				targetHeight: displayOptionSize.size,
				_layout_y: 0,			// start at top
			}	 
			var layout = snappi.mixins.LayoutEngine.Typeset.run.call(this, 
				container, 
				items,				// if null, will layout all .thumbs IMG in container
				this.collection,
				layoutOptions
			);
			// append, if necessary
            if (!$.contains(container.get(0), layout.items.get(0))) {
            	container.append(layout.items);
            }
            
            return layout.state;
		},
		// deprecate
		flickr: function(items, options){
			// add flickr style from flickr.js
			var qs = snappi.mixins.Href.parseQueryString();

			// requestPager
			var paging = this.collection.info(),
				cfg = {
					page: paging.currentPage,
					perpage: paging.perPage,
					pages: paging.totalPages,
					total: paging.totalRecords,
				};
			options = _.extend(options || {}, cfg);
				
			var displayOptions = this.collection.gallery_display_options_ui;
			var active = _.findWhere(displayOptions.size, {active:'active'});
			options.targetHeight = active.size;
			snappi.ImageMontage.render(items, options);	
		},
	},
	/**
	 * render gallery body  
 	 * @param {jquery} container, jquery obj holding rendered items, may be offscreen
 	 * 		if offscreen, don't forget to append to this.$('.body')
	 */
	renderBody: function(container){
		console.log('render Gallery Body');
		var collection = this.collection;
		
		var pageContainer = this.$('.body .page[data-page="'+collection.currentPage+'"]');
		if (pageContainer.length && container.children().length == 0) {
			// page rendered, just scroll
			this.$el.scrollTop(pageContainer.position().top);
			
		} else if (pageContainer.length && container.children().length) {
			// page rendered, add new items to page
			
		} else if (pageContainer.length==0) {
			pageContainer = $(this.templates.pageTemplate(collection))
			var p, 
				currentPage = collection.currentPage,
				body = this.$('.body'),
				pages = body.find('.page');
			for (var i=pages.length-1; i>-1 ; i--) {
				if (pages.eq(i).data('page')<currentPage) {
					body.append(pageContainer);
					currentPage = 'inserted';
					break;	
				};
			}	
			if (currentPage != 'inserted') body.prepend(pageContainer);
		} 
		
		/*
		 * the actual render statement
		 */
		var layoutState = this.bodyRenderers['Typeset'].call(this, pageContainer, container.children());
		/*
		 * end
		 */
		this.$el.css('min-height', $(window).outerHeight()-160);
			
		// for debugging
		if (_DEBUG) this.introspect();
		return;
		
		// deprecate
		collection.rendered = collection.rendered || {}; 	// keep track of pages rendered
		if (!collection.rendered[collection.currentPage]) {
			/*
			 * the actual render statement
			 */
			var pageContainer = this.$('.body .page[data-page="'+collection.currentPage+'"]');
			if (pageContainer.length==0) {
				pageContainer = $(this.templates.pageTemplate(collection)).appendTo(this.$('.body'));
			}
			var layoutState = this.bodyRenderers['Typeset'].call(this, pageContainer, container.children());
			/*
			 */
			collection.rendered[collection.currentPage]=layoutState;
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