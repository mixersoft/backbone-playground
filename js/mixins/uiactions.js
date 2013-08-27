// /js/mixins/snappi.js
(function ( mixins ) {
	
/*
 * jQuery throttle / debounce - v1.1 - 3/7/2010
 * http://benalman.com/projects/jquery-throttle-debounce-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function(b,c){var $=b.Cowboy||(b.Cowboy={}),a;$.throttle=a=function(e,f,j,i){var h,d=0;if(typeof f!=="boolean"){i=j;j=f;f=c}function g(){var o=this,m=+new Date()-d,n=arguments;function l(){d=+new Date();j.apply(o,n)}function k(){h=c}if(i&&!h){l()}h&&clearTimeout(h);if(i===c&&m>e){l()}else{if(f!==true){h=setTimeout(i?k:l,i===c?e-m:e)}}}if($.guid){g.guid=j.guid=j.guid||$.guid++}return g};$.debounce=function(d,e,f){return f===c?a(d,e,false):a(d,f,e!==false)}})(this);


	
mixins.UiActions = {

	toggle: function() { /* ... */ },

	open: function() { /*... */ },

	close: function() { /* ... */ },
	
	scrollIntoView: function(target) {
		var top, next, target, NAVBAR_OFFSET_H = 40;
		if (!target.jquery) target = $(target);
		
		if (!target.length) return false;
		else {
	        // console.log(e.hash);
	        var delta = target.offset().top-NAVBAR_OFFSET_H - $(window).scrollTop();
	        if (delta < 0 || delta > 50) {
	        	$('html, body').animate({scrollTop: target.offset().top-NAVBAR_OFFSET_H}, 500);
	        } 
	    }
	    return target;
	},
	/**
	 * scroll Bottom of target just out of view
	 * 	NOTE: use this method to avoid triggering a collection.fetch() in onContainerScroll() 
 	 * @param {Object} target, jquery node
	 */
	scrollBottomAlmostIntoView: function(target) {
		var top, bottom, next, target, OFFSET_H = 40;
		if (!target.jquery) target = $(target);
		
		if (!target.length) return false;
		else {
	        // console.log(e.hash);
	        var targetT = target.offset().top,
	        	targetH = target.height(), 
	        	targetB = targetT+targetH,
	        	windowT = $(window).scrollTop(),
	        	windowH = $(window).height(),
	        	windowB = windowT + windowH;
	        var delta = Math.min(targetB - windowB, targetT-windowT)-OFFSET_H;
	        if (delta < 0 || delta > 50) {
	        	$('html, body').animate({scrollTop: windowT+delta}, 500);
	        } 
	    }
	    return target;
	},

};	
	
	
})( snappi.mixins);