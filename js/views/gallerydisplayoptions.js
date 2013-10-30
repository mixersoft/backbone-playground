// /js/views/gallerydisplayoptions.js

// called by GalleryView

(function ( views, mixins ) {

// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	views.GalleryDisplayOptionsView = Backbone.View.extend(
		_.extend({}, mixins.UiActions, classDef)
	);
}

// define classDef as Object for IDE introspection
var GalleryDisplayOptionsView = {

	el: "required",

	pager: "required",	
	collection: "required",
	
	template_source: "#markup #GalleryDisplayOptions.handlebars",
	
	ui_defaults: {	// default settings, override in this.collection.gallery_display_options_ui
		'style': [
			{label:'Gallery', active:'active'},
			{label:'Filmstrip'},
			{label:'Lightbox', disabled:'disabled'}
		],
		'size': [
			{label:'S', size: 100, active:'active' },
			{label:'M', size: 160, },
			{label:'L', size: 240, },
		],
		'rating': [
			{label: 0, active:'active' },
		],
	},
	
	ui_settings: {},
	
	events: {
		'click .size.btn-group .btn':'onSetThumbSize',
		'click .style.btn-group .btn':'onSetLayout',
		'click .filter': 'onFilterClick',
		'change .filter':'onFilterChanged',
	},
	
	initialize: function(attributes, options){
		this.pager = attributes.pager;
		if(!($.isFunction(this.template))) {
			var source = $(this.template_source).html();	
			views.GalleryDisplayOptionsView.prototype.template = Handlebars.compile(source);
	    }
		
		// initialize with querystring/GalleryCollection override
		this.ui_settings = _.extend(this.ui_defaults, this.collection.gallery_display_options_ui);
		var qs = mixins.Href.parseQueryString();
		if (qs.size) {	// override display-option size from url
			_.map(this.ui_settings.size, function(o){
				o.active = (o.label == qs.size.toUpperCase()) ? 'active' : '';
			});
		}
		
	    this.render();
		this.listenTo(this.collection, 'refreshLayout', this.render);
	},
	
	render: function(){
		// note: the 'model' comes from requestPager.collection.gallery_display_options_ui
		this.$el.html( this.template( this.ui_settings ) );
	},
	
	
	onSetThumbSize: function(e){
		e.preventDefault();
		// update collection.gallery_display_options_ui
		var label = $(e.target).text()
		var displayOptions = this.collection.gallery_display_options_ui;
		_.map(displayOptions.size, function(o){
			o.active = (o.label == label) ? 'active' : '';
		});
		// trigger gallery refreshLayout without deleting ThumbView
		this.collection.trigger('refreshLayout');
		this.render();
	},
	onSetLayout: function(){
		// gallery, filmstrip, lightbox
	},
	onSetLayoutEngine: function(){
		// grid, flickr, isotope, or filmstrip layout
	},
	onFilterClick: function(e){
// console.info("filter rating clicked");
		var changed = {};
		switch ($(e.currentTarget).data('filter')) {
			case "rating": 
				var STAR_W = 11, 
					PADDING_LEFT = 10,
					$target = $(e.target),
					targetX = e.clientX - $target.offset().left,
					value = Math.ceil((targetX - PADDING_LEFT)/STAR_W);
					changed['rating'] = value;
					this.ui_settings['rating'][0].label = value;
			break;
		}
		this.pager.set('filters', changed, {validate:true});
		// if (filters['changed']) this.pager.set('filters', filters);
	},
	onFilterChanged: function(filter){
		// console.log("GalleryDisplayOptions Filter changed");
	},
	onSort: function(){
		// also check PagerView.sortByAscending()
	},
	
}

// put it all together at the bottom
extend(GalleryDisplayOptionsView);	

})( snappi.views, snappi.mixins );