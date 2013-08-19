// /js/views/thumbnail.js

var snappi = snappi || {};

/*
 * View: Photo
 * properties:
 * methods:
 */
snappi.ThumbView = Backbone.View.extend({
	tagname: "div",
	
	template_source: "#markup #ThumbTemplate.handlebars",
	
	events: {
		
	},
	
	initialize: function(){
		if(!($.isFunction(this.template))) {
			var source = $(this.template_source).html();	
			// compile once, add to Class
			snappi.ThumbView.prototype.template = Handlebars.compile(source);
	    }
		this.render();
	},
	
	render: function(){
		this.$el.html( this.template( this.model.toJSON() ) );
	},
});