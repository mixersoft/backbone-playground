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
		},
		
		el: '#pager',

		// tagName: 'aside',
		
		template_source: "#markup #PagerBootstrap.underscore",

		initialize: function () {
			if(!($.isFunction(this.template))) {
				var source = $(this.template_source).html();	
				// compile once, add to Class
				views.TimelineView.prototype.template = _.template(source);
		    }
		    var collection = this.collection;
			var qs = snappi.qs
			if (qs.perpage) collection.perPage = collection.paginator_ui.perPage = parseInt(qs.perpage);

		    // this.listenTo(collection, 'reset', this.render);
		    this.listenTo(collection, 'timeline-sync', this.render);
		    this.listenTo(collection, 'scrollPage', this.renderCurrentPage);
		    this.listenTo(collection, 'xhr-fetch-page', this.renderLoading);
		},
		render: function (collection, resp, options) {
			// note: the 'model' comes from requestPager.collection.info()
			var paging = this.collection.info();
			paging.showing = this.collection.models.length;
			var html = this.template(paging);
			this.$el.html(html);
			_.each(this.$('.pagination .page .item'), function(item){
				var page = $(item).text();
				if (this.collection.fetchedServerPages[page]) {
					$(item).addClass('loaded');
				}
			}, this);
		},
		

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

		gotoPeriod: function (e) {
			e.preventDefault();
			var page = $(e.target).text();
			this.collection.goTo(page,{ merge: true, remove: false });
		},

		changeCount: function (e) {
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
		
		renderLoading: function (page) {
			// $('body').addClass('wait');
			_.each(this.$('.item.link'), function(v){
				if (v.textContent==page) {
					$(v).html('<i class="icon-spinner icon-spin icon-small" data-page="'+page+'"><i>');
					return false;
				}
			}, this);
		},

	};
	
// put it all together at the bottom
extend(TimelineView);		
	
	
})( snappi.views, snappi.mixins );