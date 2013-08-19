$(function() {
	// same as json.response from $ajax({dataType: 'json'}).success.call(this, json, status, o);
	var json = {
		response: JSON.parse(SNAPPI.CFG.JSON.raw),
	}
	var cc = json.response['response'].castingCall;
	var thumbnails = SNAPPI.parseCC(cc);
	var check;
	
	
	
	/*
	 * test, render some thumbnails
	 */
	_shots = [];
	_.each(SNAPPI.Auditions, function(v,k,l){
		_shots.push(new snappi.Shot(v));	
	});
	
	// gallery = new snappi.GalleryCollection(shots);
	_gallery = new snappi.GalleryView();
	_gallery.collection.reset(_shots);
	
	
});


