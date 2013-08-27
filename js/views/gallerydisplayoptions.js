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
	
	collection: "required",
	
	template_source: "#markup #GalleryDisplayOptions.underscore",
	
	ui_defaults: {	// default settings, override in this.collection.gallery_display_options_ui
		'style': [{label:'Gallery',active:'active'},{label:'Filmstrip'},{label:'Lightbox',disabled:'disabled'}],
		'size': [
			{label:'S', size: 100, active:'active' },
			{label:'M', size: 160, },
			{label:'L', size: 240, },
		],
	},
	
	events: {
		'click .size.btn-group .btn':'onSetThumbSize',
		'click .style.btn-group .btn':'onSetLayout',
		'change .sort':'onFilter',
		'change .filter':'onSort',
	},
	
	initialize: function(){
		var source = $(this.template);
		var settings = { interpolate : /\{\{(.+?)\}\}/g, };
		this.template = _.template($(this.template_source).html(), null, settings);
		var setup = _.extend(this.ui_defaults, this.collection.gallery_display_options_ui);
		this.collection.gallery_display_options_ui = setup; 
	    this.render();
		this.listenTo(this.collection, 'refreshLayout', this.render);
	},
	
	render: function(){
		console.log('render display options');
		// note: the 'model' comes from requestPager.collection.gallery_display_options_ui?
		this.$el.html( this.template( this.collection.gallery_display_options_ui ) );
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
	onFilter: function(){
		// also check PagerView.getFilterField/getFilterValue()/filter()
	},
	onSort: function(){
		// also check PagerView.sortByAscending()
	},
	
}

// put it all together at the bottom
extend(GalleryDisplayOptionsView);	

})( snappi.views, snappi.mixins );