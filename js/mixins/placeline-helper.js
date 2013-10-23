(function ( mixins ) {

var Placeline = {
// called by GalleryView
	'GalleryView' : {
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
		var $before = $current = null, 
			body = this.$('.body'),
			placeline = this.timeline.toJSON();
			
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
var sort = $('<div></div>');
pageContainer.append(thumbs);
_.each(this.collection.models, function(model, i,l){
	var id = model.get('id');
	sort.append(pageContainer.find('#'+id).parent());
});
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
 * change zoom in Placeline model
 * 		i.e. zoom = country, region, etc.
 * @param placeline
 */
onPlacelineChangeZoom : function( pivot) {
	// ???: why isn't this instanceof models.Placeline???
	var placeline = this.timeline,
		helper = mixins.BackendHelpers['Backend']['Flickr'],
		newZoom = helper.getZoom(pivot),
		filters = placeline.get('filters');
	filters.zoom = newZoom;
	placeline.set('filters', filters, {silent:true});


	// render placeline
	// trigger collection.fetch
},
/**
 * change "period" in Placeline model, i.e. next place
 * 		analogous to next page, next time period
 * @param placeline models.Placeline
 */
onPlacelineChangePeriod : function(placeline) {
	var that = this, //  instanceof GalleryView
		index = placeline.changed && placeline.changed.active || placeline.get('active');
		isFetched = placeline.helper.isFetched.call(placeline, index),
		$pageContainer = Placeline['GalleryView'].getPeriodContainer$(this, false, index);
console.log("GalleryView.placeline.'change:active', i="+index);

	if (isFetched && $pageContainer.find('.thumb').length) {
		// scroll to an already fetched period, should NOT trigger XHR fetch
		$('.pager').addClass('xhr-fetching')	
		this.scrollIntoView($pageContainer, function(){
			that.collection.trigger('xhr-ui-ready');
		});
		return;
	};
	var options = Placeline['GalleryView'].getXhrFetchOptions(this);
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
onPlacelineChangeFilter : function(placeline, changed) {
	this.collection.filterChanged(changed, this)
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
		timeline = that.timeline.helper.getActive(that.timeline, index),
		$item = that.$( template( timeline) );
	if (!$item.length && create){
		template = Placeline['GalleryView'].templates.periodContainer; 
		$item = $( template( timeline) );
	}
	return $item.length ? $item : false;
},
getPeriodContainerByTS$: function(that, TS_UTC, create) {
	var helper = that.Pager['Placeline']['GalleryView'],
		timeline = that.timeline.toJSON(), 
		index = false,
		$item, template;
	_.find(timeline.periods, function(e, i, l){
		if (e.from_TS_UTC <= TS_UTC && TS_UTC <= e.to_TS_UTC) {
			index = i;
			return true;
		} else return false;
	}, this);	
	if (index === false && create) {
		template = helper.templates.periodContainer; 
		timeline = that.timeline.helper.getActive(timeline),
		$item = $( template( timeline) );
	} else {
		template = helper.templates.selector_PeriodContainer,
		timeline = that.timeline.helper.getActive(timeline, index),
		$item = that.$( template( timeline) );
	}
	return $item.length ? $item : false;
},
createPeriodContainers$: function(that, timeline, $body) {
	// create missing pageContainers	
	var $current, 
		$before = false, 
		fetched_key;
	_.each(timeline.periods, function(e,i,l){
		if (i >= timeline.active) {
			return false;  // found
		}
		$current = that.Pager['Placeline']['GalleryView'].getPeriodContainer$(that, false, i);
		fetched_key = that.timeline.helper.getFetchedKey(i,timeline);
		if ($current && timeline.fetched[fetched_key]) {
			// already loaded, should already be created
		} else if (!$current) {	
			// create, insert empty pageContainer
			$current =  that.Pager['Placeline']['GalleryView'].getPeriodContainer$(that, 'create', i);
			if ($before) $current.insertAfter($before);
			else $body.prepend($current);
		} 
		$before = $current;
	});
	return $before;
},
/**
 * change zoom, then call getXhrFetchOptions
 * @param that GalleryView
 */
getXhrPivotOptions: function(that, pivot){
	var options = this.getXhrFetchOptions(that);

	return options;
},
/**
 * get options from click on Pager period, or pageUp/Dn
 *		NOT the same as click on pivot
 * @param that GalleryView
 */
getXhrFetchOptions: function(that){
	var timeline = that.timeline,
		period = timeline.get('periods')[timeline.get('active')],
		options = {
			page: 1,		// should be able to paginate within a period
			// flickr uses per_page, NOT perpage
			per_page: that.collection.paginator_ui.perPage || 20,	// for collection, but not timeline
			// collectionSort: 'longitude',	// currently not implemented
			direction: 'asc',
			// filters: timeline.get('filters'),
		};
	options.filters = _.clone(timeline.get('filters'));
	if (options.filters.changed) {
		options.filters = _.defaults(options.filters.changed, options.filters);
		delete options.filters.changed;
	}
	if (period) {
		options.place_id = period.place_id;
		options.longitude = period.longitude;
		options.localities = period.localities;
	}	
	options = _.defaults(options, timeline.xhr_defaults);
	return options;
},


	}, // end GalleryView
	GalleryModel: {
	}
}

var Pager = _.extend(mixins.PagerHelpers && mixins.PagerHelpers['Pager']  || {}, {
	'Placeline': Placeline,
});
mixins.PagerHelpers = mixins.PagerHelpers || {Pager:{}};
mixins.PagerHelpers['Pager'] = Pager;
var check;
})( snappi.mixins);