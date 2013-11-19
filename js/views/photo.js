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
	
	events: {	// delegate to GalleryView
		// 'click .rotate': 'onRotate',
		// 'click .rating': 'onRatingClick',
		// 'dblclick img': 'onShowPreview',
		// 'click .fa-heart': 'saveModelAsJson',
	},

	// for creating flickr/placeline bootstrap file
	saveModelAsJson: function(e){
		e.preventDefault();
		$(e.target).closest('.thumb').addClass('save');
		var models = snappi.collections.paginatedGallery.models,
			ids = [], 
			asJson=[];
		_.each($('.gallery .thumb.save'), function(e){
			var id = $(e).attr('id');
			var model = _.findWhere(models, {id:id})
			model = model.toJSON();
			model.zoom = 'world';
			asJson.push(model);
		})
		$("#json").html(JSON.stringify(asJson));
	},
	initialize: function(options){
		if(!($.isFunction(this.template))) {
			var source = $(this.template_source).html();	
			views.PhotoView.prototype.template = Handlebars.compile(source);
	    }
	    this.listenTo(this.model, 'hide', this.onHide);
	    this.listenTo(this.model, 'change:rating', this.onRatingChanged);
	},
	
	render: function(options){
		options = options || {};
		var m = this.model.toJSON(),
			isHiddenshot = this.model instanceof snappi.models.Hiddenshot; // m.shotId && m.shotCount;
		
		if (isHiddenshot) {
			var $wrap = $(this.template( m )),
				$thumb = this.$el;
			$thumb.html( $wrap.children() );  // do NOT wrap .thumb
			$wrap.remove();
			$thumb.attr('id', m.photoId)
				.addClass('thumb hiddenshot fade fade-out '+m.orientationLabel);	// required for no wrap
		} else { // Photo
			if (options.offscreen) {
				m.top = options.offscreenTop;
			}
			this.$el.html( this.template( m ) );
		}
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
	// use delegated event instead, called from GalleryView
	XXXonRatingClick: function(e){
		e.preventDefault();
		var target = e.target,
			value = $(target.parentNode).children().index(target)+1;
		this.model.rating(value);
	},
	
	onRatingChanged: function(model){
    	var markup = Handlebars.compile('{{#ratingStars rating}}{{/ratingStars}}')(model.changed);
    	this.$('a.rating').attr('title', 'rating: '+ model.changed.rating).html(markup);
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
		var that = this;
		this.$el.addClass('fade-out');
		_.delay(function(that){
			that.undelegateEvents();
			that.remove();
			// trigger ONE pageLayout AFTER remove
		}, snappi.TIMINGS.thumb_fade_transition, this)
	},

	


});

views.PhotoView.delegated_ratingClick = function(e, collection){
	e.preventDefault();
	collection = collection || this.collection;
	var $thumb = $(e.currentTarget).closest('.thumb');
	var modelId;
	if ($thumb.parent().hasClass('shot-wrap')) modelId = $thumb.parent().attr('id');
	else modelId = $thumb.attr('id');
	var model = _.findWhere(collection.models, {id: modelId});

	var star = e.target;
	var value = $(star.parentNode).children().index(star)+1;
	model.rating(value);
};

views.PhotoView.delegated_setFocus = function(e, $gallery){
	if ($gallery) $gallery.find('.thumb.focus').removeClass('focus');
	$(e.currentTarget).addClass('focus');
}

})( snappi.views );