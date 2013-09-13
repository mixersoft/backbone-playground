// /js/views/gallery.js

(function ( views, mixins ) {
	
// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	var options = _.extend({}, 
		mixins.UiActions,
		LayoutEngines, 
		classDef
	);
	views.GalleryView = Backbone.View.extend(
		options
	);
}	

/*
 * View: Gallery (same as App?)
 * properties:
 * methods:
 */

var LayoutEngines = {
	layout: {
		Typeset: function(container, items){
			var layoutState,
				displayOptions = this.collection.gallery_display_options_ui,
				displayOptionSize = _.findWhere(displayOptions.size, {active:'active'});
				
			var layoutOptions = {
				outerContainer: this.$el,
				thumbsContainer: container || this.$('.body'),		// or .body .page[data-page=N]
				targetHeight: displayOptionSize.size,
				_layout_y: 0,			// start at top
			}	 
			var layout = snappi.mixins.LayoutEngine.Typeset.run.call(this, 
				container, 
				items,				// if null, will layout all .thumbs IMG in container
				this.collection,
				layoutOptions
			);
			
			if (layout) {
				// append, if necessary
		        if (!$.contains(container.get(0), layout.items.get(0))) {
		        	container.append(layout.items);
		        }
		        
		        return layout.state;
			} else return false;
		},  // end layout.Typeset
	},
}

