(function ( mixins ) {
	"use strict";

var Placeline = {
// called by GalleryView
	'GalleryView' : {
/**
 *
 * triggers 
 *		collection.'layout-chunk'
 *		collection.'layout-complete'
 */		
renderBody: function(container, options){
	options = options || {};
	var that = this,
		stale = options.force || false, 
		collection = this.collection,
		pageContainer;
	
	if (container && container.hasClass('page')) {
		pageContainer = container; // container is already onscreen
	} else {
		pageContainer = Placeline['GalleryView'].getPeriodContainer$(this);
		if (pageContainer && !(container && container.children().length)) {
			container = pageContainer; // NO container, user current active pageContainer
			// page already rendered, no new elements to add, refreshLayout()
		} else if (pageContainer){
			// pageContainer.html('').append(container.children());
			stale = true;
			// page already rendered, AND new elements to add, 
		}
	}
	if (pageContainer && container && container.children().length) {
			// page already rendered, no new elements to add, 
			// but refreshLayout() ?? 
	} else if (!pageContainer) {
		var $before = null,
			body = this.$('.body'),
			placeline = this.pager.toJSON();
			
		$before = Placeline['GalleryView'].createPeriodContainers$(this, placeline, body);
		pageContainer = Placeline['GalleryView'].getPeriodContainer$(this, 'create');
		if (!$before) body.prepend(pageContainer);
		else pageContainer.insertAfter($before);
		stale = true;
	} 
	
	if (stale === true){
		var thumbs = container.find('> div');  // container.find('.thumb');
		if (thumbs.length) {
			/*
			 * the actual layout render statement
			 */
			if (pageContainer !== container) {
				// remove .empty-label
				if (pageContainer.find('.thumb').length) {
console.error("WARNING: just testing fetchZoom. pls fix placeline model first!!!");	
// insert NEW thumbs in sorted order
pageContainer.append(thumbs);
var id, sort = _.reduce(this.collection.models, function(out, model, i,l){
	out.append(pageContainer.find('#'+model.get('id')).parent());
}, $('<div></div>'));
pageContainer.append(sort.children());
thumbs = pageContainer.children();
				} else 
					pageContainer.html(thumbs);
			}
			if (options.scroll !== false) {	// false for hiddenshot, otherwise true
				that.listenToOnce(that.collection, 'layout-chunk', function(i, height){
					that.scrollIntoView(pageContainer, function(){
						that.collection.trigger('xhr-ui-ready');
					});
					
				});
			}
			this.layout['Typeset'].call(this, pageContainer, thumbs);
			/*
			 * end
			 */
			// a new page was added. cleanup GalleryView
			this.$el.css('min-height', $(window).outerHeight()-160);
		}
	}
	_.defer(function(){
		that.$('.fade-out').removeClass('fade-out');
	});
},
onPlacelineSync : function(placeline, resp, options) {
console.log("GalleryView.placeline.'sync'");
	var settings = placeline.toJSON(),
		active = settings.active || 0,
		current = settings.periods[active];
	placeline.set('active', active);	
},
/**
 * change zoom in Placeline model around pivot
 *		i.e. zoom = country, region, etc.
 *	NOTE: the Placeline model determines the next zoom level based on pivot
 *		external objects must wait until this is known by listenTo 'sync:currentZoom'
 * @param placeline models.Placeline
 * @param pivot Object
 */
zoomOnPivot : function( placeline, pivot) {
	// ???: why isn't this instanceof models.Placeline???
	var helper = mixins.BackendHelpers['Backend']['Flickr'],
		newZoom = helper.getZoom(pivot.currentZoom, pivot.dir),
		filters = _.clone(placeline.get('filters'));
	if (filters.zoom == newZoom) {
		// pivot is same level as currentZoom
		var args = "NOT possible if we hide zoom Levels in GView";
		placeline.trigger('sync:currentZoom', args)
	} else {
		filters.zoom = newZoom;
		placeline.set('filters', filters, {silent:true});
		placeline.set('currentZoom', newZoom);
		// trigger('sync:currentZoom') when complete
	}
},

// from listenTo 'change:filters'
onPlacelineChangeFilter : function(placeline, changed) {
	// this.collection.filterChanged(changed, this)	// for pager ratings only
	placeline.fetch(changed);
},

// from listenTo 'change:currentZoom'
onPlacelineChangeCurrentZoom : function(placeline, changed) {
	// this.collection.filterChanged(changed, this)	// for pager ratings only
	if (true) {
		placeline.fetch({
			zoom:changed,
			success: function(placeline, resp, options){
				// set this.model.active to correct value
console.info("0 Placeline.'sync:currentZoom' success");					
				placeline.trigger('sync:currentZoom', arguments);
			},
			silent: true,		// do NOT trigger request on change:active
		});
	} else {
		// placeline.trigger('sync:currentZoom','did not trigger fetch');
	}
},

/**
 * change "period" in Placeline model, i.e. next place
 *		analogous to next page, next time period
 * @param placeline models.Placeline
 */
onPlacelineChangePeriod : function(placeline) {
	var that = this, //  instanceof GalleryView
		index = placeline.changed && placeline.changed.active || placeline.get('active'),
		isFetched = placeline.helper.isFetched.call(placeline, index),
		$pageContainer = Placeline['GalleryView'].getPeriodContainer$(this, false, index);

console.log("GalleryView.placeline.'change:active', i="+index);

	if (isFetched && $pageContainer && $pageContainer.find('.thumb').length) {
		// scroll to an already fetched period, should NOT trigger XHR fetch
		$('.pager').addClass('xhr-fetching');
		this.scrollIntoView($pageContainer, function(){
			that.collection.trigger('xhr-ui-ready');
		});
		return;
	};
	var options = Placeline['GalleryView'].getRestApiOptions(this);
	_.defer(function(){
		// for bootstrap: finish init before fetch
		that.collection.fetch({
			remove: false,
			data: options,
			success: function(collection, response, options){
				var check;
			},
			complete: function(){
				that.collection.trigger('xhr-fetched');
			},
		});
	});
	return;
},


templates: {
	selector_PeriodContainer: _.template('.page[data-zoom="<%=currentZoom%>"][data-period="<%=currentPeriod.period%>"]'), 
	periodContainer: _.template('<div class="page" data-zoom="<%=currentZoom%>" data-period="<%=currentPeriod.period%>"  data-label="<%=currentPeriod.label%>"><div class="empty-label"><%=currentPeriod.label%></div></div>'),
	periodContainerLabel:_.template('<div class="empty-label"><%=label%></div>'),
},
/**
 * @param create boolean (optional), if truthy then create if not found
 * @param index int (optional), default active, unless period index provided 
 */
getPeriodContainer$: function(that, create, index){
	var template = Placeline['GalleryView'].templates.selector_PeriodContainer,
		pager = that.pager.helper.getActive(that.pager, index),
		$item = that.$( template( pager) );
	if (!$item.length && create){
		template = Placeline['GalleryView'].templates.periodContainer; 
		$item = $( template( pager) );
	}
	return $item.length ? $item : false;
},
getPeriodContainerByTS$: function(that, TS_UTC, create) {
	var helper = that.Pager['Placeline']['GalleryView'],
		pager = that.pager.toJSON(), 
		index = false,
		$item, template;
	_.find(pager.periods, function(e, i, l){
		if (e.from_TS_UTC <= TS_UTC && TS_UTC <= e.to_TS_UTC) {
			index = i;
			return true;
		} else return false;
	}, this);	
	if (index === false && create) {
		template = helper.templates.periodContainer; 
		pager = that.pager.helper.getActive(pager);
		$item = $( template( pager) );
	} else {
		template = helper.templates.selector_PeriodContainer;
		pager = that.pager.helper.getActive(pager, index);
		$item = that.$( template( pager) );
	}
	return $item.length ? $item : false;
},
createPeriodContainers$: function(that, pager, $body) {
	// create missing pageContainers	
	var $current, 
		$before = false, 
		fetched_key;
	// currentPeriod = pager.periods[pager.active];
	_.each(pager.periods, function(e,i,l){
		if (pager.currentZoom != e.place_type) return;
		if (i >= pager.active) {
			// return;  // render containers up to current period
		}
		$current = Placeline['GalleryView'].getPeriodContainer$(that, false, i);
		fetched_key = that.pager.helper.getFetchedKey(i,pager);
		if ($current && pager.fetched[fetched_key]) {
			// already loaded, should already be created
		} else if (!$current) {	
			// create, insert empty pageContainer
			$current =  Placeline['GalleryView'].getPeriodContainer$(that, 'create', i);
			if ($before) $current.insertAfter($before);
			else $body.prepend($current);
		} 
		$before = $current;
	});
	return Placeline['GalleryView'].getPeriodContainer$(that, false, pager.active);
},
/**
 * change zoom, then call getRestApiOptions
 * @param that GalleryView
 */
getXhrPivotOptions: function(that, pivot){
	var options = this.getRestApiOptions(that);

	return options;
},
/**
 * get options from click on Pager period, or pageUp/Dn
 *		NOT the same as click on pivot
 * @param that GalleryView
 */
getRestApiOptions: function(that){
	var pager = that.pager,
		period = pager.get('periods')[pager.get('active')],
		options = {
			page: 1,		// should be able to paginate within a period
			// flickr uses per_page, NOT perpage
			per_page: that.collection.paginator_ui.perPage || 20,	// for collection, but not pager
			// collectionSort: 'longitude',	// currently not implemented
			direction: 'asc',
			// filters: pager.get('filters'),
		};
	options.filters = _.clone(pager.get('filters'));
	if (options.filters.changed) {
		options.filters = _.defaults(options.filters.changed, options.filters);
		delete options.filters.changed;
	}
	if (period) {
		options.place_id = period.place_id;
		options.longitude = period.longitude;
		options.localities = period.localities;
	} else {
		console.warn('Placeline fetch() without matching period');
	}
	options = _.defaults(options, pager.xhr_defaults);
	return options;
},


	}, // end GalleryView
	GalleryModel: {
	}
};

var Pager = _.extend(mixins.PagerHelpers && mixins.PagerHelpers['Pager']  || {}, {
	'Placeline': Placeline,
});
mixins.PagerHelpers = mixins.PagerHelpers || {Pager:{}};
mixins.PagerHelpers['Pager'] = Pager;
var check;
})( snappi.mixins);