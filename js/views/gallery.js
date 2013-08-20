// /js/views/gallery.js

(function ( views ) {

/*
 * View: Gallery (same as App?)
 * properties:
 * methods:
 */

views.GalleryView = Backbone.View.extend({
	el: ".gallery .body",
	
	collection: null,
	
	events: {
		
	},
	
	initialize: function(attributes, options){
		// _.bindAll(this);	// ???: what does this do?
		var collection = this.collection;
		this.listenTo(collection, 'reset', this.addAll);
		this.listenTo(collection, 'all', this.render);
	},
	
	// called by paginator.nextPage() > paginator.pager()
	addAll : function() {
		var options = {
			offscreen : $('<div></div>'),
			defer: true,
		}
		this.$el.empty();
		this.collection.each(function(item){
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
			var paging = SNAPPI.CFG.JSON.data.CastingCall.Auditions,
				cfg = {
					page: paging.Page,
					perpage: paging.Perpage,
					pages: paging.Pages,
					total: paging.Total,
					count: paging.Audition.length,
					targetHeight: 160,
				};
			snappi.ImageMontage.render(parent.children(), cfg);
			
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
			models = (_gallery.collection instanceof Backbone.Paginator.clientPager)
				? this.collection.origModels
				: this.collection.models;
			$(el).find('img').get(0).raw = _.findWhere(auditions, {id: id});
			$(el).find('img').get(0).parsed = _.findWhere(models, {id: id}).toJSON();
		}, this);
	},
});


})( snappi.views );