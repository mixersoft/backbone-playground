// /js/mixins/snappi.js
(function ( mixins ) {
	"use strict";	
	
	/*
	 * private vars
	 */
	var _lastScrollTop = 0;
        
mixins.UiActions = {
	log: function(msg){
		if (window._DEBUG) console.log(msg);
	}, 
	
	TIMINGS: {
		xhr_ui_debounce: 300,			// ui debounce after XHR success 
		thumb_fade_transition: 300,		// same as CSS transition: all 300ms linear 100ms;
	},

	toggle: function() { /* ... */ },

	open: function() { /*... */ },

	close: function() { /* ... */ },
	
    detectScrollDirection : function () {
        var dir = (window.pageYOffset > _lastScrollTop) ? "down" : "up";
// console.log("scroll?? dir="+dir+", window.pageYOffset="+ window.pageYOffset +", _lastScrollTop="+ _lastScrollTop);        
        if (window.pageYOffset == _lastScrollTop) return false;
        _lastScrollTop = window.pageYOffset;
        return dir;
    },
	
	scrollIntoView: function(target, complete) {
		var top, next, NAVBAR_OFFSET_H = 40;
		if (!target.jquery) target = $(target);
		
		if (!target.length) return false;
		else {
			// console.log(e.hash);
			var delta = target.offset().top-NAVBAR_OFFSET_H - $(window).scrollTop();
			if (delta < 0 || delta > 50) {
				$('html,body').animate({scrollTop: target.offset().top-NAVBAR_OFFSET_H}, 
					300, 
					function(){
						_lastScrollTop = window.pageYOffset;
						if (_.isFunction(complete)) complete.apply(this, arguments);
					});
			} 
		}
		return target;
	},
	/**
	 * scroll Bottom of target just out of view
	 * NOTE: use this method to avoid triggering a collection.fetch() in onContainerScroll() 
	 * @param {Object} target, jquery node
	 */
	scrollBottomAlmostIntoView: function(target, complete) {
		var top, bottom, next, OFFSET_H = 40;
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
				console.info("target="+target.data('period'));
				console.info("animate scrollTop="+(windowT+delta)+", windowT="+windowT+", delta="+delta );
				$('html,body').animate({scrollTop: windowT+delta}, 
					300, 
					function(){
						_lastScrollTop = window.pageYOffset;
						if (_.isFunction(complete)) complete.apply(this, arguments);
					});
			} 
		}
		return target;
	},

	/**
	*	XHR/async UX methods
	*/
	

};	
	
	
})( snappi.mixins);