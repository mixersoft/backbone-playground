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
		var markup='', thumb;
		_.each(this.collection.models, function(v,k,l){
			thumb = new snappi.ThumbView({model:v});
			markup += thumb.$el.html();
		}, this);
		this.$el.html(markup);
	},
});