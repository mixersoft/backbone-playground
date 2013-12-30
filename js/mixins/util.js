// js/mixins/util.js
/*
 * NOT really a mixin, just a general purpose util lib
 * - include script in index.html
 */

/*
 * debounce timer for each unique hashFn()
 * // add to underscore
 */
if (_.isUndefined(_.debounceByHasher)) {
	var _debounceByHasher = function(func, wait, immediate, hashFn) {
		// attr of func Object
		_debounceByHasher.memoize = _debounceByHasher.memoize || {};
		return function() {
			var context = this, args = arguments;
			var id = _.isFunction(hashFn) 
				? hashFn.apply(context, args) 
				: JSON.stringify(args);
			var later = function() {
				_debounceByHasher.memoize[id] = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !_debounceByHasher.memoize[id];
			clearTimeout(_debounceByHasher.memoize[id]);
			_debounceByHasher.memoize[id] = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		}
	}
	_.debounceByHasher = _debounceByHasher;
}

/*
 * throttle timer for each unique hashFn()
 * // add to underscore
 */
if (_.isUndefined(_.throttleByHasher)) {
	var _throttleByHasher = function(func, wait, immediate, hashFn) {
		// attr of func Object
		_throttleByHasher.memoize = _throttleByHasher.memoize || {};
		return function() {
			var context = this, args = arguments;
			var id = _.isFunction(hashFn) 
				? hashFn.apply(context, args) 
				: JSON.stringify(args);
			var later = function() {
				_throttleByHasher.memoize[id] = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !_throttleByHasher.memoize[id];
			clearTimeout(_throttleByHasher.memoize[id]);
			_throttleByHasher.memoize[id] = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		}
	}
	_.throttleByHasher = _throttleByHasher;
}