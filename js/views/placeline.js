(function (views, mixins) {
	"use strict";

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
};

var PlacelineView = {

		events: {
			'click .page .item.prev': 'gotoPrev',
			'click .page .item.next': 'gotoNext',
			'click .page .item.link': 'gotoPeriod',
			'click .zoom .item.link': 'renderZoom',
			'mouseenter .zoom .item:not(.page-label)': 'highlightOn',
			'mouseleave .zoom .item:not(.page-label)': 'highlightOff',
		},

		highlightOn: function(e){
			var zoom = $(e.currentTarget).text();
			$('.gallery .body .thumb.'+zoom).addClass('highlight');
		},

		highlightOff: function(e){
			var zoom = $(e.currentTarget).text();
			$('.gallery .body .thumb.'+zoom).removeClass('highlight');
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
			this.listenTo(this.collection, 'change:period', function(){
					// disabled for Placeline. no perpage
			});
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
					selector = _.template('.page .item[data-period="<%= currentPeriod %>"][data-zoom="<%= currentZoom %>"]', data),
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
					return e.place_id === pageId && e.place_type === settings.currentZoom;
				});
				pagerIndex = _.indexOf(settings.periods, pagerPeriod);
				if (pagerIndex==-1) 
					return;
				this.model.set('active', pagerIndex, {silent:true});
				this.renderState();	

			},
		},
		
		// render Loading spinner when page load is requested
		renderFetching: function(){
			this.$el.addClass('xhr-fetching');		// use to debounce scroll
			var spinner = '<i class="fa fa-2x fa-spinner fa-spin"><i>';
			var found = PlacelineView.helper.getCurrentPeriod$(this); 
			if (found) found.html(spinner);
			else {
				// periods not created for new zoom yet
				var zoom = this.model.get('currentZoom');
				_.find(this.$('.zoom .link'), function(item){
					if ($(item).text() == zoom) {
						$(item).append(spinner);
						return true;
					}
				});
			}
		},
		
		// render Loading spinner when page load is requested
		// listenTo 'xhr-fetching'
		renderFetched: function(){
console.info("0 Timeline.renderFetched");				
			this.renderState();
			_.delay(function(that){
				// console.warn("remove xhr-fetching");
console.info("0 Timeline. delayed remove class xhr-fetching");					
				that.$el.removeClass('xhr-fetching');		// use to debounce scroll
			}, snappi.TIMINGS.xhr_ui_debounce, this);
		},
		
		// render timeline, show fetched periods
		renderState: function(){
console.info("0 Timeline.renderState");

			var model = this.model.toJSON();
			this.model.helper.setFetched(this.model); 
			this.$el.html(this.template(model));

			// update GalleryView .body .pages
			var currentZoom = model.currentZoom,
				$pages = $('.body .page');
			$pages.removeClass('zoom-inactive zoom-active');
			$pages.filter('.page:not([data-zoom="'+currentZoom+'"])').addClass('zoom-inactive');
			$pages.filter('.page[data-zoom="'+currentZoom+'"]').addClass('zoom-active');
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
				console.warn("TODO: check if filter has changed, active="+index);
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
				console.warn("TODO: check if filter has changed, active="+index);
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
				model_attr = this.model.toJSON();

			where = where || {label: label};	
			var period = _.findWhere(model_attr.periods, where);
				
			// _.each(model_attr.periods, function(e,i,l){
				// if (label.indexOf(e.label)===0) {
					// index = i;
					// return false;
				// }
			// });	
			if (!period) return false;
			
			index = model_attr.periods.indexOf(period);
			if (model_attr.active == index) {
				console.warn("TODO: check if filter has changed, active="+index);
			}
			this.model.set('active', index);
		},
		// 'click .zoom .item.link'
		renderZoom: function(e){
			var that = this,
				old = this.model.toJSON(),
				currentZoom;
			if (e) {
				e.preventDefault();
				currentZoom =  $(e.currentTarget).text();
			} else currentZoom =  old.place_type;

			this.model.set('currentZoom', currentZoom, {silent:true});

			// get active .page for currentZoom
			var active = false,
				old_place_id = old.periods[old.active].place_id,
				updated = _.defaults({currentZoom:currentZoom}, old);

			var found = _.find(old.periods, function(elem,i,l){
				if (elem.place_type == currentZoom && active===false) {
					var isFetched = that.model.helper.isFetched(i, updated);
					if (isFetched) 
						active = i;
				}
				if (active!==false &&  
					elem.place_type == currentZoom	&&  
					elem.place_id==old_place_id
				) {
					active = i;
					return true;
				}
			});
			if (!active ) {
				console.error("we should have found an active period");
			}
			this.renderState();
			_.defer(function(){	// scroll to
				if (active) that.model.set('active', active);
			});
		},
		// .perpage removed for Placeline
		XXXchangePeriod: function (e) {
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