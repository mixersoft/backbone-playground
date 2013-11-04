(function ( mixins ) {
	"use strict";

var Timeline = {
	// called by GalleryView
	GalleryView: {
renderBody: function(container, options){
	options = options || {};
	var that = this,
		stale = options.force || false, 
		collection = this.collection,
		pageContainer;
	
	if (container && container.hasClass('page')) {
		pageContainer = container; // container is already onscreen
	} else {
		pageContainer = this.Pager['Timeline']['GalleryView'].getPeriodContainer$(this);
		if (pageContainer && !(container && container.children().length)) {
			container = pageContainer; // NO container, user current active pageContainer
			// page already rendered, no new elements to add, refreshLayout()
		} else if (pageContainer){
			// pageContainer.html('');
			// pageContainer.append(container.children());
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
			pager = this.pager.toJSON();
			
		$before = this.Pager['Timeline']['GalleryView'].createPeriodContainers$(this, pager, body);
		
		pageContainer = this.Pager['Timeline']['GalleryView'].getPeriodContainer$(this, 'create');
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
				// replace .empty-label
				if (thumbs.length) pageContainer.html(thumbs);
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
		var pageContainer = this.Pager['Timeline']['GalleryView'].getPeriodContainer$(this);
		$('.pager').addClass('xhr-fetching');	
		this.scrollIntoView(pageContainer, function(){
			that.collection.trigger('xhr-ui-ready');
		});
		return;
	}


	var fetchOptions = this.Pager['Timeline']['GalleryView'].getRestApiOptions(this);
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
		serialXhr.then(function(){
console.info("1. GV $.when: all done after Pager.sync+GC.fetch");			
		})
	} else {	// TimelineSync already sync'd
		pager.trigger('request', pager, jqXhr, options);		// Pager.ux_showWaiting()
		jqXhr.then(function(){
console.info("1. GV $.when: all done after GV.fetch");
		})
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
	var helper = that.Pager['Timeline']['GalleryView'],
		template = helper.templates.selector_PeriodContainer,
		pager = that.pager.helper.getActive(that.pager, index),
		$item = that.$( template( pager) );
	if (!$item.length && create){
		template = helper.templates.periodContainer; 
		$item = $( template( pager) );
	}
	return $item.length ? $item : false;
},
getPeriodContainerByTS$: function(that, TS_UTC, create) {
	var helper = that.Pager['Timeline']['GalleryView'],
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