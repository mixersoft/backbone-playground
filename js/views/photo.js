// /js/views/photo.js

(function ( views ) {
	

/*
 * View: Photo
 * properties:
 * methods:
 */
views.PhotoView = Backbone.View.extend({
	tagName: "div",
	
	template_source: "#markup #PhotoTemplate.handlebars",
	
	events: {
		'click .rotate': 'onRotate',
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
		Handlebars.registerHelper('fullText', function(string, options) {
			if (string.length > options.length)
			return options.fn();
		});
	},
	
	initialize: function(options){
		if(!($.isFunction(this.template))) {
			var source = $(this.template_source).html();	
			// compile once, add to Class
			this.register_handlebar_helpers();
			views.PhotoView.prototype.template = Handlebars.compile(source);
	    }
	    this.listenTo(this.model, 'hide', this.onHide);
	},
	
	render: function(options){
		var m = this.model.toJSON();
		if (options.wrap === false) {		// do NOT wrap hiddenshots
			var $wrap = $(this.template( m ));
			this.$el.html( $wrap.children() );
			this.$el.attr('id', m.photoId).addClass('thumb');
		} else {
			if (options.offscreen) {
				m.top = options.offscreenTop;
			}
			this.$el.html( this.template( m ) );
		}
		_.defer(function(that, model){
			if (m.shotId && m.shotCount) {
				// shot_index = views.ShotView.prototype.hashShotId(model.shotId);
				// that.$el.addClass('shot-'+ shot_index);
				if (m.bestshotId == m.photoId) { 
					// that.$('.thumb').addClass('bestshot');
					throw "Error: got models.Shot when expecting models.Photo";
				} else if (that.$el.is('.thumb')) {
					that.$el.addClass('hiddenshot');
				} else {
					that.$('.thumb').addClass('hiddenshot');
				}
			}
		}, this, this.model);
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
	
	onHideHiddenshotComplete: function(collection, response, options){
		console.info("Photoview: onHideHiddenshotComplete completed");
	},
	
	onHide : function(){
		this.remove();
	}
});


})( snappi.views );