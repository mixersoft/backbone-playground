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
		
		template_source: "#markup #Timeline.underscore",

		initialize: function () {
			if(!($.isFunction(this.template))) {
				var source = $(this.template_source).html();	
				// compile once, add to Class
				views.TimelineView.prototype.template = _.template(source);
		    }
		    this.listenTo(this.model, 'sync', this.render);
		    this.listenTo(this.collection, 'sync', this.renderState);
		},
		
		// triggered by Timeline."sync"
		render: function (model, resp, options) {
			console.log("Timeline.render"); 
			var html = this.template(this.model.toJSON());
			this.$el.html(html);
		},
		
		renderState: function(collection, resp, xhr){
			var timeline_attr = this.model.toJSON(),
				i = timeline_attr.active,
				period = timeline_attr.periods[i],
				key = period.period+'-'+timeline_attr.currentZoom;
			timeline_attr.fetched[key] = "check filter to confirm";
			this.$el.html(this.template(this.model.toJSON()));
			return;
		},
		
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

		gotoPeriod: function (e) {
			e.preventDefault();
			var index, 
				label = $(e.target).text(),
				model_attr = this.model.toJSON();
			_.each(model_attr.periods, function(e,i,l){
				if (label.indexOf(e.label)===0) {
					index = i;
					return false;
				}
			});	
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