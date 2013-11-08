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

	if ($thumbs) 
		$pageContainer.append($thumbs);

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
getPeriodContainer$: function(that, create, index){
	index = index || that.collection.currentPage || 1;
	var selector_Page = Page['GalleryView'].templates.selector_Page(that.collection);
	var $item = that.$(selector_Page);
	if (!$item.length && create){
		$item = $(Page['GalleryView'].templates.page(that.collection));
	}
	return $item.length ? $item : false;
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