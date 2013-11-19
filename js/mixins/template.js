// /js/mixins/snappi.js
(function ( mixins ) {
	"use strict";
        
mixins.Handlebars = {
	initialized: false,
	initialize: function(){
		if (mixins.Handlebars.initialized) return;
		var helpers = mixins.Handlebars.helpers;
		_.each(helpers, function(value,key,l){
			Handlebars.registerHelper(key, value);
		});
	},
	helpers: {
		// fontawsome rating stars, {rating: [0..5] }
		ratingStars: function(rating, options) {
			rating = rating || 0;
			var out = "";
			for(var i=1; i<=5; i++) {
				out += "<i class='fa fa-star"+(i>rating ? "-o" : "")+"'></i>";
			}
			return out;
		},
		// bootstrap button group with label [{lebel: activve}]
		buttonGroupButtons: function ( buttons, label, options){
			var out = '<button class="btn btn-small disabled">'+label+'</button>';
			_.each(buttons, function(e,i,l){
				out += options.fn(e);
			});
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