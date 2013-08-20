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
		this.listenTo(collection, 'reset', this.addAll);
		
		var serverPaging = SNAPPI.CFG.JSON.data.CastingCall.Auditions,
			paginator_ui = this.collection.paginator_ui;
		paginator_ui.totalPages = Math.ceil(serverPaging.Total / paginator_ui.perPage);
		// this.listenTo(collection, 'all', this.render);
	},
	
	// called by paginator.nextPage() > paginator.pager()
	addAll : function(models, options) {
		options = $.extend(options || {}, {
			offscreen : $('<div></div>'),
			defer: true,
		});
		
		/*
		 * TODO: do NOT empty page
		 * preserve collection models in GalleryCollection.reset()
		 * then render NEW ThumbViews BELOW current page
		 */
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
			var serverPaging = SNAPPI.CFG.JSON.data.CastingCall.Auditions,
				paginator_ui = this.collection.paginator_ui,
				cfg = {
					page: paginator_ui.currentPage,
					perpage: paginator_ui.perPage,
					pages:  Math.ceil(serverPaging.Total / paginator_ui.perPage),
					total: serverPaging.Total,			// total count on server
					count: parent.children().length,	// count in this request
					targetHeight: 160,
				};
			snappi.ImageMontage.render(parent.children(), cfg);
			// update after request/render
			paginator_ui.totalPages = cfg.pages;
			paginator_ui.currentPage = snappi.ImageMontage.instance.cfg.page;
			
			// for debugging
			this.introspect();
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
		var auditions = SNAPPI.CFG.JSON.data.CastingCall.Auditions.Audition;
		_.each(this.$('div.thumb'), function(el,k,l) {
			var id = $(el).attr('id'),
				models;
			models = (this.collection instanceof Backbone.Paginator.clientPager)
				? this.collection.origModels
				: this.collection.models;
			$(el).find('img').get(0).raw = _.findWhere(auditions, {id: id});
			$(el).find('img').get(0).parsed = _.findWhere(models, {id: id}).toJSON();
		}, this);
	},
});


})( snappi.views );