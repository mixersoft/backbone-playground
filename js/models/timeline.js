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
		var url = _.template('http://<%=baseurl%>/timeline.json?', xhr); // +$.param(this.xhr_defaults);
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
			var options, allowed = ['zoom', 'show-hidden', 'rating', 'from', 'to'];
			allowed.unshift(qs);
			options = _.defaults(_.pick.apply(this, allowed ), this.defaults.filters);
			return options;
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
		nextFetched: function(dir, i, model) {
			model = model || this.toJSON();
			i = i || model.active,
			keys = _.keys(model.fetched);
			while (i>0 && i < model.periods.length-1){
				if (dir=="up") i--;
				else i++;
				if (TimelineModel.helper.isFetched(i, model)) return i;
			}
			return false;
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
		this.set( attributes );
		this.xhr_defaults = _.defaults(this.helper.pickQsDefaults(snappi.qs), this.xhr_defaults);
		// type overrides ownerid
		if (this.xhr_defaults.type) delete this.xhr_defaults.ownerid;
		this.set('filters', this.helper.pickQsFilters.call(this, snappi.qs), {silent: true});
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
		options.data.page = 1;
		options.data.perpage = 99;
	    Backbone.sync(method, model, options);
	},
	
	validate: function(attrs) {
		if (attrs['filters']) {
			this.validate_ChangeFilter(attrs);
		}
	},
	
	// public methods
	/**
	 * validate Timeline.filters changes before filterChange event
	 * 		should be the FIRST listener for Timeline."change:filter"  
 	* @param {Object} attrs, attrs.filters changed by reference
	 */
	validate_ChangeFilter:function(attrs){
		// see if you can stop propagation
		var validated = {fetch: false},
			before = this.get('filters');
		_.each(attrs['filters'], function(value,key,l){
			switch (key){
				case "rating":
					if (value > 5) value = 5;
					if (value <= 0) value = "off";
					validated['rating'] = value;
					if ( !before['rating'] ) before['rating'] = 0;
					if ( /off|none/.test(validated['rating']) ) 
						validated['fetch'] = true;
					else if ( validated['rating'] <  before['rating'] ) 
						validated['fetch'] = true;  
				break;
			}	
		});
		// these assignment by reference are "silent"
		_.extend(attrs['filters'],validated);
	} 
	
}

// put it all together at the bottom
extend(TimelineModel);	

})( snappi.models );