// /js/views/thumbnail.js

(function ( views ) {
	

/*
 * View: Photo
 * properties:
 * methods:
 */
views.ThumbView = Backbone.View.extend({
	tagname: "div",
	
	template_source: "#markup #ThumbTemplate.handlebars",
	
	events: {
		'click .rotate': 'onRotate',
		'click .show-hidden-shot': 'onShowHiddenShot',
		'dblclick img': 'onShowPreview',
	},
	
	register_handlebar_helpers : function(){
		Handlebars.registerHelper('ratingStars', function(rating, options) {
			var rating = rating || 0, out = "";
			for(var i=1; i<=5; i++) {
				out = out + "<icon class='icon-star"+(i>rating ? "-empty" : "")+"'></icon>";
			}
		  	return out;
		});
	},
	
	initialize: function(){
		if(!($.isFunction(this.template))) {
			var source = $(this.template_source).html();	
			// compile once, add to Class
			this.register_handlebar_helpers();
			views.ThumbView.prototype.template = Handlebars.compile(source);
	    }
	},
	
	render: function(){
		this.$el.html( this.template( this.model.toJSON() ) );
		this.$el.attr('id', this.model.get('id')).addClass('thumb');
		if (this.model.get('orientationLabel')) this.$el.addClass(this.model.get('orientationLabel'));
		// this.$('.show-hidden-shot').on('click',this.onShowHiddenShot);
		// this.$el.on('click', this.clicked);
		return this;
	},
	
	setFocus: function(e){
		e.preventDefault();
		this.trigger(this.collection,'changeFocus');	// ???: do we know about the parent?
	},
	
	// ???: gallery method
	onRotate: function(e){
		e.preventDefault();
	},
	
	onShowToolbar: function(e){
		e.preventDefault();
		console.info("showToolbar");
	},
	
	onShowPreview: function(e){
		e.preventDefault();
	},
	
	onShowHiddenShot: function(e){
		e.preventDefault();
		console.info("hidden shot clicked for id="+this.model.get('id'));
	}
});

})( snappi.views );