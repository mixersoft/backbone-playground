// /js/views/gallerydisplayoptions.js

(function ( views, mixins ) {

views.GalleryDisplayOptionsView = Backbone.View.extend(
	
_.extend({}, mixins.UiActions, 
{
	el: "required",
	
	template_source: "#markup #GalleryDisplayOptions.underscore",
	
	defaults: {	// default settings
		'style': [{label:'Gallery',active:'active'},{label:'Filmstrip'},{label:'Lightbox',disabled:'disabled'}],
		'size': [{label:'S',active:'active'},{label:'M'},{label:'L'}],
	},
	
	events: {
		
	},
	
	initialize: function(){
		if(!($.isFunction(this.template))) {
			var source = $(this.template_source).html();	
			// compile once, add to Class
			var settings = { interpolate : /\{\{(.+?)\}\}/g, };
			views.GalleryDisplayOptionsView.prototype.template = _.template(source, null, settings);
	    }
	    this.render();
		
	},
	
	render: function(){
		this.$el.html( this.template( this.defaults ) );
	},
	
}));	

})( snappi.views, snappi.mixins );