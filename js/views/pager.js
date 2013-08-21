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

		tagName: 'aside',
		
		template_source: "#markup #PagerTemplate.underscore",

		initialize: function () {
			if(!($.isFunction(this.template))) {
				var source = $(this.template_source).html();	
				// compile once, add to Class
				views.PagerView.prototype.template = _.template(source);
		    }
		    var collection = this.collection;
		    // this.listenTo(collection, 'reset', this.render);
		    this.listenTo(collection, 'sync', this.render);
		    this.$el.appendTo('#pager');
		    
		    return;

			this.collection.on('reset', this.render, this);
			this.$el.appendTo('#pager');

		},
		render: function () {
			var paging = this.collection.info();
			
			// for clientPaging template with requestPaging
			paging.startRecord = paging.totalRecords === 0 ? 0 : (paging.currentPage - 1) * paging.perPage + 1,
			paging.endRecord = Math.min(paging.totalRecords, paging.currentPage * paging.perPage); 

			
			// for clientPaging, manually adjust paging attrs to match server values
			// paging.totalRecords = this.collection.paginator_ui.serverPaging.total;
			// paging.totalPages = this.collection.paginator_ui.totalPages;
			// paging.pageSet = this.collection.setPagination(paging);
			
			var html = this.template(paging);
			this.$el.html(html);
		},

		gotoFirst: function (e) {
			e.preventDefault();
			this.collection.goTo(this.collection.information.firstPage, { update: true, remove: false });
		},

		gotoPrev: function (e) {
			e.preventDefault();
			this.collection.previousPage({ update: true, remove: false });
		},

		gotoNext: function (e) {
			e.preventDefault();
			this.collection.nextPage({ update: true, remove: false });
		},

		gotoLast: function (e) {
			e.preventDefault();
			this.collection.goTo(this.collection.information.lastPage, { update: true, remove: false });
		},

		gotoPage: function (e) {
			e.preventDefault();
			var page = $(e.target).text();
			this.collection.goTo(page,{ update: true, remove: false });
		},

		changeCount: function (e) {
			e.preventDefault();
			var per = $(e.target).text();
			this.collection.rendered = {};		// reset
			this.collection.howManyPer(per);
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
		}
	});
})( snappi.views );