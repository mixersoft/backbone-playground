(function (views, mixins) {


/*
 * View: Timeline
 * properties
 * methods:
 */
// define Class hierarchy at the top, but use at the bottom
var extend = function(classDef){
	views.PlacelineView = Backbone.View.extend(
		// add mixins
		classDef
	);
}


var PlacelineView = {

		events: {
			'click .item.prev': 'gotoPrev',
			'click .item.next': 'gotoNext',
			'click .item.link': 'gotoPeriod',
			'click .period': 'changePeriod',
		},
		
		el: '#pager',

		// tagName: 'aside',
		
		template_source: "#markup #Placeline.underscore",

		initialize: function () {
			if(!($.isFunction(this.template))) {
				var source = $(this.template_source).html();	
				// compile once, add to Class
				views.PlacelineView.prototype.template = _.template(source);
		    }
		    this.listenTo(this.model, 'gotoPeriod', this.gotoPeriod);
		    this.listenTo(this.model, 'sync', this.render);
		    this.listenTo(this.collection, 'sync', this.renderState);
		    this.listenTo(this.collection, 'xhr-fetching', this.renderFetching);
		    // this.listenTo(this.collection, 'xhr-fetched', this.renderFetched);
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
			getCurrentPeriod$: function(that){
				var model = that.model.toJSON(),
					data = {
						currentZoom: model.currentZoom,
						currentPeriod: model.periods[model.active].period
					},
					selector = _.template('.page .item.period-<%= currentPeriod %>[data-zoom="<%= currentZoom %>"]', data),
					$item = that.$(selector);
				return $item.length ? $item : false;
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
		        _.each($('.gallery .body .page'), function(item, i ,l){
		        	if (scrollDir=='down') {
			        	if (visiblePg && item.offsetTop > windowB)
			        	{
			        		// if (item.offsetTop + item.offsetHeight < windowB) visiblePg = item;
			        		return false;
			        	} 
		        	} else { // page up
			        	if (visiblePg && (item.offsetTop + item.offsetHeight) > windowB) {
			        		if (item.offsetTop-OFFSET_H < windowT) visiblePg = item;
			        		return false;
			        	} 
		        	}
		        	visiblePg = item;
		        });
		        
		        var nextPage, scrollPage = $(visiblePg).data('period');
		// console.log('scroll to page='+scrollPage);        
	        	var settings = this.model.toJSON(),
	        		nextPage,
	        		nextFetchedPage;
        		nextPage = scrollDir=='down' ? settings.active+1 : settings.active-1;
        		nextPage = (nextPage < 0) ? 0 : (nextPage > settings.periods.length -1) ? settings.periods.length -1 : nextPage;
        		nextFetchedPage = this.model.helper.nextFetched(scrollDir, settings.active, settings);
        		// BUG: cannot detect e.ctrlKey on scroll event!!!
	        	if (false && nextPage != nextFetchedPage) { // fetch next page, if necessary
	        		if (!this.$el.hasClass('xhr-fetching')) 
	        			this.model.set('active', nextPage);
	        		else console.info("cancel fetch on scrollspy because still fetching")
	        	} else if (nextFetchedPage) {
	        		var doNotFetch = {silent:true}
	        		this.model.set('active', nextFetchedPage, doNotFetch);
	        		this.renderState();
	        	}
		    },

		},
		
		// render Loading spinner when page load is requested
		renderFetching: function(){
			this.$el.addClass('xhr-fetching');		// use to debounce scroll
			var spinner = '<i class="icon-spinner icon-spin icon-small"><i>';
			var found = PlacelineView.helper.getCurrentPeriod$(this); 
			if (found) found.html(spinner);
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
				label = $(e.currentTarget).attr('title'),
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
			var per = $(e.currentTarget).attr('title');
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
extend(PlacelineView);		
	
	
})( snappi.views, snappi.mixins );