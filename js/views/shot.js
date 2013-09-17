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
		'click .show-hidden-shot': 'onShowHiddenShot',
		'dblclick img': 'onShowPreview',
	},
	
	initialize: function(options){
		if( !views.ShotView.prototype.hasOwnProperty('template') ||
			!($.isFunction(this.template))
		) {
			var source = $(this.template_source).html();	
			// compile once, add to Class
			this.register_handlebar_helpers();
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
		_.defer(function(that, model){
			if (model.shotId) {
				// shot_index = that.hashShotId(model.shotId);
				// that.$el.addClass('shot-'+ shot_index);
				if (model.bestshotId == model.photoId) { 
					that.$('.thumb').addClass('bestshot');
				} else {
					throw "Error: views.ShotView created for hiddenshot";
					that.$('.thumb').addClass('hiddenshot');
				}
			}
			if (model.orientationLabel) that.$el.addClass(model.orientationLabel);
		}, this, m);
		return this;
	},
	
	
	onShowHiddenShot: function(e){
		e.preventDefault();
		var action = this.$el.hasClass('showing') ? 'hide' : 'show';
		switch (action) {
			case 'show':
				if (this.$el.hasClass('showing')) return;
console.info("show hiddenshot for id="+this.model.get('id'));
				this.collection.trigger('fetchHiddenShots', {
					model: this.model,
				});
				break;
			case 'hide':
				_.each(this.model.get('hiddenshot').models, function(model,k,l){
					if (!(model instanceof snappi.models.Shot)) {
						// get view from model Id
						model.trigger('hide');	// view.remove()
					}
				}, this);
				if (this.$el.removeClass('showing'));
				this.collection.trigger('pageLayoutChanged', null, this.$el);
				break;
		}
	},
	
	onFetchedHiddenshots: function(collection, response, options){
		console.info("Thumbview: fetchHiddenshots completed");
		this.$el.addClass('showing')
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