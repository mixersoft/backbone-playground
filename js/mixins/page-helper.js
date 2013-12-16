(function ( mixins ) {
	"use strict";

var Page = {
	// called by GalleryView
	GalleryView : {
templates: {
	page: _.template('<div class="page" data-page="<%=currentPage%>"></div>'),
	selector_Page:  _.template('.body .page[data-page="<%=currentPage%>"]'), 
},
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

	if (!$pageContainer || !$pageContainer.length) {
		$pageContainer = Page['GalleryView'].getPeriodContainer$(that, 'create');
		// throw "where do I put the thumbs?";
	}

	var isOffscreen = !$pageContainer.parent().length;
	if (isOffscreen) {
		// offscreen, insert in the correct location
		// TODO: move to getPeriodContainer('create')??
		var p, 
			currentPage = collection.currentPage,
			body = that.$('.body'),
			pages = body.find('.page');
		// search from bottom
		for (var i=pages.length-1; i>-1 ; i--) {
			if (pages.eq(i).data('page')<currentPage) {
				$pageContainer.insertAfter(pages.eq(i));
				currentPage = 'inserted';
				break;	
			}
		}	
		if (currentPage !== 'inserted') body.prepend($pageContainer);
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
		var layoutState = that.layout['Typeset'].call(that, 
			$pageContainer, 
			null,
			options
		);
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
getPeriodContainer$: function(that, create, index){
	index = index || that.collection.currentPage || 1;

	var selector_Page = Page['GalleryView'].templates.selector_Page({currentPage: index});
	var $item = that.$(selector_Page);
	if (!$item.length && create){
		$item = $(Page['GalleryView'].templates.page(that.collection));
	}
	return $item.length ? $item : false;
},

/*
 *	render/release
 */
/**
 * render thumb in viewport+buffer
 * release thumb outside 
 * @param that GalleryView
 */ 
// snappi.app.Pager['Page']['GalleryView']._waitForShot();
renderViewport: function(that){
	that = that || snappi.app;
	var VIEWPORT_PADDING = 0;
	var viewportPages = that.getViewportPages(VIEWPORT_PADDING);
	var dfd = new $.Deferred();
	var pages = viewportPages.pages;
	var collection = that.collection;
	var renderPages = pages.filter('.released, .throttle-layout');
	// var renderPages = pages.filter('.released');
console.warn('rendering Pages: '+$.map(renderPages, function(page){return $(page).data('page')}));		
	_.each(renderPages, function(el, i, l){
		// models = getPageModels( el, that.collection)
		var $pageContainer = $(el);
		// if (!$pageContainer.hasClass('released')){
		// 	if ($pageContainer.find('.thumb img').eq(0).attr('src')) 
		// 		return;	// skip
		// 	else
		// 		var check;
		// }
		var page = parseInt($(el).data('page')),
			pageModels = []; 
		var start = page * collection.perPage,
			end = Math.min(start + collection.perPage, collection.models.length);
		var $thumbs = $();		
		_.each(collection.models, function(model, i){
			/*
			 * TODO: requestPage changes onFilterChanged
			 * add collection.comparator and repaginate or sort algo
			 * requestPage set in mixins.RestApi.parseShot_Assets()
			 */
			var p = model.get('clientPage') || model.get('requestPage') || 9999;
			if (p == page) {
				pageModels.push(model);
				// $thumbs = $thumbs.add( this.addOne(model, options) );	
			}
		}, this);
console.info('renderViewport: '+page);
		// throttle this in GV.addThumbs()
		that.addThumbs(pageModels, $pageContainer, {
			scroll:false, 
			offscreenTop:'', 
			'throttle-layout': false
		});
		$pageContainer.has('.thumb').removeClass('released');
	});
	if (!Page['GalleryView'].releaseViewport)
		Page['GalleryView'].releaseViewport = _.debounce(
			function(){
				Page['GalleryView'].releaseViewport0(that, VIEWPORT_PADDING);
			}, 3000, false);	// 3 sec delay
	Page['GalleryView'].releaseViewport();
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
console.warn('releasing Pages: '+$.map(releasePages, function(page){return $(page).data('page')}));		
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
	},
};

var Pager = _.extend(mixins.PagerHelpers && mixins.PagerHelpers['Pager']  || {}, {
	'Page': Page,
});
mixins.PagerHelpers = mixins.PagerHelpers || {Pager:{}};
mixins.PagerHelpers['Pager'] = Pager;
var check;
})( snappi.mixins);