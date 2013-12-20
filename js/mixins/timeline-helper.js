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

	if ($thumbs) {
		$pageContainer.append($thumbs.not('.hiddenshot'));
		stale = true;
	}

	if (stale === true){
		/*
		 * the actual layout render statement
		 */
		var dfd = that.layoutPage($pageContainer, options);
		/*
		 * end
		 */
		// a new page was added. cleanup GalleryView
		// that.$el.css('min-height', $('body').data('winH')-160);
	}
	if (options.scroll !== false) {	
	// false for hiddenshot, renderViewport()
	// otherwise true
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
/**
 * Zoom action
 *		- starts from PhotoView .click
 *		- somehow trigger change in Pager, models.Placeline??
 *		- why does the Pager need to know? for pageUp/Dn actions
 *		- 
 * trigger changeZoom event on placeline, 
 * see: GalleryView.onPlacelineChangePeriod() (placeline Helper)
 * placelineView/Model knows currentZoom/next zoom
 * placeline checks e.currentTarget to know where to insert new page
*/
onZoom:  function(e){

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
		var both = new $.Deferred();
		$.when(jqXhr, serialXhr).then(function(){
console.info("1. GV $.when: all done after Pager.sync+GC.fetch");
			both.resolve(jqXhr);  // with jqXhr arguments??			
		});
		return both;
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
/*
* @param that instanceof views.GalleryView, or snappi.app
* @param active int, fetch a specific page, independent of models.Pager
*/
getRestApiOptions: function(that, active){
	var pager = that.pager,
		period = pager.get('periods')[active || pager.get('active')],
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

/*
 *	render/release
 */
// ???: should I just have a collection or collections?
/*
 * get models for a given page, 
 *	will return hiddenshot models correctly, BUT
 *  WARNING: hiddenshot models are RENDERED, but will not close correctly
 */
getModelsForPeriod: function( collection, $pageContainer ){
	var pager = this.pager.toJSON();
	var models = {};
	var period = _.findWhere(pager.periods, {period: $pageContainer.data('period') });
	if (period.from_TS_UTC && period.to_TS_UTC) {
		_.each(collection.models, function(model, i){
			var dateTakenTS = model.get('TS_UTC');
			if (period.from_TS_UTC <= dateTakenTS 
				&& dateTakenTS <= period.to_TS_UTC) {
				models[model.get('photoId')] = model;
			}
		}, this);
	}
	return models;
},
/**
 * render thumb in viewport+buffer
 * release thumb outside 
 * @param that GalleryView
 */ 
// snappi.app.Pager['Page']['GalleryView']._waitForShot();
renderViewport: function(that){
	that = that || snappi.app;
	var VIEWPORT_PADDING = 2;
	var viewportPages = that.getViewportPages(VIEWPORT_PADDING);
	var dfd = new $.Deferred();
	var pages = viewportPages.pages;
	var collection = that.collection;
	// var renderPages = pages.filter('.released, .throttle-layout');
	var renderPages = pages.filter('.released');
console.warn('rendering Pages: '+$.map(renderPages, function(page){return $(page).data('period')}));		
	_.each(renderPages, function(el, i, l){
		// models = getPageModels( el, that.collection)
		var $pageContainer = $(el);
		var page = $pageContainer.data('period');
		var pageModels = Timeline['GalleryView'].getModelsForPeriod.call(that, collection, $pageContainer);
		// WARNING: if hiddenshot is included in pageModels
		// it will render correctly, but not close properly
		that.addThumbs(pageModels, $pageContainer, {
			scroll:false, 
			offscreenTop:'', 
			'throttle-layout': false
		});
		$pageContainer.has('.thumb').removeClass('released');
	});
	if (!Timeline['GalleryView'].releaseViewport)
		Timeline['GalleryView'].releaseViewport = _.debounce(
			function(){
				Timeline['GalleryView'].releaseViewport0(that, VIEWPORT_PADDING);
			}, 3000, false);	// 3 sec delay
	Timeline['GalleryView'].releaseViewport();
	return dfd;
},
// plain function call, must _.debounce()
releaseViewport0: function(that, VIEWPORT_PADDING){
	var viewportPages = that.getViewportPages(VIEWPORT_PADDING);
	var releasePages = that.$('.body .page')
		.not(viewportPages.pages)
		.has('.thumb')
		.addClass('released');
	var models = [];
console.warn('releasing Pages: '+$.map(releasePages, function(page){return $(page).data('period')}));		
	_.each( releasePages.find('.thumb'), function(el,i,l){
			var shot = $(el).data('view');
			if (shot) {
				return shot.onHide(true);
			}

			var model = $(el).data('model');
			if (!model) {
				var modelId = $(el).hasClass('bestshot') ? el.parentNode.id : el.id;
				model = _.findWhere(that.collection.models, {id: modelId});
			}

			if (model) {
				model.trigger('hide', "no-delay");
				models.push(model);
			}
		});
	// DEBUG: not deleting shot wrapper correctly
	if (releasePages.children().length) {
		console.warn("WARNING: manually removing child elements AFTER hide");
		releasePages.children().remove();
		// throw "there should be nothing here";
	}
},


	}// end GalleryView	

	
};

var Pager = _.extend(mixins.PagerHelpers && mixins.PagerHelpers['Pager']  || {}, {
	'Timeline': Timeline,
});

mixins.PagerHelpers = mixins.PagerHelpers || {Pager:{}};
mixins.PagerHelpers['Pager'] = Pager;

})( snappi.mixins );