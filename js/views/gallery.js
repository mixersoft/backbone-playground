// /js/views/gallery.js

(function ( views, mixins ) {
	
// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	var options = _.extend({}, 
		mixins.UiActions,
		mixins.Href,
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
		Typeset: function(container, items, options, more){
			var that = this,
				layoutState,
				displayOptions = that.collection.gallery_display_options_ui,
				displayOptionSize = _.findWhere(displayOptions.size, {active:'active'});
				
			var layoutOptions = {
				outerContainer: that.$el,
				thumbsContainer: container || that.$('.body'),		// or .body .page[data-page=N]
				targetHeight: displayOptionSize.size,
				_layout_y: 0,					// start at page top
				// more: function(){},			// pipeline before layout complete 
			}	
			/*
			 * use ?no-image=1 to test layoutEngine WITHOUT JPGs
			 */
			if (snappi.qs['no-image']) layoutOptions.noImageSrc = snappi.qs['no-image']==true;
			
			// _.defer(function(that){
				var layout = mixins.LayoutEngine.Typeset.run.call(that, 
					container, 
					items,				// if null, will layout all .thumbs IMG in container
					that.collection,
					layoutOptions,
					more
				);
				// if (layout) {
					// // append, if necessary
			        // if (!$.contains(container.get(0), layout.items.get(0))) {
			        	// container.append(layout.items);
			        // }
				// } ;
			// },that);
			return;
		},  // end layout.Typeset
	},
}

