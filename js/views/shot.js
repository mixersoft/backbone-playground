// /js/views/photo.js

(function ( views ) {
	

/*
 * View: Photo
 * properties:
 * methods:
 */
views.ShotView = views.PhotoView.extend({
	tagName: "div",
	
	template_source: "#markup #ShotTemplate.handlebars",
	
	events: {
		'click .rotate': 'onRotate',
		'click .rating': 'onRatingClick',
		'click .show-hidden-shot': 'onHiddenshotToggle',
		'dblclick img': 'onShowPreview',
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
	
	
	onHiddenshotToggle: function(e){
		e.preventDefault();
		var that = this, 
			action = this.$el.hasClass('showing') ? 'hide' : 'show';
		switch (action) {
			case 'show':
// console.info("show hiddenshot for id="+this.model.get('id'));
				// triggers GallColl."fetchHiddenShots" 
				// 		> Shot."fetchedHiddenshots"
				//		> GallView."addedHiddenshots" 
				//			> GallView.addOne(), GallView.renderBody()
				this.collection.trigger('fetchHiddenShots', {
					model: this.model,
				});
				break;
			case 'hide':
				// immediate, no XHR request, triggers PhotoView."hide"
				_.each(this.model.get('hiddenshot').models, function(model,k,l){
					if (!(model instanceof snappi.models.Shot)) {
						model.trigger('hide');	// PhotoView.onHide() calls remove()
					}
				}, this);
				this.$el.removeClass('showing');
				_.delay(function(){
					that.collection.trigger('pageLayoutChanged', null, that.$el);	
				}, snappi.TIMINGS.thumb_fade_transition)
				break;
		}
	},
	// deprecate, ???: are model listenTos delegated?
	onFetchedHiddenshots: function(collection, response, options){
		// this.$el.addClass('showing')
		console.info("???: are View.listenTo(model) bindings delegated?");
	},
	
});

/*
 * Protected attributes
 */
// var _shotHash = {};
// var _shotCounter = 1;
// views.ShotView.prototype.hashShotId = function(shotId){
	// if (!_shotHash[shotId])	_shotHash[shotId]=_shotCounter++;
	// return _shotHash[shotId];
// }

})( snappi.views );