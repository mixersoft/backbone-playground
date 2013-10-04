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
		filters: {
			zoom: 'month',
		},				// filters, exclude time
	},
	
	xhr_defaults: {
		direction: 'desc',
		userid: '5013ddf3-069c-41f0-b71e-20160afc480d', // manager
		ownerid: "51cad9fb-d130-4150-b859-1bd00afc6d44", // melissa-ben
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
		pickQsDefaults: function(qs){
			var options, allowed = ['type', 'userid', 'ownerid', 'backend', 'direction'];
			allowed.unshift(qs);
			options = _.pick.apply(this, allowed );
			return options;
		},
		pickQsFilters: function(qs){
			var allowed = ['zoom', 'show-hidden', 'rating', 'from', 'to'];
			allowed.unshift(qs);
			return _.pick.apply(this, allowed );
		},
		/**
		 *  get period from timeline
		 *  @param i int (optional) selected period, default active
		 */  
		getActive: function(model, i){
			model = model.toJSON();
			if (i!==0) i = i || model.active;
			model.currentPeriod = model.periods[i];
			return model;
		},
		
		/** 
		 * set model.fetched={} to track fetched periods
		 * @param that TimelineView, use this when calling
		 * @param i int, index of fetched period, usually model.active
		 */
		setFetched: function(that, i){
			var model = that.toJSON();
			if (i!==0) i = i || model.active;
			// set by reference, "deep-copy" attr 
			model.fetched[TimelineModel.helper.getFetchedKey(i, model)] = "check filter to confirm";
			return model;
		},
		getFetchedKey: function(i, model){
			model = model || this.toJSON();
			i = i || model.active;
			period = model.periods[i];
			return period.period+'-'+model.currentZoom;
		},
		isFetched: function(i, model){
			model = model || this.toJSON();
			i = i || model.active;
			return model.fetched[TimelineModel.helper.getFetchedKey(i, model)];
		},
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
		this.xhr_defaults = _.defaults(this.helper.pickQsDefaults(snappi.qs), this.xhr_defaults);
		// type overrides ownerid
		if (this.xhr_defaults.type) delete this.xhr_defaults.ownerid;
		this.set('filters', this.helper.pickQsFilters(snappi.qs), {silent: true});
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