var GalleryView = {
	el: ".gallery",
	
	collection: null,	// Backbone.Paginator
	
	templates: {
		pageTemplate: _.template('<div class="page" data-page="<%=currentPage%>"></div>'),
	},
	
	events: {
		'keypress .body': 'onKeyPressNav',
		'click .display-options': 'toggleDisplayOptions', 
		'scroll': 'onContainerScroll',	 
	},
	
	initialize: function(attributes, options){
		this.render();
		
		var collection = this.collection;
		this.listenTo(collection, 'reset', this.addAll);
		this.listenTo(collection, 'refreshLayout', this.refreshLayout);
		this.listenTo(collection, 'repaginated', this.refreshPages);
		this.listenTo(collection, 'add', this.add);
		this.listenTo(collection, 'sync', this.addPage);
		this.listenTo(collection, 'addedHiddenshots', this.addedHiddenshots);
		this.listenTo(collection, 'pageLayoutChanged', this.layoutPage);
		
		// calls colletion.sync and makes request from DB
		this.$el.addClass('debounce');
		$(window).on('scroll', $.proxy(this.onContainerScroll, this));
		
		// initial XHR fetch or bootstrap
		if (collection.models.length) {
			collection.bootstrap();
			this.addPage();
		}
		else collection.pager({ remove: false });
	},
	
	render: function(){
		/*
		 * create delegated views
		 */
		this.pager = new views.PagerView({
			el: this.$('.header .pager'),
			collection : this.collection,
		});
		this.displayOptions = new views.GalleryDisplayOptionsView({
			el: this.$('.header .display-options'),
			collection : this.collection,
		});
	},
	refreshLayout: function(options) {
		var pages = this.$('.body .page');
		_.each(pages, function(pageContainer, i){
			this.layoutPage(pageContainer);
		}, this);
		this.$el.css('min-height', $(window).outerHeight()-160);
	},
	/**
	 * layout a single page, this.$('.body .page') 
	 */
	layoutPage: function(pageContainer, $child){
		if (!pageContainer) pageContainer = $child.closest('.page');
		var layoutState = this.layout['Typeset'].call(this, $(pageContainer), null);
	},
	/**
	 * put ThumbViews into the correct .body .page after repaginate
	 * @param Object newPages, {[pageIndex]:[count]} 
	 */
	refreshPages: function(newPages) {
		var collection = this.collection,
			body = this.$('.body'),
			pageContainer, 
			pageContainers=[],
			$before;
		
		var pageNums = _.keys(newPages).sort();
		// make sure we have the correct pageContainers in .body
		_.each(pageNums, function(p){
			pageContainer = body.find('.page[data-page="'+p+'"]');
			if (pageContainer.length) pageContainers[p] = pageContainer;
			else {
				pageContainers[p] = $(this.templates.pageTemplate({currentPage: p}));
			}
			if (p==1) body.prepend(pageContainers[p]);
			else $before.after(pageContainers[p]);
			$before = pageContainers[p];
		}, this);
		
		// move ThumbView to the correct pageContainer
		var $thumb, p, clientPageCounter={};
		_.each(collection.models, function(model, i){
			$thumb = this.$('#'+model.get('id')+'.thumb');
			p = model.get('requestPage') || model.get('clientPage') || null;
			if (pageContainer.data('page') != p) pageContainer = body.find('.page[data-page="'+p+'"]');
			
			if (typeof clientPageCounter[p] != 'undefined') clientPageCounter[p]++;
			else clientPageCounter[p] = 0; 
			
			if (clientPageCounter[p]==0) pageContainer.prepend($thumb);
			else $before.after($thumb);
			$before = $thumb;
			
		}, this);
		
		// remove empty pages
		_.each(body.find('.page'), function(item){
			if ($(item).find('.thumb').length==0) 
				$(item).remove();
		}, this);
		
		// refresh layout for each page
		this.refreshLayout();
	},
	
	addAll : function(models, options) {
		var bootstrap;
	},
	add : function(models, options) {
		console.log("collection add for models, count="+this.collection.models.length);
	},
	/**
	 * @param Object options, 
	 * 	options.shotId #[shotId].shot-wrap
	 *  options.bestshot instanceof models.Shot 
	 */
	addedHiddenshots : function(models, options) {
		_.each(models, function(item, i){
			if (item == options.bestshot) return;	// skip bestshot
			this.addOne(item, options);
		}, this);
		// get current page
		var $page = _getPageFromModel(this, options.bestshot);
		this.renderBody($page, {force: true, scroll: false});
	},
	// called by B.Paginator.nextPage() > B.Paginator.pager() > 'sync'
	addPage : function(models, options) {
		options = $.extend(options || {}, {
			offscreen : $('<div class="body"></div>'),	// build page in orphaned el
		});
		
		/*
		 * NOTE: used collection.pager({remove: false}) to append new models 
		 */
		var collection = this.collection,
			start = (collection.currentPage-1) * collection.perPage,
			end = Math.min(start + collection.perPage, collection.models.length);
			
		// use audition.requestPage to manage paging
		// TODO: model.get('clientPage') || model.get('requestPage')
		var p, pageModels = []; 
		_.each(collection.models, function(model, i){
			p = model.get('clientPage') || model.get('requestPage') || 9999;
			if (p == collection.currentPage) {
				this.addOne(model, options);	
			}
		}, this);
			
		this.renderBody(options.offscreen || this.$('.body'));
	},
	
	/**
	 * @param models.Shot item
	 * @param options { 
	 * 		offscreen: jquery container to append rendered view 
	 * 		shotId: append item to #[shotId].shot-wrap
	 * 		bestshot: models.Shot, 
	 * }  
	 * @return HTMLElement
	 */
	addOne : function( item, options ) {
		options = options || {};
		var thumb, $thumb = this.$('#'+item.get('id')+'.thumb');
		// ???: how can you tell if a model already has a rendered View?
		// add a back reference?
		var $parent, $shotEl;
		if ($thumb.length==0) {
			var viewClass = (item instanceof snappi.models.Shot)?  views.ShotView : views.PhotoView;
			thumb = new viewClass({model:item, collection: this.collection});
			if (options.offscreen ){
				$parent = options.offscreen; 
			} else $parent = this.$('.body');
			
			$thumb = thumb.render(options).$el;
			
			if (item instanceof snappi.models.Shot) {
				// as determined by GalleryCollection.parse()
				// wrap bestshot inside div.shot-wrap for .shot-wrap:hover, 
				$parent.append($thumb.addClass('shot-wrap'));
			} else if (!!options.shotId) {
				// options.shotId set in this.addedHiddenshots()
				$shotEl = this.$('#'+options.shotId);
				if ($shotEl.length) {
					$shotEl.append($thumb); // add $thumb.$('.thumb')???
				} else {
					throw "Trying to insert into missing shot, shotId="+options.shotId;
				}
			} else {
				// item instanceof models.Photo
				$parent.append($thumb);
			}
			
			return thumb.el;
		} else {
			// TODO: already added, is ThumbView updated automatically?
			console.log("already added");
			// move offscreen then move back???
			// options.offscreen.append($thumb);
		}
	},
	
	onKeyPressNav: function(){
		// PageDown call onContainerScroll?
		
	},
	
	onSetPerpage: function(){
		// calls this.collection.howManyPer()
		// also called from PagerView.changeCount()
	},
	
	/**
     * Called on the scroll event of the container element.  Used only in the non-paginated mode.
     * When the scroll threshold is reached a new page of thumbs is requested.
     * @param event e - the scroll event object
     */
    onContainerScroll : _.throttle(function(){
    	this._scrollSpy();
    }, 200, {leading: false}),
    
    _scrollSpy : function(e) {
    	self = this;
    	if (self.$el.hasClass('debounce')) {
    		return;
    	}
    	
    	var target = self.$el,
    		collection = this.collection,
        	selfB = target.offset().top+target.height(),
        	windowT = $(window).scrollTop(),
        	windowB = windowT + $(window).height();
        	
        // find current visible page
        var visiblePg, scrollDir = mixins.UiActions.detectScrollDirection();
        self.$('.body .page').each(function(i,item){
        	if (scrollDir=='down') {
	        	if (visiblePg && item.offsetTop > windowB)
	        	{
	        		// if (item.offsetTop + item.offsetHeight < windowB) visiblePg = item;
	        		return false;
	        	} 
        	} else { // page up
	        	if (visiblePg && (item.offsetTop + item.offsetHeight) > windowB) {
	        		if (item.offsetTop < windowT) visiblePg = item;
	        		return false;
	        	} 
        	}
        	visiblePg = item;
        });
        
        var scrollPage = $(visiblePg).data('page');
// console.log('scroll to page='+scrollPage);        
        
        var nextPage = scrollDir=='down' ? this.collection.currentPage+1 : this.collection.currentPage-1;
			
		if (nextPage !== scrollPage && 0 < nextPage && nextPage < this.collection.totalPages) 
		{
			// TODO: how can we debounce this if the page load times
			//	are indeterminant? want to debounce AFTER load complete?
			if (!this.collection.fetchedServerPages[nextPage]) {
				// check for fetch
				if (nextPage > scrollPage && selfB > windowB) {
					// skip bottomPage fetch until see bottom, selfB < windowB
				} else {	
					self.$el.addClass('debounce');
					this.collection.goTo(nextPage,{ merge: true, remove: false });
					return;
				}
			}
		}
	    this.collection.trigger('scrollPage', scrollPage, scrollDir);
        
    },
    

	/**
	 * render [.thumb] into gallery body by page, i.e. .body > .page[data-page="N"] >.thumb
 	 * @param {jquery} container, jquery obj holding rendered items, may be offscreen
 	 * 		if offscreen, will also append to this.$('.body')
 	 * @param Object options, default={force: false, scroll: true}
	 */
	renderBody: function(container, options){
		options = options || {};
		var stale = options.force || false, 
			collection = this.collection;
		
		var pageContainer;
		if (container && container.hasClass('page')) {
			pageContainer = container;
		} else {
			pageContainer = this.$('.body .page[data-page="'+collection.currentPage+'"]');
			if (pageContainer.length && (!container || !container.children().length)) {
				container = pageContainer;
				// page already rendered, no new elements to render
			} 
		}
		if (pageContainer.length && container && container.children().length) {
			// container could hold offscreen ThumbnailViews
			// render if stale 
		} else if (pageContainer.length==0) {
			pageContainer = $(this.templates.pageTemplate(collection))
			var p, 
				currentPage = collection.currentPage,
				body = this.$('.body'),
				pages = body.find('.page');
			for (var i=pages.length-1; i>-1 ; i--) {
				if (pages.eq(i).data('page')<currentPage) {
					pageContainer.insertAfter(pages.eq(i));
					currentPage = 'inserted';
					break;	
				};
			}	
			if (currentPage != 'inserted') body.prepend(pageContainer);
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
		if (options.scroll !== false) {	// false for hiddenshot
			// TODO: goal is to scroll to new page WITHOUT triggering onContainerScroll
			// what is the best way? Stop the listener?
			_.defer(function(that, pageContainer){
				that.$el.addClass('debounce');
				that.scrollBottomAlmostIntoView(pageContainer);
			}, this, pageContainer);
		}
		_.delay(function(that){
			that.$el.removeClass('debounce');
		}, 1000, this);
		// for debugging
		if (_DEBUG) this.introspect();
	},
	// debugging
	introspect: function() {
		var auditions = SNAPPI.Auditions;
		_.each(this.$('div.thumb'), function(el,k,l) {
			var id = $(el).attr('id'),
				models;
			models = (this.collection instanceof Backbone.Paginator.clientPager)
				? this.collection.origModels
				: this.collection.models;
			$(el).find('img').get(0).raw = auditions[id];
			$(el).find('img').get(0).parsed = _.findWhere(models, {id: id}).toJSON();
		}, this);
	},
};

/*
 * protected methods, 
 * - move to mixin?
 * 
 */
var _getPageFromModel = function(that, m) {
	// get current page
	var $thumb = that.$('#'+m.get('photoId')+'.thumb');
	var $page = $thumb.closest('.page');
	return $page; 
}
// put it all together at the bottom
extend(GalleryView);

})( snappi.views, snappi.mixins );