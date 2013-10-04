// /js/mixins/snappi.js
(function ( mixins ) {
	
	/*
	 * private vars
	 */
	var _lastScrollTop = 0;
        
mixins.UiActions = {

	toggle: function() { /* ... */ },

	open: function() { /*... */ },

	close: function() { /* ... */ },
	
    detectScrollDirection : function () {
        var dir = (window.pageYOffset > _lastScrollTop) ? "down" : "up";
        if (window.pageYOffset == _lastScrollTop) return false;
        _lastScrollTop = window.pageYOffset;
        return dir;
    },
	
	scrollIntoView: function(target, complete) {
		var top, next, target, NAVBAR_OFFSET_H = 40;
		if (!target.jquery) target = $(target);
		
		if (!target.length) return false;
		else {
	        // console.log(e.hash);
	        var delta = target.offset().top-NAVBAR_OFFSET_H - $(window).scrollTop();
	        if (delta < 0 || delta > 50) {
	        	$('html').animate({scrollTop: target.offset().top-NAVBAR_OFFSET_H}, 
	        		300, 
	        		complete);
	        } 
	    }
	    return target;
	},
	/**
	 * scroll Bottom of target just out of view
	 * 	NOTE: use this method to avoid triggering a collection.fetch() in onContainerScroll() 
 	 * @param {Object} target, jquery node
	 */
	scrollBottomAlmostIntoView: function(target, complete) {
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
	        	console.info("target="+target.data('period'))
	        	console.info("animate scrollTop="+(windowT+delta)+", windowT="+windowT+", delta="+delta );
	        	$('html').animate({scrollTop: windowT+delta}, 
	        		300, 
	        		complete);
	        } 
	    }
	    return target;
	},

};	
	
	
})( snappi.mixins);