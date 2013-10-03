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
		currentZoom: 'month',		// timeline zoom setting
		active: null,					// active "page" at currentZoom
		direction: 'desc',			// sort by most-recent
		periods: [],				// "pages"
		fetched: {},				// periods fetched in this session
	},
	
	xhr_defaults: {
		zoom: 'month',
		direction: 'desc',
	}, 
	
	urlRoot: function() {
		// http://localhost:3000/timeline.json?period=month&userid=5013ddf3-069c-41f0-b71e-20160afc480d&type=wo%3A13&backend=node&rating=off&direction=desc&ownerid=51cad9fb-d130-4150-b859-1bd00afc6d44
		var xhr = {
			baseurl: 'localhost:3000' 
		}
		var url = _.template('http://<%=baseurl%>/timeline.json?', xhr)+$.param(this.xhr_defaults);
		return url;	
	},	
	
	templates: {
		
	},
	
	// helper functions
	helper: {
		mergeQsParams: function(qs){
			var allowed = ['zoom', 'type', 'userid', 'ownerid', 'backend', 'direction', 'show-hidden', 'from', 'to', 'rating'];
			allowed.unshift(qs);
			return _.pick.apply(this, allowed );
		}
	},
	
	// backbone methods
	parse: function( response ){
		console.log("Timeline.parse");
		var attr = {};
		attr.periods = response.timeline;
		var toMySQLDate = function(m){
			// datestring with NO TZ conversion
			m.from = new Date(m.from_TS_UTC*1000).toISOString().substr(0,19).replace('T','%20');
			m.to = new Date(m.to_TS_UTC*1000).toISOString().substr(0,19).replace('T','%20');
		}
		_.each(attr.periods, function(v,k,l){
			toMySQLDate(v);
		});
		attr.currentZoom = response.request.zoom;
		attr.direction = response.request.direction;
		return attr;
	},
	
	initialize: function(attributes, options){
		this.xhr_defaults = _.defaults(this.helper.mergeQsParams(snappi.qs), this.xhr_defaults);
		this.set( attributes );
	},
	
	sync: function(method, model, options) {
		// options = _.defaults(options, this.xhr_defaults);
		// var useRestApi = true;
		// switch (method) {
			// case 'patch': case 'put': // append Wo attrs if necessary
			// break;
		// }
		// // var beforeSend = options.beforeSend;
		// // options.beforeSend = function(xhr, options){
			// // if (!useRestApi) options.url += '/.json';	// for CakePhp form
			// // if (beforeSend) return beforeSend.apply(this, arguments);
			// // else return true;
		// // }
	    Backbone.sync(method, model, options);
	},
	// public methods
	
}

// put it all together at the bottom
extend(TimelineModel);	

})( snappi.models );