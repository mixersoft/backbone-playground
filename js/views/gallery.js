// /js/views/gallery.js

var snappi = snappi || {};

/*
 * View: Gallery (same as App?)
 * properties:
 * methods:
 */

snappi.GalleryView = Backbone.View.extend({
	el: ".gallery .body",
	
	events: {
		
	},
	
	initialize: function(attributes, options){
		// _.bindAll(this);	// ???: what does this do?
		this.collection = new snappi.GalleryCollection();
		this.listenTo(this.collection, 'reset', this.reset);
	},
	
	reset: function() {
		this.render.apply(this, arguments);
	},
	
	renderers: {
		flickr: function(){
			var thumb,
				orphan = $('<div></div>');
			_.each(this.collection.models, function(v,k,l){
				// ???: render each ThumbView individually, or iterate in handlebars?
				thumb = new snappi.ThumbView({model:v});
				// ???: why are we serializing a rendered element
				// markup += thumb.$el.html();
				
				// ???: can't we just append jquery() objects
				// 		are ThumbView objects still valid after serializing?
				orphan.append(thumb.$el);
			}, this);
			// this.$el.html(markup);
			
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
			snappi.ImageMontage.render(orphan.children(), cfg);
			
			// for debugging
			this.introspect();
		},
	},
	
	render: function(){
		// TODO: move to GalleryCollection.render()
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