var GalleryView = {
	el: ".gallery",
	
	collection: null,	// Backbone.Paginator.requestPager
	timeline: null, 	// models.Timeline
	
	templates: {
		pageTemplate: _.template('<div class="page" data-page="<%=currentPage%>"></div>'),
		periodTemplate: _.template('<% var period=periods[active].period %> <div class="page" data-zoom="<%=currentZoom%>" data-period="<%=period%>"></div>'),
	},
	
	events: {
		'keypress .body': 'onKeyPressNav',
		'click .display-options': 'toggleDisplayOptions', 
		'click .page .empty-label': function(e){
			var period = $(e.target).parent().data('period');
			this.timeline.trigger('gotoPeriod', e, {period: period});
		},  
	},
	
	initialize: function(attributes, options){
		/**
		 * app lifecycle for timeline
		 * - GalleryView.render()
		 * - TimelineView.render()
		 * --> Timeline.fetch() 
		 * 		> trigger Timeline."sync"
		 * - GalleryCollection.onTimelineSync()
		 * 		> trigger Timeline."change:active"
		 * - GalleryCollection.onTimelineChangePeriod()
		 * - GalleryCollection.fetch() 
		 * 		> trigger collection.sync
		 * - GalleryView.addPage() handles GalleryCollection."sync"
		 * - TimelineView.renderState() handles GalleryCollection."sync"
		 * 
		 * click .pager .item.link
		 * 		> trigger Timeline."change:active"
		 *  
		 */
		
		// ???: should this.model = models.Timeline? creating a custom attr here
		this.timeline = attributes.timeline;
		
		this.render();
		/*
		 * NOTE: get containerWidth BEFORE rendering Views, to avoid an unnecssary layout/paint
		 */
		// TODO: update on window.resize
		this.$el.data('outerW', this.$('.body').outerWidth());
		$('body').data('winH', $(window).height());
		$('body').data('winW', $(window).width());

		// timeline controls collection
		this.listenTo(this.timeline, 'sync', this.onTimelineSync);
		this.listenTo(this.timeline, 'change:active', this.onTimelineChangePeriod);
		this.listenTo(this.timeline, 'change:filters', this.onTimelineChangeFilter);

		var collection = this.collection;
		this.listenTo(collection, 'reset', this.addAll);
		this.listenTo(collection, 'refreshLayout', this.refreshLayout);
		this.listenTo(collection, 'repaginated', this.refreshPages);
		this.listenTo(collection, 'add', this.add);
		this.listenTo(collection, 'sync', this.addPage);
		this.listenTo(collection, 'addBack', this.addBack);
		this.listenTo(collection, 'addedHiddenshots', this.addedHiddenshots);
		this.listenTo(collection, 'pageLayoutChanged', this.layoutPage);
		this.listenTo(collection, 'layout-chunk', function(i, container, height){
			container.css('height', height + "px");
		});
		this.listenTo(collection, 'layout-complete', function(){
		});
		
		// initial XHR fetch or bootstrap
		if (snappi.qs.backend && snappi.qs.backend=='file') {
			var user = snappi.qs.owner || 'venice';	// valid = [venice|mb|2011]
			var json = JSON.parse(SNAPPI.CFG.JSON[user].raw);
			var shots = collection.parse(json);
			collection.pager({ remove: false });
		}
		if (snappi.PAGER_STYLE == 'timeline') {}
		else collection.pager({ remove: false });
	},
	
	render: function(){
		
		/*
		 * create delegated views
		 */
		if (snappi.PAGER_STYLE == 'timeline'){
			new snappi.views.TimelineView({
				el: this.$('.header .pager'),
				model: this.timeline,
				collection: this.collection,
			});
			var options = this.timeline_helper.getXhrFetchOptions(this);
			this.timeline.fetch({data: options}); 
		} else {
			this.pager = new views.PagerView({
				el: this.$('.header .pager'),
				collection : this.collection,
			});
		}
		
		this.displayOptions = new views.GalleryDisplayOptionsView({
			el: this.$('.header .display-options'),
			collection : this.collection,
			timeline: this.timeline,
		});
	},
	
	onTimelineSync : function(timeline, resp, options) {
		console.log("GalleryView.timeline.'sync'");
		var settings = timeline.toJSON(),
			active = settings.active || 0,
			current = settings.periods[active],
			options = {
				from: current.from,
				to: current.to,
				// filter: current.filter,
			}
			timeline.set('active', active);
	},
	
	onTimelineChangePeriod : function(timeline) {
		console.log("GalleryView.timeline.'change:active', i="+timeline.changed.active);
		if (timeline.helper.isFetched.call(timeline, timeline.changed.active)) {
			// scroll to an already fetched period, should NOT trigger XHR fetch
			var that = this,
				pageContainer = this.timeline_helper.getPeriodContainer$(this);
			$('.pager').addClass('xhr-fetching')	
			this.scrollIntoView(pageContainer, function(){
				that.collection.trigger('xhr-ui-ready');
			});
			return;
		};
		var options = this.timeline_helper.getXhrFetchOptions(this),
			that = this;
		that.collection.fetch({
			remove: false,
			data: options,
			complete: function() {
				that.collection.trigger('xhr-fetched');
			},
		});
	},
	onTimelineChangeFilter : function(timeline, changed) {
		this.collection.filterChanged(changed, this)
	},
	
	refreshLayout: function(options) {
		var that = this, 
			index = 0,
			pageContainer,
			pages = this.$('.body .page'),
			hasThumbs = pages.filter(':has(.thumb)'),
			noThumbs = pages.filter(':not(:has(.thumb))'),
			noLabel = pages.filter(':not(:has(*))');
		noThumbs.height("auto");
		_.each(noLabel, function(v,k,l){
			var $pageContainer = $(v),
				template = that.timeline_helper.templates.periodContainerLabel,
				label = template({label:$pageContainer.data('label')});
			$pageContainer.html( label );
		}, this);
			
		pageContainer = hasThumbs.get(index++);
		var	next = function(){
			pageContainer = hasThumbs.get(index++);
			if (pageContainer) {
				that.layoutPage(pageContainer, { more: next });
				return true;
			} else return false;
		};
		that.layoutPage(pageContainer, { more: next });
		if (!this.$el.css('min-height')) this.$el.css('min-height', $(window).outerHeight()-160);
	},
	/**
	 * layout a single page, this.$('.body .page')
	 * @param options Object, options.more() pipeline multiple layoutPages return false when no more
	 */
	layoutPage: function(pageContainer, options){
		if (!pageContainer && options.child) pageContainer = options.child.closest('.page');
		var layoutState = this.layout['Typeset'].call(this, $(pageContainer), null, options, options.more);
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
		// Coll.fetch() > success() > Coll.set() > trigger."add" > View.add() > trigger."sync"
		// sync called AFTER add, thumbViews added in sync
		console.log("GalleryView add ThumbView for new models, count="+models.length);
	},
	/**
	 * add Hiddenshots AFTER XHR fetch(), 
	 * @param Object options, 
	 * 	options.shotId #[shotId].shot-wrap
	 *  options.bestshot instanceof models.Shot 
	 */
	addedHiddenshots : function(models, options) {
		var $thumb, 
			$shot = this.$('#'+options.shotId);
		if (!$shot.length) throw "Trying to insert into missing shot, shotId="+options.shotId;
		$shot.addClass('showing');
		_.each(models, function(item, i){
			if (item == options.bestshot) return;	// skip bestshot
			$thumb = this.addOne(item, options);
			// options.shotId set in this.addedHiddenshots()
			// add Hiddenshot with .fade.fade-out class
			//TODO: move this to ShotView?
			$thumb.addClass('fade').addClass('fade-out');
			$shot.append($thumb); 
		}, this);
		// get current page
		var $page = _getPageFromModel(this, options.bestshot);
		this.renderBody($page, {force: true, scroll: false});
	},
	// called by B.Paginator.nextPage() > B.Paginator.pager() > 'sync'
	addPage : function(models, resp, xhr) {
		var options = {
			offscreen : $('<div class="body"></div>'),	// build page in orphaned el
			offscreenTop : _.template(
				'top:<%=top%>px;',
				{ 	// set CSS transition start point offscreen
					top: Math.max(this.$el.height(),$(window).height()) 
				}
			),
		};
		
		/*
		 * NOTE: used collection.pager({remove: false}) to append new models 
		 */
		var collection = this.collection;
		
		if (snappi.PAGER_STYLE == 'timeline') {
			// ?? how do you detect NEW models from sync? use resp.assets
			var new_models = _.pluck(resp.assets,'id');
			_.each(collection.models, function(model,k,l){
				if (new_models.indexOf(model.get('photoId')) >=0 ) {
					this.addOne(model, options);
				}
			}, this);
		} else {
			// use audition.requestPage to manage paging
			// TODO: model.get('clientPage') || model.get('requestPage')
	if (_DEBUG) console.time("Backbone.addPage() render PhotoViews");			
			var p, pageModels = []; 
			var start = (collection.currentPage-1) * collection.perPage,
				end = Math.min(start + collection.perPage, collection.models.length);
			_.each(collection.models, function(model, i){
				/*
				 * TODO: requestPage changes onFilterChanged
				 * add collection.comparator and repaginate or sort algo
				 * requestPage set in mixins.RestApi.parseShot_Assets()
				 */
				p = model.get('clientPage') || model.get('requestPage') || 9999;
				if (p == collection.currentPage) {
					this.addOne(model, options);	
				}
			}, this);
	if (_DEBUG) console.timeEnd("Backbone.addPage() render PhotoViews");
		}	
		this.renderBody(options.offscreen || this.$('.body'));
	},
	/**
	 * addBack a removed model, must be added to the correct page
	 * 	- called by onTimelineChangeFilter(fetch=true)
	 */
	addBack : function(models, options) {
		var sorted = _.sortBy(models, 'dateTaken');
		this.collection.add(sorted, {merge: true, sort: true});
		// sort by page
		// call addOne for each page of models,
		// but PUT thumbView in the right PAGE
		
		
	},
	/**
	 * @param models.Shot item
	 * @param options { 
	 * 		offscreen: jquery container to append rendered view 
	 * 		shotId: append item to #[shotId].shot-wrap
	 * 		bestshot: models.Shot, 
	 * }  
	 * @return jQuery
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
			// either 1) models.Shot && bestshot, or 
			// 2a) models.Photo, or 2b) models.Photo && hiddenshot 
			if (viewClass == views.ShotView) {
				// bestshot, as determined by GalleryCollection.parse()
				// wrap bestshot inside div.shot-wrap for .shot-wrap:hover, 
				$parent.append($thumb.addClass('shot-wrap'));
			} else if (viewClass == views.PhotoView) {
				// item instanceof models.Photo
				if (!options.shotId) $parent.append($thumb);
				// hiddenshot if !!options.shotId
				// > append in GallView.addedHiddenshots() 
			}	
			return thumb.$el;
		} else {
			console.log("already added");
		}
	},
	
	onKeyPressNav: function(){
		// PageDown call onContainerScroll?
		
	},
	
	onSetPerpage: function(){
		// calls this.collection.howManyPer()
		// also called from PagerView.changeCount()
	},
	
	// TODO: this helper should be refactored/move
	timeline_helper: {
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
			var helper = that.timeline_helper,
				template = helper.templates.selector_PeriodContainer,
				timeline = that.timeline.helper.getActive(that.timeline, index),
				$item = that.$( template( timeline) );
			if (!$item.length && create){
				template = helper.templates.periodContainer; 
				$item = $( template( timeline) );
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
				$current = that.timeline_helper.getPeriodContainer$(that, false, i);
				fetched_key = that.timeline.helper.getFetchedKey(i,timeline);
				if ($current && timeline.fetched[fetched_key]) {
					// already loaded, should already be created
				} else if (!$current) {	
					// create, insert empty pageContainer
					$current =  that.timeline_helper.getPeriodContainer$(that, 'create', i);
					if ($before) $current.insertAfter($before);
					else $body.prepend($current);
				} 
				$before = $current;
			});
			return $before;
		},
		getXhrFetchOptions: function(that){
			var timeline = that.timeline,
				period = timeline.get('periods')[timeline.get('active')],
				options = {
					page: 1,		// should be able to paginate within a period
					perpage: 20,	// for collection, but not timeline
					sort: 'top-rated',
					direction: 'desc',
					// filters: timeline.get('filters'),
				};
				options.filters = _.clone(timeline.get('filters'));
				if (options.filters.changed) {
					options.filters = _.defaults(options.filters.changed, options.filters);
					delete options.filters.changed;
				}
			if (period) {
				options.from = period.from;
				options.to = period.to;	
			}	
			options = _.defaults(options, timeline.xhr_defaults);
			return options;
		},
	},
	
	/**
	 * render [.thumb] into gallery body by page, i.e. .body > .page[data-page="N"] >.thumb
 	 * @param {jquery} container, jquery obj holding rendered items, may be offscreen
 	 * 		if offscreen, will also append to this.$('.body')
 	 * @param Object options, default={force: false, scroll: true}
	 */
	renderBody: function(container, options){
		
		if (snappi.PAGER_STYLE == 'timeline') {
			this.renderBody_Period.apply(this, arguments);
		} else {
			this.renderBody_Page.apply(this, arguments);
		}
		// for debugging
		if (_DEBUG) this.introspect();
	},
	
	renderBody_Period: function(container, options){
		options = options || {};
		var that = this,
			stale = options.force || false, 
			collection = this.collection,
			pageContainer;
		
		if (container && container.hasClass('page')) {
			pageContainer = container; // container is already onscreen
		} else {
			pageContainer = this.timeline_helper.getPeriodContainer$(this);
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
			var $before = $current = null, 
				body = this.$('.body'),
				timeline = this.timeline.toJSON();
				
			$before = this.timeline_helper.createPeriodContainers$(this, timeline, body);
			
			pageContainer = this.timeline_helper.getPeriodContainer$(this, 'create');
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
	renderBody_Page: function(container, options){
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
				// TODO: need to sort in collection first!!!!!!!!!
				pageContainer.append(container.children());
				stale = true;
				// page already rendered, AND new elements to add, 
			}
		}
		if (pageContainer.length && container && container.children().length) {
				// page already rendered, no new elements to add, 
				// but refreshLayout() ?? 
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
	// debugging
	introspect: function() {
		return;
		var auditions = SNAPPI.Auditions;
		_.each(this.$('div.thumb'), function(el,k,l) {
			var id = $(el).attr('id'),
				models;
			models = (this.collection instanceof Backbone.Paginator.clientPager)
				? this.collection.origModels
				: this.collection.models;
			$(el).find('img').get(0).raw = auditions[id];
			// $(el).find('img').get(0).parsed = _.findWhere(models, {id: id}).toJSON();
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