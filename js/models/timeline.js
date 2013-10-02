// /js/models/timeline.js
(function ( models ) {
	

/*
 * Model: Timeline
 * properties
 * methods:
 */
// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	models.Timeline = Backbone.Model.extend(
		classDef
	);
}

var TimelineModel = {
	defaults: {
		
	}, 
	
	urlRoot: function() {
		// http://localhost:3000/timeline.json?period=month&userid=5013ddf3-069c-41f0-b71e-20160afc480d&type=wo%3A13&backend=node&rating=off&direction=desc&ownerid=51cad9fb-d130-4150-b859-1bd00afc6d44
		return 'http://'+snappi.mixins.Href.hostname()+'/timeline';	
	},	
	
	templates: {
	},
	
	// helper functions
	helper: {
	},
	
	// backbone methods
	parse: function( response ){
		response.id = response.photoId;
		if (!response.origW) response.origW = response.W;
		if (!response.origH) response.origH = response.H;
		return response;
	},
	
	initialize: function(attributes, options){
		attributes = this.parse.apply(this, arguments);	// manually call for static JSON
		this.set( attributes );
	},
	sync: function(method, model, options) {
		options = options || {}
		var useRestApi = true;
		switch (method) {
			case 'patch': case 'put': // append Wo attrs if necessary
			break;
		}
		var beforeSend = options.beforeSend;
		options.beforeSend = function(xhr, options){
			if (!useRestApi) options.url += '/.json';	// for CakePhp form
			if (beforeSend) return beforeSend.apply(this, arguments);
		}
	    Backbone.sync(method, model, options);
	},
	// public methods
	
}

// put it all together at the bottom
extend(TimelineModel);	

})( snappi.models );