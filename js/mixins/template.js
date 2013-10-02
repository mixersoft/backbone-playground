// /js/mixins/snappi.js
(function ( mixins ) {
	
	/*
	 * private vars
	 */
	var _lastScrollTop = 0;
        
mixins.Handlebars = {
	initialized: false,
	initialize: function(){
		if (mixins.Handlebars.initialized) return;
		var helpers = mixins.Handlebars.helpers;
		for (var key in helpers) {
			Handlebars.registerHelper(key, helpers[key]);
		} 
	},
	helpers: {
		// fontawsome rating stars, {rating: [0..5] }
		ratingStars: function(rating, options) {
			var rating = rating || 0, out = "";
			for(var i=1; i<=5; i++) {
				out = out + "<icon class='icon-star"+(i>rating ? "-empty" : "")+"'></icon>";
			}
		  	return out;
		},
		// bootstrap button group with label [{lebel: activve}]
		buttonGroupButtons: function ( buttons, label, options){
			var out = '<button class="btn btn-small disabled">'+label+'</button>';
			_.each(buttons, function(e,i,l){
				out += options.fn(e);
			})
			return out;
		},
		// unused
		fullText: function(string, options) {
			if (string.length > options.length)
			return options.fn();
		},
	},
};	
	
mixins.Handlebars.initialize();
	
})( snappi.mixins);