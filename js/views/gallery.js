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
		this.listenTo(this.collection, 'reset', this.render);
	},
	
	render: function(){
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
	// debugging
	introspect: function() {
		var auditions = SNAPPI.CFG.JSON.data.CastingCall.Auditions.Audition;
		_.each(this.$('div.thumb'), function(el,k,l) {
			var id = $(el).attr('id');
			$(el).find('img').get(0).raw = _.findWhere(auditions, {id: id});
			$(el).find('img').get(0).parsed = _.findWhere(this.collection.models, {id: id}).toJSON();
		}, this);
	},
});