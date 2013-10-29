// /js/models/placeline.js
(function ( models, mixins ) {
	

/*
 * Model: Placeline
 * properties
 * methods:
 */
// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	var options = _.extend( {},
		// add mixins
		mixins.FlickrPlaces,
		classDef
	);
	models.Placeline = Backbone.Model.extend(
		options
	);
}

var PlacelineModel = {
	defaults: {
		currentZoom: 'world',		// timeline zoom setting
		active: null,					// active "page" at currentZoom
		direction: 'asc',			// sort by most-recent
		periods: [],				// "pages"
		fetched: {},				// periods fetched in this session
		filters: {
			zoom: null,		// set in initialize()
		},				// filters, exclude time
	},
	
	xhr_defaults: {
		
	}, 
	
	urlRoot: function() { 
		// HIJACKED!!! see this.sync()
		console.error("Placeline.urlRoot(), method=read is handled by sync(), others???")
		return false;
	},	
	
	templates: {
		
	},
	
	// helper functions
	helper: {
		getZoom: function(pivot){
			return mixins.FlickrPlaces['FlickrApi'].getZoom(pivot);
		},
		pickQsDefaults: function(qs){
			var options, allowed = ['zoom','currentZoom'];
			allowed.unshift(qs);
			options = _.pick.apply(this, allowed );
			return options;
		},
		pickQsFilters: function(qs){
			var options, allowed = ['zoom'];
			allowed.unshift(qs);
			options = _.defaults(_.pick.apply(this, allowed ), this.defaults.filters);
			if (options.rating) options.rating = parseFloat(options.rating);
			return options;
		},
		/**
		 *  get model.Placeline with currentPeriod set
		 *  @param i int (optional) selected period, default active
		 */  
		getActive: function(model, i){
			if (model instanceof Backbone.Model) model = model.toJSON();
			if (_.isUndefined(i)) i = model.active || 0;
			model.currentPeriod = model.periods[i];
			return model;
		},
		
		/** 
		 * set model.fetched={} to track fetched periods
		 * @param that PlacelineView, use this when calling
		 * @param i int, index of fetched period, usually model.active
		 */
		setFetched: function(that, i){
			var model = that.toJSON();
			if (i!==0) i = i || model.active;
			if (model.currentZoom == model.periods[i].place_type) {
				// set by reference, "deep-copy" attr 
				model.fetched[PlacelineModel.helper.getFetchedKey(i, model)] = true;
			} else {
				console.error('setFetched place_type mismatch. changing zoom????');
			}
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
			return model.fetched[PlacelineModel.helper.getFetchedKey(i, model)];
		},
		nextFetched: function(dir, i, model) {
			model = model || this.toJSON();
			i = i || model.active,
			keys = _.keys(model.fetched);
			while (i>0 && i < model.periods.length-1){
				if (dir=="up") i--;
				else i++;
				if (PlacelineModel.helper.isFetched(i, model)) return i;
			}
			return false;
		},
		/**
		 * mark fetched as stale when filterChanged requires XHR request
		 */ 
		resetFetched: function(that, beforeFilter, afterFilter){
			var markAsStale = that.get('fetched');
			_.each(markAsStale, function(v,k,l){
				markAsStale[k] = beforeFilter; // !==true is stale
			});
			that.set('fetched', markAsStale, {silent:true});
		},
	},
	
	// backbone methods
	parse: function( response ){
		console.log("Placeline.parse");
		
		var attr = {
			active: 0, 			// do we need active here?
			currentZoom: response.place_type,
			direction: 'asc',
			periods: [],
			fetched:  this.get('fetched'),		// merge Fetched b/w XHR
			filters: {
				// zoom: response.place_type,  // same as currentZoom
			},
		};
		attr.filters['zoom'] = attr.currentZoom;
		var o, index, keys = _.uniq(_.pluck(response.places, 'name'));
		_.each(response.places, function(e,i,l){
			
			switch(attr.currentZoom) {
				case 'world':
				case 'country': 
				case 'region':
				case 'locality':
					index = keys.indexOf(e.name);
					try {
						attr.periods[index].localities.push({
							locality_place_id: e.locality_place_id,
							locality_longitude: e.locality_longitude
						});
					} catch (ex) {
						o = _.clone(e);
						o['label'] = e.name;
						o['period'] = e.place_id;
						// o['place_type'] = e.place_type;
						o.localities = [{
							locality_place_id: e.locality_place_id,
							locality_longitude: e.locality_longitude
						}]
						delete o.locality_longitude;
						delete o.locality_place_id;
						attr.periods.push(o); 	
					}
					break;
				// case 'region':	
				default:
					attr.periods[i]['label'] = e.name;
					attr.periods[i]['period'] = e.place_id;
					break;
			}
		});
		// sort localities
		_.each(attr.periods, function(e,i,l){
			e.localities = _.sortBy(e.localities, 'locality_longitude');
		})


		// make Placeline.periods behave like history
		// MERGE with EXISTING periods 
		attr.periods = this.mergePeriods(attr.periods);

		return attr;
	},

	mergePeriods: function(newPeriods){
		var existing = this.get('periods');
		newPeriods = newPeriods.concat(existing);
		// _.sortBy(newPeriods, 'longitude');
		return newPeriods;
	},

	mergeFetched: function(newFetched){
		var existing = this.get('fetched');
		_.extend(newFetched, existing);
		return newFetched;
	},
	
	initialize: function(attributes, options){
		attributes = _.defaults( this.helper.pickQsDefaults(snappi.qs) , attributes)
		if (attributes['zoom']) {
			attributes['currentZoom'] = attributes['zoom'];
			delete attributes['zoom'];
		}
		this.set( attributes );
		this.xhr_defaults = _.defaults(this.xhr_defaults);
		// type overrides ownerid
		if (this.xhr_defaults.type) delete this.xhr_defaults.ownerid;
		var filters =  this.helper.pickQsFilters.call(this, snappi.qs);
		if (!filters.zoom) filters['zoom'] = this.get('currentZoom');
		this.set('filters', filters, {silent: true});
	},
	
	sync: function(method, model, options) {
		// timeline fetch paging does not follow asset paging
		switch (method) {
			case "read":
				var FlickrApi = model.FlickrApi; 
				var zoom = model.get('currentZoom'), 
					attrs = FlickrApi.getPlaces(zoom, {}, function(attrs){
						if (options.success) options.success.apply(model, arguments)
					});	
				break;
			default:
				options.data.page = 1;
				options.data.perpage = 99;
				// hijack method='read'
				
			    Backbone.sync(method, model, options);

			break;
		}
	},
	
	validate: function(attrs) {
		if (attrs['filters']) {
			this.validate_ChangeFilter(attrs);
		}
	},
	
	// public methods
	/**
	 * validate Placeline.filters changes before filterChange event
	 * 		should be the FIRST listener for Placeline."change:filter"  
 	* @param {Object} attrs, attrs.filters changed by reference
	 */
	validate_ChangeFilter: function(attrs){
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
		if (validated.fetch == true) {
			this.helper.resetFetched(this, before, validated);
		}
	} 
	
}

// put it all together at the bottom
extend(PlacelineModel);	
var check;
})( snappi.models , snappi.mixins);