(function (views, mixins) {

	views.PagerView = Backbone.View.extend({

		events: {
			'click a.first': 'gotoFirst',
			'click .item.prev': 'gotoPrev',
			'click .item.next': 'gotoNext',
			'click a.last': 'gotoLast',
			'click .page .item.link': 'gotoPage',
			'click .page .item.active': 'gotoPage',
			'click .howmany': 'changeCount',
			'click a.sortAsc': 'sortByAscending',
			'click a.sortDsc': 'sortByDescending',
			'click a.filter': 'filter'
		},
		
		el: '#pager',

		// tagName: 'aside',
		
		template_source: "#markup #PagerBootstrap.underscore",

		ux_blockUi: function(){
console.log("pager ux_blockUi");
			return this.$el.addClass('xhr-fetching');
		},
		ux_showWaiting: function() {
			var spinner = '<i class="fa fa-2x fa-spinner fa-spin"><i>';
			var found = this.helper.getCurrentPeriod$(this); 
			if (found) 
				return found.html(spinner);
				
			if (!found) // page el not found, attach to pager
				return this.$el.html(spinner);

		},
		ux_clearWaiting: function(){
			return true;	// noop
			// should be cleared by Pager.render()
		},
		ux_unblockUi: function(){
			return this.$el.removeClass('xhr-fetching');
		},

		initialize: function () {
			if(!($.isFunction(this.template))) {
				var source = $(this.template_source).html();	
				// compile once, add to Class
				views.PagerView.prototype.template = _.template(source);
		    }
		    var collection = this.collection;
			var qs = snappi.qs;
			if (qs.perpage) collection.perPage = collection.paginator_ui.perPage = parseInt(qs.perpage);

		    // this.listenTo(collection, 'reset', this.render);
		    this.listenTo(collection, 'sync', this.render);
		    this.listenTo(collection, 'change:page', this.renderState);
		    this.listenTo(collection, 'xhr-fetching', this.renderLoading);

		    // Timeline XHR request, triggered by Backbone.sync()
		    this.listenTo(this.collection, 'request',  this.helper.uxBeforeXhr);	
		    this.listenTo(this.collection, 'xhr-ui-ready', this.renderFetched);
		},
		render: function (collection, resp, options) {
			this.listenToOnce(collection, 'layout-chunk', function(){
				this.renderState();
				// only on sync, not page nave
				$(window).on('scroll', $.proxy(this.onContainerScroll, this));
			})
		},

		// render pager, show fetched periods
		renderState: function(options){
			var paging = this.collection.info();
			paging.showing = this.collection.models.length;
			var html = this.template(paging);
			this.$el.html(html);
			_.each(this.$('.pagination .page .item'), function(item){
				if (this.collection.fetchedServerPages[$(item).text()]) 
					$(item).addClass('loaded');
			}, this);
			if (options && !!options.silent) 
				return;
			var page = $(".gallery .body .page[data-page="+this.collection.currentPage+"]");
			if (page.length) 
				mixins.UiActions.scrollIntoView(page);
			return;
		},

		helper: {
			uxBeforeXhr: function(model, xhr, options){
// console.log("pager 'request' uxBeforeXhr()");				
		    	this.ux_showWaiting();
		    },

			getCurrentPeriod$: function(that){
				try {
					var selector = '.page .item[data-page="'+that.collection.currentPage+'"]',
						$item = that.$(selector);
					return $item.length ? $item : false;
				} catch (ex){
					return false;
				}
			},
			scrollSpy : function(e) {
		    	self = this;
		    	if (self.$el.hasClass('xhr-fetching')) {
		    		return;
		    	}
		    	
		    	var OFFSET_H = 40,
		    		target = self.$el,
		    		collection = this.collection,
		        	selfB = target.offset().top+target.height(),
		        	windowT = $(window).scrollTop(),
		        	windowB = windowT + $(window).height();
		        	
		        // find current visible page
		        var visiblePg, scrollDir = mixins.UiActions.detectScrollDirection();
		        if (!scrollDir) return;

		         visiblePg = _.find($('.gallery .body .page').has('.thumb'), function(item, i ,l){
		        	var isBottomBelowFold =  (item.offsetTop + item.offsetHeight) > windowB;
		        	var isBottomAboveFold =  (item.offsetTop + item.offsetHeight) <= windowB;
		        	var isTopBelowWindowT = item.offsetTop-OFFSET_H > windowT;	
		        	var isTopBelowFold = item.offsetTop > windowB;
		        	if (scrollDir=='up'){ // page up
			        	if (isBottomBelowFold) return true;
			        	if (isTopBelowWindowT) return true;
		        	}
		        	if (scrollDir=='down') {
		        		if (isTopBelowWindowT) return true;
			        	if (isBottomBelowFold) return true;
		        	}
		        });
		        if (!visiblePg && scrollDir=='up') 
		        	visiblePg = $('.gallery .body .page:first-child');
				else if (!visiblePg && scrollDir=='down') 
		        	visiblePg = $('.gallery .body .page:last-child');

		        collection.currentPage = $(visiblePg).data('page');
        		this.renderState({silent: true});	
		    },
		},	// end helper

		/**
	     * Called on the scroll event of the container element.  Used only in the non-paginated mode.
	     * When the scroll threshold is reached a new page of thumbs is requested.
	     * @param event e - the scroll event object
	     */
	    onContainerScroll : _.throttle(function(e){
	    	this.helper.scrollSpy.call(this, e);
	    }, 500, {leading: true}),
		

		gotoFirst: function (e) {
			e.preventDefault();
			this.collection.goTo(this.collection.information.firstPage, { merge: true, remove: false });
		},

		gotoPrev: function (e) {
			e.preventDefault();
			e.stopImmediatePropagation();
			this.collection.prevPage({ merge: true, remove: false });
		},

		gotoNext: function (e) {
			e.preventDefault();
			e.stopImmediatePropagation();
			this.collection.nextPage({ merge: true, remove: false });
		},

		gotoLast: function (e) {
			e.preventDefault();
			this.collection.goTo(this.collection.information.lastPage, { merge: true, remove: false });
		},

		gotoPage: function (e) {
			e.preventDefault();
			if (e.ctrlKey) 
				return this.releasePage(e);

			var $target = $(e.target);
		// console.warn("goto page="+$target.text());

			if ($target.hasClass('active') && 
				this.collection.fetchedServerPages[$target.text()]
			) {
				this.collection.trigger('xhr-ui-ready');
			}
			this.collection.goTo( $target.text() ,{ merge: true, remove: false });
		},

		releasePage: function(e) {
			e.preventDefault();
			if (e.ctrlKey) {
				// remove
				var page = $(e.target).text();
				this.collection.trigger('release-page', page);
				this.collection.trigger('xhr-ui-ready');
			}
		},

		changeCount: function (e) {
			e.preventDefault();
			var per = $(e.target).text();
			this.collection.rendered = {};		// reset
			this.collection.trigger('repaginate', per);
			this.collection.howManyPer(per, { merge: true, remove: false });
		},

		sortByAscending: function (e) {
			e.preventDefault();
			var currentSort = this.getSortOption();
			this.collection.setSort(currentSort, 'asc');
			this.collection.pager();
			this.preserveSortOption(currentSort);
		},

		getSortOption: function () {
			return $('#sortByOption').val();
		},

		preserveSortOption: function (option) {
			$('#sortByOption').val(option);
		},

		sortByDescending: function (e) {
			e.preventDefault();
			var currentSort = this.getSortOption();
			this.collection.setSort(currentSort, 'desc');
			this.collection.pager();
			this.preserveSortOption(currentSort);
		},
        
		getFilterField: function () {
			return $('#filterByOption').val();
		},

		getFilterValue: function () {
			return $('#filterString').val();
		},

		preserveFilterField: function (field) {
			$('#filterByOption').val(field);
		},

		preserveFilterValue: function (value) {
			$('#filterString').val(value);
		},

		filter: function (e) {
			e.preventDefault();

			var fields = this.getFilterField();
			/*Note that this is an example! 
			 * You can create an array like 
			 * 
			 * fields = ['Name', 'Description', ...];
			 *
			 *Or an object with rules like
			 *
			 * fields = {
			 *				'Name': {cmp_method: 'levenshtein', max_distance: 7}, 
			 *				'Description': {cmp_method: 'regexp'},
			 *				'Rating': {} // This will default to 'regexp'
			 *			};
			 */

			var filter = this.getFilterValue();
			
			this.collection.setFilter(fields, filter);
			this.collection.pager();

			this.preserveFilterField(fields);
			this.preserveFilterValue(filter);
		},
		
	});
	

	/*
	* static method
	* for testing memory/GC with multiple page load/release cycles
	* usage:  from console, _LOOP(10);
	*/
	views.PagerView.loop = function(_remaining, _fetched) {
		_fetched = _fetched || 0;
		if (_.isUndefined(_remaining)) _remaining = 1

		if (_remaining<=0) return 'done';

		var action = 'load'; 
		var page = 0;
		var clickEvent = jQuery.Event("click");
		var collection = snappi.app.collection;
		var TIMEOUT = 10*60*1000;	// 10 minutes

		var nextAction = function(err, cb){
			var deferred = new Deferred();
			page++;
			if (page > collection.totalPages) {
				if (action==='release') 
					return cb();
				if (action==='load') {
					_fetched += $(".gallery .body .thumb").length;
					action = 'release';
					page = 0;
					return _.defer(nextAction, null, cb);
				}
			}
			clickEvent.ctrlKey = action == 'release';
			var $next = $('.pager .page .item[data-page="'+page+'"]');
console.log(action+"  page="+page);
			if ($next.length) {
				snappi.app.listenToOnce(collection, 'xhr-ui-ready', function(){

					return _.defer(nextAction, null, cb);

				});
				clickEvent.target = $next.get(0);
				return _.delay(
					function(clickEvent){
						snappi.app.pager.gotoPage.call(snappi.app.pager, clickEvent);
					},
					500, clickEvent
				);
			}
			return _.defer(nextAction, null, cb);
		};

		nextAction(null, function(){
			_remaining--;
			console.log("_LOOP complete, fetched="+_fetched+", loops remaining="+_remaining);
			if (_remaining <= 0){
				$('html,body').animate({scrollTop:0});
				return
			}
			else _.delay(views.PagerView.loop, 2000, _remaining, _fetched);
		});

		_.delay(function(){
				console.log('LOOP timeout');
				_remaining = 0;
			}, 
			TIMEOUT
		);
	}
	window._LOOP = views.PagerView.loop;


})( snappi.views, snappi.mixins );