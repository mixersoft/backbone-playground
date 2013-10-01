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
		// fontawsome rating stars, {rating: int}
		ratingStars: function(rating, options) {
			var rating = rating || 0, out = "";
			for(var i=1; i<=5; i++) {
				out = out + "<icon class='icon-star"+(i>rating ? "-empty" : "")+"'></icon>";
			}
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