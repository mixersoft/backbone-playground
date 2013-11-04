(function (views, mixins) {


/*
 * View: Timeline
 * properties
 * methods:
 */
// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	views.TimelineView = Backbone.View.extend(
		// add mixins
		classDef
	);
}


var TimelineView = {

		events: {
			'click .item.prev': 'gotoPrev',
			'click .item.next': 'gotoNext',
			'click .item.link': 'gotoPeriod',
			'click .period': 'changePeriod',
			'click .zoom .item.link': 'renderZoom',
			'mouseenter .zoom .item:not(.page-label)': 'highlightOn',
			'mouseleave .zoom .item:not(.page-label)': 'highlightOff',
		},
		
		el: '#pager',

		// tagName: 'aside',
		
		template_source: "#markup #Timeline.underscore",

		ux_blockUi: function(){
			return this.$el.addClass('xhr-fetching');
		},
		ux_showWaiting: function() {
			var spinner = '<i class="fa fa-2x fa-spinner fa-spin"><i>';
			var found = TimelineView.helper.getCurrentPeriod$(this); 
			if (found) 
				return found.html(spinner);
			// period not found, attach to zoom
			var zoom = this.model.get('currentZoom');
			var found = _.find(this.$('.zoom .link'), function(item){
				if ($(item).text() === zoom) 
					return true;
			});
			if (found) 
				return $(found).append(spinner);
				
			if (!found) // zoom not found, attach to pager
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
				views.TimelineView.prototype.template = _.template(source);
		    }
		    this.listenTo(this.model, 'gotoPeriod', this.gotoPeriod);
		    this.listenTo(this.model, 'sync', this.render);
		    this.listenTo(this.collection, 'sync', this.renderState);

/*
Notes:
- Collection.'click .zoom-in' WILL trigger Timeline.'change:currentZoom'
- Timeline change:currentZoom MAY trigger Timeline.sync
	- Timeline.sync WILL trigger Timeline.renderFetching()
	- Timeline.sync WILL trigger Collection.sync
- Timeline change:currentZoom WILL trigger Timeline.'sync:currentZoom'
- Timeline.'sync:currentZoom' WILL trigger GV.onZoom > Collection.fetchZoom(pivot) > Collection.sync 
- Collection.sync WILL trigger Timeline.renderFetching()

- Timeline change:active MAY trigger Collection.sync OR GV.scroll

syncTimeline = new $.Deferred();
syncTimeline.then() == syncTimeline.done().fail().always()
syncTimeline.when()


*/
		    // Timeline XHR request, triggered by Backbone.sync()
		    this.listenTo(this.model, 'request',  this.helper.uxBeforeXhr);	
		    this.listenTo(this.collection, 'request',  this.helper.uxBeforeXhr);	
		    this.listenTo(this.collection, 'xhr-ui-ready', this.renderFetched);
		},
		
		// triggered by Timeline."sync"
		render: function (model, resp, options) {
			console.log("Timeline.render"); 
			var html = this.template(this.model.toJSON());
			this.$el.html(html);
			
			$(window).on('scroll', $.proxy(this.onContainerScroll, this));
		},
		

		helper: {
			uxBeforeXhr: function(model, xhr, options){
console.info("1. Timeline.'request'");
		    	// this.ux_blockUi();
		    	this.ux_showWaiting();
		    	xhr.always(function(){
		    		// if a Collection.sync is triggered, then defer cleanup
		    		// when will we know if a Collection.sync is triggered?
console.info("1. Timeline.'request' jqXhr.always()");
					// when 'all-done' this.ux_clearWaiting();
		    	});
		    	xhr.done(function(){
console.info("1. Timeline.'request' jqXhr.done()");
		    	
		    	});
		    },

			getCurrentPeriod$: function(that){
				try {
					var model = that.model.toJSON(),
						data = {
							currentZoom: model.currentZoom,
							currentPeriod: model.periods[model.active].period
						},
						selector = _.template('.page .item.period-<%= currentPeriod %>[data-zoom="<%= currentZoom %>"]', data),
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

		        var pageId = $(visiblePg).data('period');
		        var settings = this.model.toJSON();
		        var pagerPeriod, pagerIndex;

		        pagerPeriod = _.find(settings.periods, function(e){ 
		        	var found = e.period === pageId; // && e.period_type === settings.currentZoom;
		        	return found;
		        });
		        pagerIndex = _.indexOf(settings.periods, pagerPeriod);
		        if (pagerIndex==-1) 
		        	return;
		        this.model.set('active', pagerIndex, {silent:true});
        		this.renderState();	

		    },

		},
		
		// render Loading spinner when page load is requested
		renderFetched: function(){
			this.renderState();
			_.delay(function(that){
				// console.warn("remove xhr-fetching");
				that.$el.removeClass('xhr-fetching');		// use to debounce scroll
			}, snappi.TIMINGS.xhr_ui_debounce, this);
		},
		
		// render timeline, show fetched periods
		renderState: function(){
			var model = this.model.helper.setFetched(this.model); 
			this.$el.html(this.template(model));
		},
		
		/**
	     * Called on the scroll event of the container element.  Used only in the non-paginated mode.
	     * When the scroll threshold is reached a new page of thumbs is requested.
	     * @param event e - the scroll event object
	     */
	    onContainerScroll : _.throttle(function(e){
	    	this.helper.scrollSpy.call(this, e);
	    }, 200, {leading: false}),
	    		
		
		gotoFirst: function (e) {
			e.preventDefault();
			this.collection.goTo(this.collection.information.firstPage, { merge: true, remove: false });
		},

		gotoPrev: function (e) {
			e.preventDefault();
			e.stopImmediatePropagation();
			var model_attr = this.model.toJSON(),
				index = model_attr.active-1,
				fetched_key = model_attr.currentZoom+'-'+model_attr.periods[index].period;
			if (model_attr.fetched[fetched_key]) {
				console.warn("TODO: check if filter has changed, active="+index)
				// just scroll
			} else 
				this.model.set('active', index);		},

		gotoNext: function (e) {
			e.preventDefault();
			e.stopImmediatePropagation();
			var model_attr = this.model.toJSON(),
				index = model_attr.active+1,
				fetched_key = model_attr.currentZoom+'-'+model_attr.periods[index].period;
			if (model_attr.fetched[fetched_key]) {
				console.warn("TODO: check if filter has changed, active="+index)
				// just scroll
			} else 
				this.model.set('active', index);
		},

		gotoLast: function (e) {
			e.preventDefault();
			this.collection.goTo(this.collection.information.lastPage, { merge: true, remove: false });
		},
		// 
		gotoPeriod: function (e, where) {
			e.preventDefault();
			var index, 
				label = $(e.target).text(),
				model_attr = this.model.toJSON(),
				where = where || {label: label};
				period = _.findWhere(model_attr.periods, where);
			// _.each(model_attr.periods, function(e,i,l){
				// if (label.indexOf(e.label)===0) {
					// index = i;
					// return false;
				// }
			// });	
			if (!period) return false;
			
			index = model_attr.periods.indexOf(period);
			if (model_attr.active == index) {
				console.warn("TODO: check if filter has changed, active="+index)
			}
			this.model.set('active', index);
		},

		changePeriod: function (e) {
			e.preventDefault();
			var per = $(e.target).text();
			this.collection.rendered = {};		// reset
			this.collection.trigger('repaginate', per);
			this.collection.howManyPer(per, { merge: true, remove: false });
		},

		renderCurrentPage: function(visiblePage, dir){ 
			this.collection.currentPage = visiblePage;
			this.render();
		},
		
	};
	
// put it all together at the bottom
extend(TimelineView);		
	
	
})( snappi.views, snappi.mixins );