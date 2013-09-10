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
		if(!($.isFunction(this.template))) {
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
		var shot_index, m = this.model.toJSON();
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
		var action = 'show';
		if (this.$('.thumb').is('.hiddenshot')) {
			action = 'hide';
		}
		switch (action) {
			case 'show':
console.info("show hiddenshot for id="+this.model.get('id'));			
				this.collection.trigger('fetchHiddenShots', {
					model: this.model,
				});
				break;
			case 'hide':
console.info("HIDE hiddenshot for id="+this.model.get('shotId'));			
				break;
		}
	},
	
	onFetchedHiddenshots: function(collection, response, options){
		console.info("Thumbview: fetchHiddenshots completed");
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