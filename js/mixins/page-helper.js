(function ( mixins ) {
	"use strict";

var Page = {
	// called by GalleryView
	GalleryView : {
renderBody: function(container, options){
	options = options || {};
	var that = this,
		stale = options.force || false, 
		collection = this.collection;
	
	var pageContainer;
	if (container && container.hasClass('page')) {
		pageContainer = container;
	} else {
		pageContainer = this.$('.body .page[data-page="'+collection.currentPage+'"]');
		if (pageContainer.length && !(container && container.children().length)) {
			container = pageContainer;
			// page already rendered, no new elements to add, refreshLayout()
		} else {
			pageContainer.html('');
			// pageContainer.append(container.children());
			stale = true;
			// page already rendered, AND new elements to add, 
		}
	}
	if (pageContainer.length && container && container.children().length) {
			// page already rendered, no new elements to add, 
			// but refreshLayout() ?? 
	} else if (pageContainer.length===0) {
		pageContainer = $(this.templates.pageTemplate(collection));
		var p, 
			currentPage = collection.currentPage,
			body = this.$('.body'),
			pages = body.find('.page');
		for (var i=pages.length-1; i>-1 ; i--) {
			if (pages.eq(i).data('page')<currentPage) {
				pageContainer.insertAfter(pages.eq(i));
				currentPage = 'inserted';
				break;	
			}
		}	
		if (currentPage !== 'inserted') body.prepend(pageContainer);
		stale = true;
		
	} 
	
	if (stale === true){
		/*
		 * the actual layout render statement
		 */
		var thumbs = container.find('> div');  // container.find('.thumb');
		pageContainer.append(thumbs);
		var layoutState = this.layout['Typeset'].call(this, pageContainer, thumbs);
		/*
		 * end
		 */
		// a new page was added. cleanup GalleryView
		this.$el.css('min-height', $(window).outerHeight()-160);
	}
	if (options.scroll !== false) {	// false for hiddenshot, otherwise true
		that.listenToOnce(that.collection, 'layout-chunk', function(i, height){
			// TODO: goal is to scroll to new page WITHOUT triggering onContainerScroll
			// what is the best way? Stop the listener?
			that.$el.addClass('debounce');
			that.scrollIntoView(pageContainer, function(){
				that.collection.trigger('xhr-ui-ready');
				that.$el.removeClass('debounce');		
			});
			
console.log('GalleryView.renderBody() first chunk ready to view');				
		});
	}
	_.defer(function(){
		that.$('.fade-out').removeClass('fade-out');
	});

	// TODO: deprecate .debounce? use '.xhr-fetching' instead?
	_.delay(function(that){
		that.$el.removeClass('debounce');
	}, 1000, this);
	
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