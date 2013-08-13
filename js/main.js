$(function() {
	// same as json.response from $ajax({dataType: 'json'}).success.call(this, json, status, o);
	var json = {
		response: JSON.parse(SNAPPI.CFG.JSON.raw),
	}
	var cc = json.response['response'].castingCall;
	var thumbnails = SNAPPI.parseCC(cc);
	var check;
	
});


