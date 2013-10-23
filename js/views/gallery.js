// /js/views/gallery.js

(function ( views, mixins ) {
	
// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	var options = _.extend({}, 
		mixins.UiActions,
		mixins.Href,
		mixins.PagerHelpers, 	// for Timeline|Placeline|Page helpers
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
		'click .icon-resize-full': 'onZoom',
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
		
		// this.render();
		/*
		 * NOTE: get containerWidth BEFORE rendering Views, to avoid an unnecssary layout/paint
		 */
		// TODO: update on window.resize
		this.$el.data('outerW', this.$('.body').outerWidth());
		$('body').data('winH', $(window).height());
		$('body').data('winW', $(window).width());

		// timeline controls collection
		this.$el.addClass('pager-'+snappi.PAGER_STYLE);
		switch (snappi.PAGER_STYLE) {
			case 'timeline': 
				this.listenTo(this.timeline, 'sync', this['Pager']['Timeline']['GalleryView'].onTimelineSync);
				this.listenTo(this.timeline, 'change:active', this['Pager']['Timeline']['GalleryView'].onTimelineChangePeriod);
				this.listenTo(this.timeline, 'change:filters', this['Pager']['Timeline']['GalleryView'].onTimelineChangeFilter);

				break;
			case 'placeline': 
				this.listenTo(this.timeline, 'sync', this['Pager']['Placeline']['GalleryView'].onPlacelineSync);
				this.listenTo(this.timeline, 'change:active', this['Pager']['Placeline']['GalleryView'].onPlacelineChangePeriod);
				this.listenTo(this.timeline, 'change:filters', this['Pager']['Placeline']['GalleryView'].onPlacelineChangeFilter);

				// NOTE: this only works when the zoom is changed from the Pager View
				// but the action initiates from the GalleryView or PhotoView
				this.listenTo(this.timeline, 'change:zoom', this['Pager']['Placeline']['GalleryView'].onPlacelineChangeZoom);
				
				break;
			case 'page': 
				break;
		} 

		var collection = this.collection;
		this.listenTo(collection, 'reset', this.addAll);
		this.listenTo(collection, 'refreshLayout', this.refreshLayout);
		this.listenTo(collection, 'repaginated', this.refreshPages);
		this.listenTo(collection, 'add', this.add);
		this.listenTo(collection, 'sync', this.addPage);
		this.listenTo(this, 'addBack', this.addBack);
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
		switch (snappi.PAGER_STYLE) {
			case 'timeline': 
			case 'placeline': 
				break;
			case 'page':
				collection.pager({ remove: false }); 
				break;
		} 

		this.render();
	},

	/**
	 * Zoom action
	 * 		- starts from PhotoView .click
	 *		- somehow trigger change in Pager, models.Placeline??
	 * 			- why does the Pager need to know? for pageUp/Dn actions
	 *		- 
	 	trigger changeZoom event on placeline, 
	 	see: GalleryView.onPlacelineChangePeriod() (placeline Helper)
	 	placelineView/Model knows currentZoom/next zoom
	 	placeline checks e.currentTarget to know where to insert new page
	*/
	onZoom: function(e){
		e.preventDefault();
		
		var that = this, 
			thumb = null,
			mPhoto = "should be models.Photo",
			helpers = this['Pager']['Placeline']['GalleryView'],
			currentZoom = this.timeline.get('currentZoom'); // TODO: get from pager

		thumb = $(e.currentTarget).closest('.thumb');
		mPhoto = _.findWhere(this.collection.models, { id: thumb.attr('id') });
		mPhoto = mPhoto.toJSON();

		var pivot = {
			place_id: mPhoto.place_id,
			lat: mPhoto.latitude,
			lon: mPhoto.longitude,
			accuracy: mPhoto.accuracy,
			currentZoom: currentZoom,
			dir: 'zoom-in',
			pivot: thumb,
			pivot_model: mPhoto,	// ???: this needed?
		}
		that.timeline.trigger('change:zoom', pivot);

		// ???: should we update pivot.currentZoom??
		// ??? shouldn't the fetch be triggered by
		that.collection.fetchZoom(pivot, {
			fetchOptions: helpers.getXhrPivotOptions(this),
			success: function(collection, response, options){
				var check;
			},
			complete: function(){
				that.collection.listenToOnce(that.collection, 'layout-complete', function(){
					_.defer(function(){
						thumb.get(0).scrollIntoView();			
					})
				})
			}
		});
	},
	
	render: function(){
		
		/*
		 * create delegated views
		 */
		switch (snappi.PAGER_STYLE) {
			case 'timeline': 
				new snappi.views.TimelineView({
					el: this.$('.header .pager'),
					model: this.timeline,
					collection: this.collection,
				});
				var options = this.Pager['Timeline']['GalleryView'].getXhrFetchOptions(this);
				this.timeline.fetch({data: options}); 
				
				this.displayOptions = new views.GalleryDisplayOptionsView({
					el: this.$('.header .display-options'),
					collection : this.collection,
					timeline: this.timeline,
				});
				break;
			case 'placeline': 
				new snappi.views.PlacelineView({
					el: this.$('.header .pager'),
					model: this.timeline,
					collection: this.collection,
				});
				var xhrOptions = this.Pager['Placeline']['GalleryView'].getXhrFetchOptions(this);
				var that = this,
					cb = function(){
					that.displayOptions = new views.GalleryDisplayOptionsView({
						el: that.$('.header .display-options'),
						collection : that.collection,
						timeline: that.timeline,
					});
				}
				this.timeline.fetch({
					data: xhrOptions,
					success: cb,
				}); 
				break;
			case 'page': 
				this.pager = new views.PagerView({
					el: this.$('.header .pager'),
	 				collection : this.collection,
				});
				break;
		} 
	},
	
	refreshLayout: function() {
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
				template = that.Pager['Timeline']['GalleryView'].templates.periodContainerLabel,
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
		/*
		 *  Coll.fetch() > Coll."sync" > success(), View.addPage() > complete() 
		 */
		var collection = this.collection,
			$pageContainer, $thumb, $container, 
			offscreen = true;
		// check if pageContainer already exists
		
		if (offscreen) {
			options = {
				offscreen : $('<div class="body"></div>'),	// build page in orphaned el
				offscreenTop : _.template(
					'top:<%=top%>px;',
					{ 	// set CSS transition start point offscreen
						top: Math.max(this.$el.height(),$('body').data('winH')) 
					}
				),
			};
		}

		switch (snappi.PAGER_STYLE) {
			case 'timeline': 
				//  using !!resp.assets to detect NEW models from sync
				var added_models = false,
					resp_models = _.pluck(resp.assets,'id');
				_.each(collection.models, function(model,i,l){
					if (resp_models.indexOf(model.get('photoId')) >=0 ) {
						$thumb = this.addOne(model, options);
						added_models = true;
					}
				}, this);

				if (added_models) {
					$container = options.offscreen;
					this.renderBody($container);
				} else {
					this.refreshLayout();
				}
				break;
			case 'placeline': 
				//  using !!resp.assets to detect NEW models from sync
				var added_models = false,
					resp_models = _.pluck(resp,'id');
				_.each(collection.models, function(model,i,l){
					if (resp_models.indexOf(model.get('photoId')) >=0 ) {
						$thumb = this.addOne(model, options);
						added_models = true;
					}
				}, this);

				if (added_models) {
					$container = options.offscreen;
					this.renderBody($container);
				} else {
					this.refreshLayout();
				}
				break;
			case 'page': 
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
				$container = offscreen ? options.offscreen : this.$('.body'); 	
				this.renderBody($container);
				break;
		}
	},
	/**
	 * addBack a removed model, must be added to the correct page
	 * 	- called by onTimelineChangeFilter(fetch=true)
	 */
	addBack : function(collection, photoIds, options) {
		var sortedAdded=[], sortedIds=[],
			viewClass, thumbView, 
			$thumb, $pageContainer,
			model, after,
			TS, added_index;

		// sort everything based on collection.sort()		
		collection.sort();
		_.each(collection.models, function(e,i,l){
			var id = e.get('photoId')
			sortedIds.push(id);
			if (photoIds.indexOf(id)>-1) sortedAdded.push(id);
		})
		
		_.each(sortedAdded, function(pid,i,l){
			// create thumbView for added model
			model = collection.models[sortedIds.indexOf(pid)];
			viewClass = (model instanceof snappi.models.Shot)?  views.ShotView : views.PhotoView;
			thumbView = new viewClass({model:model, collection: collection});
			$thumb = thumbView.render().$el;
			
			// find where to insert $thumb
			switch (snappi.PAGER_STYLE) {
				case 'timeline': 
					TS = model.get('TS_UTC');
					$pageContainer = this.Pager['Timeline']['GalleryView'].getPeriodContainerByTS$(this, TS);
					break;
				case 'placeline': 
					$pageContainer = this.Pager['Placeline']['GalleryView'].getPeriodContainerByLon$(this, TS);
					break;
				case 'page':
					console.warn("incomplete: find pageContainer by requestPage") 
					break;
			} 
console.log("addBack() page="+$pageContainer.data('period'));							
			added_index = sortedIds.indexOf(pid); 
			after = _.find($pageContainer.find('.thumb'), function(thumb){
				return (sortedIds.indexOf(thumb.id) > added_index)
			});
			if (after)
				$(after).parent().before($thumb);
			else if (!after) {
				$pageContainer.append($thumb);
			}	

		}, this);
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
		} else {
			console.log("already added");
			// add to $parent
		}
		return $thumb;
	},
	
	onKeyPressNav: function(){
		// PageDown call onContainerScroll?
		
	},
	
	onSetPerpage: function(){
		// calls this.collection.howManyPer()
		// also called from PagerView.changeCount()
	},

	/*
	 * render [.thumb] into gallery body by page, i.e. .body > .page[data-page="N"] >.thumb
 	 * @param {jquery} container, jquery obj holding rendered items, may be offscreen
 	 * 		if offscreen, will also append to this.$('.body')
 	 * @param Object options, default={force: false, scroll: true}
	 */
	renderBody: function(container, options){
		switch (snappi.PAGER_STYLE) {
			case 'timeline': 
				// this.renderBody_Period.apply(this, arguments);
				this.Pager['Timeline']['GalleryView'].renderBody.apply(this, arguments);
				break;
			case 'placeline':
				this.Pager['Placeline']['GalleryView'].renderBody.apply(this, arguments);
				break;
			case 'page':
				this.Pager['Page']['GalleryView'].renderBody.apply(this, arguments);
				break;
		}
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
var check;
})( snappi.views, snappi.mixins );