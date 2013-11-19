(function ( mixins ) {
	"use strict";

var Timeline = {
	// called by GalleryView
	GalleryView: {

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
	var helper = Timeline['GalleryView'];

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

	if ($thumbs) 
		$pageContainer.append($thumbs.not('.hiddenshot'));

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
		
	$before = Timeline['GalleryView'].createPeriodContainers$(that, pager, body);
	
	$pageContainer = Timeline['GalleryView'].getPeriodContainer$(that, 'create');
	if (!$before)
		body.prepend($pageContainer);
	else 
		$pageContainer.insertAfter($before);
	return $pageContainer;
},

onTimelineSync : function(pager, resp, options) {
console.log("1. GalleryView.pager.'sync'");
	var settings = pager.toJSON(),
		active = settings.active || 0,
		current = settings.periods[active];
		// options = {
		//	from: current.from,
		//	to: current.to,
		//	// filter: current.filter,
		// }
		pager.set('active', active, {xhr: options.xhr});
},
onTimelineChangePeriod : function(pager, changed, options) {
	var that = this;
console.log("1. GalleryView.pager.onTimelineChangePeriod() handles 'change:active', i="+pager.changed.active);
	if (pager.helper.isFetched.call(pager, pager.changed.active)) {
		// scroll to an already fetched period, should NOT trigger XHR fetch
		var pageContainer = Timeline['GalleryView'].getPeriodContainer$(this);
		$('.pager').addClass('xhr-fetching');	
		this.scrollIntoView(pageContainer, function(){
			that.collection.trigger('xhr-ui-ready');
		});
		return;
	}


	var fetchOptions = Timeline['GalleryView'].getRestApiOptions(this);
console.info("1. GV.collection.fetch()");	
	var jqXhr = that.collection.fetch({
		remove: false,
		data: fetchOptions,
		complete: function() {
			that.collection.trigger('xhr-fetched');
		},
	});
	// no need to deferred.pipe() because options.xhr.status=='resolved'
	var serialXhr = options.xhr;
	if (serialXhr) { // options.xhr set by onTimelineSync
		console.log("1. GalleryView.pager.onTimelineChangePeriod(), xhr.promise.state="+serialXhr.state());
		$.when(jqXhr, serialXhr).then(function(){
console.info("1. GV $.when: all done after Pager.sync+GC.fetch");			
		});
	} else {	// TimelineSync already sync'd
		pager.trigger('request', pager, jqXhr, options);		// Pager.ux_showWaiting()
		jqXhr.then(function(){
console.info("1. GV $.when: all done after GV.fetch");
		});
	}
	return jqXhr;
},

onTimelineChangeFilter : function(pager, changed) {
	this.collection.filterChanged(changed, this);
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
	var template = Timeline['GalleryView'].templates.selector_PeriodContainer,
		pager = that.pager.helper.getActive(that.pager, index),
		$item = that.$( template( pager) );
	if (!$item.length && create){
		template = Timeline['GalleryView'].templates.periodContainer; 
		$item = $( template( pager) );
	}
	return $item.length ? $item : false;
},
getPeriodContainerByTS$: function(that, TS_UTC, create) {
	var pager = that.pager.toJSON(), 
		index = false,
		$item, template;
	_.find(pager.periods, function(e, i, l){
		if (e.from_TS_UTC <= TS_UTC && TS_UTC <= e.to_TS_UTC) {
			index = i;
			return true;
		} else return false;
	}, this);	
	if (index === false && create) {
		template = Timeline['GalleryView'].templates.periodContainer; 
		pager = that.pager.helper.getActive(pager);
		$item = $( template( pager) );
	} else {
		template = Timeline['GalleryView'].templates.selector_PeriodContainer;
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
	_.each(pager.periods, function(e,i,l){
		// if (pager.currentZoom != e.period_type) return;
		if (i >= pager.active) {
			// return false;  // found
		}
		$current = Timeline['GalleryView'].getPeriodContainer$(that, false, i);
		fetched_key = that.pager.helper.getFetchedKey(i,pager);
		if ($current && pager.fetched[fetched_key]) {
			// already loaded, should already be created
		} else if (!$current) {	
			// create, insert empty pageContainer
			$current =  Timeline['GalleryView'].getPeriodContainer$(that, 'create', i);
			if ($before) $current.insertAfter($before);
			else $body.prepend($current);
		} 
		$before = $current;
	});
	return Timeline['GalleryView'].getPeriodContainer$(that, false, pager.active);
},
getRestApiOptions: function(that){
	var pager = that.pager,
		period = pager.get('periods')[pager.get('active')],
		options = {
			page: 1,		// should be able to paginate within a period
			perpage: 20,	// for collection, but not pager
			sort: 'top-rated',
			direction: 'desc',
			// filters: pager.get('filters'),
		};
		options.filters = _.clone(pager.get('filters'));
		if (options.filters.changed) {
			options.filters = _.defaults(options.filters.changed, options.filters);
			delete options.filters.changed;
		}
	if (period) {
		options.from = period.from;
		options.to = period.to;	
	}	
	var aaa_options = _.pick(snappi.qs, ['role','owner', 'ownerid','userid','type']);
	if (aaa_options.owner) {
		options.userid = options.ownerid = aaa_options.owner;
		delete aaa_options.owner;
	}
	options = _.defaults(options, aaa_options, pager.xhr_defaults);
	return options;
},

	}// end GalleryView	

	
};

var Pager = _.extend(mixins.PagerHelpers && mixins.PagerHelpers['Pager']  || {}, {
	'Timeline': Timeline,
});

mixins.PagerHelpers = mixins.PagerHelpers || {Pager:{}};
mixins.PagerHelpers['Pager'] = Pager;

})( snappi.mixins );