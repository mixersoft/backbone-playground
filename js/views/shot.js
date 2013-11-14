// /js/views/shot.js

(function ( views ) {
	

/*
 * View: Photo
 * properties:
 * methods:
 */
views.ShotView = views.PhotoView.extend({
	tagName: "div",
	
	template_source: "#markup #ShotTemplate.handlebars",
	
	events: {	// delegate to GalleryView
		// 'click .show-hidden-shot': 'onHiddenshotToggle',
	},
	
	initialize: function(options){
		if( !views.ShotView.prototype.hasOwnProperty('template') ||
			!($.isFunction(this.template))
		) {
			var source = $(this.template_source).html();	
			views.ShotView.prototype.template = Handlebars.compile(source);
	    }
	    views.PhotoView.prototype.initialize.call(this, options);
	    this.collection = options.collection;
	    this.listenTo(this.model, 'fetchedHiddenshots', this.onFetchedHiddenshots )
	},
	
	render: function(options){
		options = options || {};
		var shot_index, 
			m = this.model.toJSON();
		if (options.offscreen) {
			m.top = options.offscreenTop;
		}	
		this.$el.html( this.template( m ) );
		this.$el.attr('id', m.shotId);
		this.$('.thumb').addClass('bestshot ' + m.orientationLabel);
		return this;
	},
});

/*
 * Protected attributes
 */

/*
* Static methods
*/
// called by parent View, views.GalleryView
views.ShotView.delegated_toggleHiddenshot = function(e, collection){
	e.preventDefault();
	collection = collection || this.collection;
	var $shot = $(e.currentTarget).closest('.shot-wrap');
	// var modelId =  $shot.attr('id');		// shotId
	var model = _.findWhere(collection.models, {id: $shot.attr('id')});
	var action = $shot.hasClass('showing') ? 'hide' : 'show';
	switch (action) {
		case 'show':
		// TODO: use deferred pattern?
			// triggers GallColl."fetchHiddenShots" 
			// 		> Shot."fetchedHiddenshots"
			//		> GallView."addedHiddenshots" 
			//			> GallView.addOne(), GallView.renderBody()
			collection.trigger('fetchHiddenShots', {
				model: model,
			});
			break;
		case 'hide':
			_.each(model.get('hiddenshot').models, function(model,k,l){
				if (!(model instanceof snappi.models.Shot)) {
					model.trigger('hide');	// PhotoView.onHide() calls remove()
				}
			});
			$shot.removeClass('showing');
			_.delay(function(){
				$shot.find('.thumb.bestshot').trigger('click');
				collection.trigger('pageLayoutChanged', null, {child: $shot});	
			}, snappi.TIMINGS.thumb_fade_transition)
			break;
	}
};

})( snappi.views );