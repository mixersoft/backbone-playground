(function (views) {

	views.PagerView = Backbone.View.extend({

		events: {
			'click a.first': 'gotoFirst',
			'click a.prev': 'gotoPrev',
			'click a.next': 'gotoNext',
			'click a.last': 'gotoLast',
			'click a.page': 'gotoPage',
			'click .howmany a': 'changeCount',
			'click a.sortAsc': 'sortByAscending',
			'click a.sortDsc': 'sortByDescending',
			'click a.filter': 'filter'
		},
		
		el: '#pager',

		// tagName: 'aside',
		
		template_source: "#markup #PagerBootstrap.underscore",

		initialize: function () {
			if(!($.isFunction(this.template))) {
				var source = $(this.template_source).html();	
				// compile once, add to Class
				views.PagerView.prototype.template = _.template(source);
		    }
		    var collection = this.collection;
			var qs = snappi.mixins.Href.parseQueryString();
			if (qs.perpage) collection.perPage = collection.paginator_ui.perPage = parseInt(qs.perpage);

		    // this.listenTo(collection, 'reset', this.render);
		    this.listenTo(collection, 'sync', this.render);
		    this.listenTo(collection, 'scrollPage', this.renderCurrentPage);
		},
		render: function (collection, resp, options) {
			// note: the 'model' comes from requestPager.collection.info()
			var paging = this.collection.info();
			paging.showing = this.collection.models.length;
			var html = this.template(paging);
			this.$el.html(html);
			_.each(this.$('ul.page li > a.page, ul.page li > span'), function(item){
				var page = $(item).text();
				if (this.collection.fetchedServerPages[page]) {
					$(item).css('font-weight','bold');
				}
			}, this);
		},

		gotoFirst: function (e) {
			e.preventDefault();
			this.collection.goTo(this.collection.information.firstPage, { merge: true, remove: false });
		},

		gotoPrev: function (e) {
			e.preventDefault();
			this.collection.prevPage({ merge: true, remove: false });
		},

		gotoNext: function (e) {
			e.preventDefault();
			this.collection.nextPage({ merge: true, remove: false });
		},

		gotoLast: function (e) {
			e.preventDefault();
			this.collection.goTo(this.collection.information.lastPage, { merge: true, remove: false });
		},

		gotoPage: function (e) {
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
		
		renderCurrentPage: function(visiblePage, dir){ 
			this.collection.currentPage = visiblePage;
			this.render();
		}
	});
})( snappi.views );