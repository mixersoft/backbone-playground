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
/**
*	@param $pageContainer, div.page which will contain .thumb
*	@param $thumbs, jquery array of div > div.thumb, optional
* 		$pageContainer.append($thumbs);
*   @param options
*		options.force - force reLayout()
*		options.scroll - scrollIntoView after layout, false for hiddenshots
*		options.offscreen - deprecated
*/		
renderBody: function($pageContainer, $thumbs, options){
	options = options || {};
	var that = this,
		stale = options.force || false, 
		collection = this.collection;
	var helper = Placeline['GalleryView'];

	if (!$pageContainer || !$pageContainer.length) {
		$pageContainer = helper.getPeriodContainer$(that, 'create');
		// throw "where do I put the thumbs?";
	}

	var isOffscreen = !$pageContainer.parent().length;
	if (isOffscreen) {
		// offscreen, insert in the correct location
		$pageContainer = helper.insertPageContainer(this);
		stale = true;
		// throw "insert me in the right place";
	}


	var hasThumbs = $pageContainer.children().length;
	if (hasThumbs) {
		// append, clear, or remove()?
		$pageContainer.find('.empty-label').remove();
		// hiddenshot will insert into div.shot-wrap, set options.force=true
		stale = true;	// trigger reLayout()
		// throw "what should we do if there are exitings thumbs?";
	} 

	if ($thumbs) {
		$pageContainer.append($thumbs);
		// SORT thumbs
	}

	if (hasThumbs && $thumbs) {
		var $sorted = _.reduce(that.collection.models, function(out, model, i,l){
			return out.add($pageContainer.find('#'+model.get('id')).parent());
		}, $());
		$pageContainer.append($sorted);
	}

	if (stale === true){
		/*
		 * the actual layout render statement
		 */
		var layoutState = that.layout['Typeset'].call(that, 
			$pageContainer, 
			null		// get from $pageContainer
		);
		/*
		 * end
		 */
		// a new page was added. cleanup GalleryView
		// that.$el.css('min-height', $('body').data('winH')-160);
	}
	if (options.scroll !== false) {	// false for hiddenshot, otherwise true
		that.listenToOnce(that.collection, 'layout-chunk', function(i, height){
			that.scrollIntoView($pageContainer, function(){
				that.collection.trigger('xhr-ui-ready');
			});
			// console.log('GalleryView.renderBody() first chunk ready to view');				
		});
	}
	_.defer(function(){
		that.$('.fade-out').removeClass('fade-out');
	});
	return $pageContainer;
},

insertPageContainer: function(that){
	var $before = null, 
		body = that.$('.body'),
		pager = that.pager.toJSON();
	var $pageContainer;
		
	$before = Placeline['GalleryView'].createPeriodContainers$(that, pager, body);
	
	$pageContainer = Placeline['GalleryView'].getPeriodContainer$(that, 'create');
	if (!$before)
		body.prepend($pageContainer);
	else 
		$pageContainer.insertAfter($before);
	return $pageContainer;
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
 * @param pager models.Placeline
 */
onPlacelineChangePeriod : function(pager, changed, options) {
	var that = this, //  instanceof GalleryView
		index = pager.changed && pager.changed.active || pager.get('active'),
		isFetched = pager.helper.isFetched.call(pager, index),
		$pageContainer = Placeline['GalleryView'].getPeriodContainer$(this, false, index);

console.log("GalleryView.pager.'change:active', i="+index);

	if (isFetched && $pageContainer && $pageContainer.find('.thumb').length) {
		// scroll to an already fetched period, should NOT trigger XHR fetch
		$('.pager').addClass('xhr-fetching');
		this.scrollIntoView($pageContainer, function(){
			that.collection.trigger('xhr-ui-ready');
		});
		return;
	};


	var fetchOptions = Placeline['GalleryView'].getRestApiOptions(this);
console.info("1. GV.collection.fetch()");	
	// for bootstrap: finish init before fetch
	var jqXhr = that.collection.fetch({
		remove: false,
		data: fetchOptions,
		complete: function(){
			that.collection.trigger('xhr-fetched');
		},
	});
	// no need to deferred.pipe() because options.xhr.status=='resolved'
	var serialXhr = options.xhr;
	if (serialXhr) { // options.xhr set by onTimelineSync
		console.log("1. GalleryView.pager.onTimelineChangePeriod(), xhr.promise.state="+serialXhr.state());
		$.when(jqXhr, serialXhr).then(function(){
console.info("1. GV $.when: all done from placeline_helper after Pager.sync+GC.fetch");			
		})
	} else {	// Placeline already sync'd
		pager.trigger('request', pager, jqXhr, options);		// Pager.ux_showWaiting()
		jqXhr.then(function(){
console.info("1. GV $.when: all done from placeline_helper after GV.fetch");
		})
	}
	return jqXhr;
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