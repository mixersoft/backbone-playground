// Flickr place_ids
(function ( mixins ) {
	"use strict";

var api = {
	key : 'd238b34ddf382dfcee11bf0ced5e9f18',
};

var lookups = {
	zoom : ['world','country', 'region', 'locality', 'neighbourhood'],
	place_type_id : {
		neighbourhood: 22,
		'22': 'neighbourhood',
		locality: 7,
		'7': 'locality',
		region: 8,
		'8': 'region',
		country: 12,
		'12': 'country',
		continent: 29,
		'29': "continent",
		world: 0,
		'0': 'world',

	},
};

var CACHED = '{"ready":true,"world":{"zoom_level":0,"place_type_id":0,"places":[{"longitude":0,"name":"world","place_id":"null","place_type":"world","place_type_id":0,"locality_place_id":"null","locality_longitude":0}]},"country":{"zoom_level":1,"place_type_id":12,"places":[{"longitude":-95.845,"name":"United States","place_id":"nz.gsghTUb4c2WAecA","place_type":"country","place_type_id":12,"locality_place_id":"7.MJR8tTVrIO1EgB","locality_longitude":-122.42},{"longitude":-95.845,"name":"United States","place_id":"nz.gsghTUb4c2WAecA","place_type":"country","place_type_id":12,"locality_place_id":"7Z5HMmpTVr4VzDpD","locality_longitude":-118.245},{"longitude":-95.845,"name":"United States","place_id":"nz.gsghTUb4c2WAecA","place_type":"country","place_type_id":12,"locality_place_id":"uiZgkRVTVrMaF2cP","locality_longitude":-122.329},{"longitude":-95.845,"name":"United States","place_id":"nz.gsghTUb4c2WAecA","place_type":"country","place_type_id":12,"locality_place_id":"lMxJy4dTVrIP_zem","locality_longitude":-90.199},{"longitude":-95.845,"name":"United States","place_id":"nz.gsghTUb4c2WAecA","place_type":"country","place_type_id":12,"locality_place_id":".skCPTpTVr.Q3WKW","locality_longitude":-74.007},{"longitude":-95.845,"name":"United States","place_id":"nz.gsghTUb4c2WAecA","place_type":"country","place_type_id":12,"locality_place_id":"aKGrC25TV7vTJcir","locality_longitude":-77.028},{"longitude":-54.387,"name":"Brazil","place_id":"xQfoS31TUb6eduaTWQ","place_type":"country","place_type_id":12,"locality_place_id":"mAqmHW5VV78OT5o","locality_longitude":-43.195},{"longitude":-2.23,"name":"United Kingdom","place_id":"cnffEpdTUb5v258BBA","place_type":"country","place_type_id":12,"locality_place_id":"hP_s5s9VVr5Qcg","locality_longitude":-0.127},{"longitude":1.718,"name":"France","place_id":"lbWye9tTUb6GOcp80w","place_type":"country","place_type_id":12,"locality_place_id":"EsIQUYZXU79_kEA","locality_longitude":2.341},{"longitude":12.573,"name":"Italy","place_id":"5QqgvRVTUb7tSzaDpQ","place_type":"country","place_type_id":12,"locality_place_id":"uijRnjBWULsQTwc","locality_longitude":12.495},{"longitude":12.573,"name":"Italy","place_id":"5QqgvRVTUb7tSzaDpQ","place_type":"country","place_type_id":12,"locality_place_id":"ZPDshblWU7_DgSs","locality_longitude":11.254},{"longitude":21.845,"name":"Greece","place_id":"s1JMkOJTUb5LfB9USg","place_type":"country","place_type_id":12,"locality_place_id":"iyi6cGxYVrxd.XE","locality_longitude":23.736},{"longitude":30.246,"name":"Egypt","place_id":"QXJrdeNTUb6MYrcvXQ","place_type":"country","place_type_id":12,"locality_place_id":"ZxhLUyJQV7hkYwbK","locality_longitude":31.194},{"longitude":34.885,"name":"Tanzania","place_id":"YhQ3yHpTUb4clWyAtQ","place_type":"country","place_type_id":12,"locality_place_id":"0r2bQrZTUb7SUIZ0","locality_longitude":33.981},{"longitude":35.431,"name":"Turkey","place_id":"aaobVhlTUb58c3KqSA","place_type":"country","place_type_id":12,"locality_place_id":"l02DEdJTUb5XGlLZ","locality_longitude":28.986},{"longitude":104.165,"name":"China","place_id":"MH3w3ENTUb45a2.GqA","place_type":"country","place_type_id":12,"locality_place_id":"vQ6vOjpTU7_QE6S8","locality_longitude":116.387},{"longitude":108.831,"name":"Russia","place_id":"gMMKN7VTUb7Dg.7SoQ","place_type":"country","place_type_id":12,"locality_place_id":"Gyn7fcFTU7gkY7d5","locality_longitude":37.615},{"longitude":113.917,"name":"Indonesia","place_id":"QZY1SiRTUb674.n_LA","place_type":"country","place_type_id":12,"locality_place_id":"lm4_wrhTUb4oe5pO","locality_longitude":115.072},{"longitude":133.393,"name":"Australia","place_id":"3fHNxEZTUb4mc08chA","place_type":"country","place_type_id":12,"locality_place_id":"2AEwArxQU7pLPY08","locality_longitude":151.206}]},"region":{"zoom_level":2,"place_type_id":8,"places":[{"longitude":-120.832,"name":"Washington, United States","place_id":"jyADg3RTUb65Hnbj","place_type":"region","place_type_id":8,"locality_place_id":"uiZgkRVTVrMaF2cP","locality_longitude":-122.329},{"longitude":-119.27,"name":"California, United States","place_id":"NsbUWfBTUb4mbyVu","place_type":"region","place_type_id":8,"locality_place_id":"7.MJR8tTVrIO1EgB","locality_longitude":-122.42},{"longitude":-119.27,"name":"California, United States","place_id":"NsbUWfBTUb4mbyVu","place_type":"region","place_type_id":8,"locality_place_id":"7Z5HMmpTVr4VzDpD","locality_longitude":-118.245},{"longitude":-92.436,"name":"Missouri, United States","place_id":"rLGx4JpTUb6lauZn","place_type":"region","place_type_id":8,"locality_place_id":"lMxJy4dTVrIP_zem","locality_longitude":-90.199},{"longitude":-77.014,"name":"District of Columbia, United States","place_id":".9.rXhhTUb5eYUuK","place_type":"region","place_type_id":8,"locality_place_id":"aKGrC25TV7vTJcir","locality_longitude":-77.028},{"longitude":-76.501,"name":"New York, United States","place_id":"ODHTuIhTUb75gdBu","place_type":"region","place_type_id":8,"locality_place_id":".skCPTpTVr.Q3WKW","locality_longitude":-74.007},{"longitude":-42.921,"name":"Rio de Janeiro, Brazil","place_id":"fCgNtJ9TUb7DgEOD","place_type":"region","place_type_id":8,"locality_place_id":"mAqmHW5VV78OT5o","locality_longitude":-43.195},{"longitude":-1.974,"name":"England, United Kingdom","place_id":"2eIY2QFTVr_DwWZNLg","place_type":"region","place_type_id":8,"locality_place_id":"hP_s5s9VVr5Qcg","locality_longitude":-0.127},{"longitude":2.502,"name":"Ile-de-France, France","place_id":"QLdv_.RWU7_jEfrE","place_type":"region","place_type_id":8,"locality_place_id":"EsIQUYZXU79_kEA","locality_longitude":2.341},{"longitude":11.029,"name":"Tuscany, Italy","place_id":"yU7tk6NWU795lMYh","place_type":"region","place_type_id":8,"locality_place_id":"ZPDshblWU7_DgSs","locality_longitude":11.254},{"longitude":12.738,"name":"Lazio, Italy","place_id":"Txy_tk1WU79uo4MR","place_type":"region","place_type_id":8,"locality_place_id":"uijRnjBWULsQTwc","locality_longitude":12.495},{"longitude":23.596,"name":"Attiki, Greece","place_id":"k7Im6tpQUL9bun6_ig","place_type":"region","place_type_id":8,"locality_place_id":"iyi6cGxYVrxd.XE","locality_longitude":23.736},{"longitude":28.964,"name":"Istanbul, Turkey","place_id":"SlXpmNdTUb7UklFi","place_type":"region","place_type_id":8,"locality_place_id":"l02DEdJTUb5XGlLZ","locality_longitude":28.986},{"longitude":31.14,"name":"Al Jizah, Egypt","place_id":"VX9BKV5TUb5N7WsS","place_type":"region","place_type_id":8,"locality_place_id":"ZxhLUyJQV7hkYwbK","locality_longitude":31.194},{"longitude":33.981,"name":"Mara, Tanzania","place_id":"0r2bQrZTUb7SUIZ0","place_type":"region","place_type_id":8,"locality_place_id":"0r2bQrZTUb7SUIZ0","locality_longitude":33.981},{"longitude":37.621,"name":"Moskva, Russia","place_id":"yFvJfEtTUb5x9_pp","place_type":"region","place_type_id":8,"locality_place_id":"Gyn7fcFTU7gkY7d5","locality_longitude":37.615},{"longitude":115.072,"name":"Bali, Indonesia","place_id":"lm4_wrhTUb4oe5pO","place_type":"region","place_type_id":8,"locality_place_id":"lm4_wrhTUb4oe5pO","locality_longitude":115.072},{"longitude":116.422,"name":"Beijing, China","place_id":"efYrQKFQUL84fwdWXg","place_type":"region","place_type_id":8,"locality_place_id":"vQ6vOjpTU7_QE6S8","locality_longitude":116.387},{"longitude":147.319,"name":"New South Wales, Australia","place_id":"2X2nIstTUb5_0uWe","place_type":"region","place_type_id":8,"locality_place_id":"2AEwArxQU7pLPY08","locality_longitude":151.206}]},"locality":{"zoom_level":3,"place_type_id":7,"places":[{"longitude":-122.42,"name":"San Francisco, California, United States","place_id":"7.MJR8tTVrIO1EgB","place_type":"locality","place_type_id":7,"locality_place_id":"7.MJR8tTVrIO1EgB","locality_longitude":-122.42},{"longitude":-122.329,"name":"Seattle, Washington, United States","place_id":"uiZgkRVTVrMaF2cP","place_type":"locality","place_type_id":7,"locality_place_id":"uiZgkRVTVrMaF2cP","locality_longitude":-122.329},{"longitude":-118.245,"name":"Los Angeles, California, United States","place_id":"7Z5HMmpTVr4VzDpD","place_type":"locality","place_type_id":7,"locality_place_id":"7Z5HMmpTVr4VzDpD","locality_longitude":-118.245},{"longitude":-90.199,"name":"St. Louis, Missouri, United States","place_id":"lMxJy4dTVrIP_zem","place_type":"locality","place_type_id":7,"locality_place_id":"lMxJy4dTVrIP_zem","locality_longitude":-90.199},{"longitude":-77.028,"name":"Washington, District of Columbia, United States","place_id":"aKGrC25TV7vTJcir","place_type":"locality","place_type_id":7,"locality_place_id":"aKGrC25TV7vTJcir","locality_longitude":-77.028},{"longitude":-74.007,"name":"New York, NY, United States","place_id":".skCPTpTVr.Q3WKW","place_type":"locality","place_type_id":7,"locality_place_id":".skCPTpTVr.Q3WKW","locality_longitude":-74.007},{"longitude":-43.195,"name":"Rio de Janeiro, RJ, Brazil","place_id":"mAqmHW5VV78OT5o","place_type":"locality","place_type_id":7,"locality_place_id":"mAqmHW5VV78OT5o","locality_longitude":-43.195},{"longitude":-0.127,"name":"London, England, United Kingdom","place_id":"hP_s5s9VVr5Qcg","place_type":"locality","place_type_id":7,"locality_place_id":"hP_s5s9VVr5Qcg","locality_longitude":-0.127},{"longitude":2.341,"name":"Paris, Ile-de-France, France","place_id":"EsIQUYZXU79_kEA","place_type":"locality","place_type_id":7,"locality_place_id":"EsIQUYZXU79_kEA","locality_longitude":2.341},{"longitude":11.254,"name":"Florence, Tuscany, Italy","place_id":"ZPDshblWU7_DgSs","place_type":"locality","place_type_id":7,"locality_place_id":"ZPDshblWU7_DgSs","locality_longitude":11.254},{"longitude":12.495,"name":"Rome, Lazio, Italy","place_id":"uijRnjBWULsQTwc","place_type":"locality","place_type_id":7,"locality_place_id":"uijRnjBWULsQTwc","locality_longitude":12.495},{"longitude":23.736,"name":"Athens, Attiki, Greece","place_id":"iyi6cGxYVrxd.XE","place_type":"locality","place_type_id":7,"locality_place_id":"iyi6cGxYVrxd.XE","locality_longitude":23.736},{"longitude":28.986,"name":"Istanbul, Istanbul, Turkey","place_id":"l02DEdJTUb5XGlLZ","place_type":"locality","place_type_id":7,"locality_place_id":"l02DEdJTUb5XGlLZ","locality_longitude":28.986},{"longitude":31.194,"name":"Giza, Al Jizah, Egypt","place_id":"ZxhLUyJQV7hkYwbK","place_type":"locality","place_type_id":7,"locality_place_id":"ZxhLUyJQV7hkYwbK","locality_longitude":31.194},{"longitude":37.615,"name":"Moscow, Moskva, Russia","place_id":"Gyn7fcFTU7gkY7d5","place_type":"locality","place_type_id":7,"locality_place_id":"Gyn7fcFTU7gkY7d5","locality_longitude":37.615},{"longitude":116.387,"name":"Beijing, Beijing, China","place_id":"vQ6vOjpTU7_QE6S8","place_type":"locality","place_type_id":7,"locality_place_id":"vQ6vOjpTU7_QE6S8","locality_longitude":116.387},{"longitude":151.206,"name":"Sydney, New South Wales, Australia","place_id":"2AEwArxQU7pLPY08","place_type":"locality","place_type_id":7,"locality_place_id":"2AEwArxQU7pLPY08","locality_longitude":151.206}]},"neighbourhood":{"zoom_level":4,"place_type_id":22,"places":[]}}';


// find: places.find() query=paris
// http://api.flickr.com/services/rest/?method=flickr.places.find&api_key=2b03e0fdf5c56007904af4f83e00537f&query=paris&format=json

// findByUrl, A flickr.com/places URL in the form of /country/region/city
// http://api.flickr.com/services/rest/?method=flickr.places.getInfoByUrl&api_key=2b03e0fdf5c56007904af4f83e00537f&url=%2FFrance%2FParis&format=json

// zoom IN: places.getChildrenWithPhotosPublic(), lbWye9tTUb6GOcp80w, country=france
// http://api.flickr.com/services/rest/?method=flickr.places.getChildrenWithPhotosPublic&api_key=2b03e0fdf5c56007904af4f83e00537f&place_id=lbWye9tTUb6GOcp80w&format=json

// zoom OUT, places.getInfo() EsIQUYZXU79_kEA, locality=paris
// http://api.flickr.com/services/rest/?method=flickr.places.getInfo&api_key=2b03e0fdf5c56007904af4f83e00537f&place_id=EsIQUYZXU79_kEA&format=json

// photos
// http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=2b03e0fdf5c56007904af4f83e00537f&tags=landmarks&place_id=EsIQUYZXU79_kEA&per_page=20&format=rest


var FlickrApi = {
	config: {
		baseurl: 'http://api.flickr.com/services/rest/',
		qs: {
			api_key: api.key,
			format: 'json',
		},
	},
	querystring : {
		find: {
			method:'flickr.places.find',
			query: '',
		},
		findByUrl: {
			method:'flickr.places.getInfoByUrl',
			url: '',
		},
		zoomIn: {
			method:'flickr.places.getChildrenWithPhotosPublic',
			place_id: '',
		},
		zoomOut: {
			method: 'flickr.places.getInfo',
			place_id: '',
		},
		photos: {
			method: 'flickr.photos.search',
			tags: '',
			place_id: '',
			min_taken_date: '',
			max_taken_date: '',
			sort: 'interestingness-desc', // 'date-taken-desc', 'interestingness-desc', 'relevance'
			license: '2,4,5',
			// max_taken_date: '2012-12-31 00:00:00',
			content_type: '1',
			media: 'photos',
			extras: 'date_taken,url_m,views,geo',
			per_page: 50,
		}
	},
	getApiRequest: function(method, options){
		options = _.clone(options || {});
		var qs = _.defaults( options, FlickrApi.querystring[method],  FlickrApi.config.qs);

		_.each(qs, function(v,k,l){
			if ( !v ) delete qs[k];
		});



		var xhrOptions = _.pick(options, ['dataType', 'cache']),
			xhrDefaults = {
				// data: req.data,
				dataType: 'json',
				cache: false,
			};
		xhrOptions = _.defaults(xhrOptions, xhrDefaults);	

		// patch key mismatches
		if (qs['place_id']) delete qs['longitude']; 
		if (qs['longitude']) {
			qs['lon'] = qs['longitude'];
			delete qs['longitude'];
		}
		if (xhrOptions.dataType == 'json')  
			qs['nojsoncallback'] = 1;
		else if (xhrOptions.dataType == 'jsonp') 
			xhrOptions['jsonpCallback'] = 'jsonFlickrApi';	
		
		return {
			url: FlickrApi.config.baseurl,
			data: _.omit(qs, ['dataType', 'cache']),
			xhrOptions: xhrOptions,
		};
	},
	// for use with Backbone.sync
	getUrl: function(method, options){
		var req = FlickrApi.getApiRequest(method, options);
		req['parse'] = FlickrApiParse[method];
		if (snappi.qs['oversample']) req.data.per_page *= snappi.qs['oversample'];			// get more and filter by views
		return req;
	},
	get: function(method, options, success){
		var req = FlickrApi.getApiRequest(method, options);
		var xhrOptions = req.xhrOptions; 
		xhrOptions.data = req.data;
		$.ajax(req.url, xhrOptions)
			.success(function(){
				var check;
			})
			.error(function(){
				var check;
			})
			.done(function(json){
				if (json.stat != 'ok'){
					console.error("Error: flickr api returned with stat=failed");
					console.error(req);
					return;
				}
				if (_.isFunction(FlickrApiParse[method])) {
					var parsed_json = FlickrApiParse[method](json);	
					if (_.isFunction(success)) success(parsed_json);
				} else 
					if (_.isFunction(success)) success(json);
			});
	},
};

var FlickrApiParse = {
	findByUrl : function(json) {
		var parsed = {};
		if (json.stat != 'ok') { 
			console.error("Error: json response error for flickr.places.getInfoByUrl");
			return json;
		}
		var place = json.place;
		var row = {
			longitude: parseFloat(place.longitude),
			name: place.name,
			place_id: place.place_id,
			place_type: place.place_type,
			place_type_id: place.place_type_id,
			locality_place_id: place.place_id,
		};
		parsed[row.place_type] = row;
		// placedb[ row['place_type'] ].places.push(row);

		_.each(lookups.zoom, function(place_type, i, l) {
			var zoomOut = place[place_type];
			if (zoomOut) {
				var parent_row = {
					longitude: parseFloat(zoomOut.longitude),
					name: zoomOut._content,
					place_id: zoomOut.place_id,
					place_type: place_type,
					place_type_id: lookups.place_type_id[place_type],
					locality_place_id: row.place_id,
					locality_longitude: row.longitude,
				};
				parsed[parent_row.place_type] = parent_row;
				// placedb[ parent_row['place_type'] ].places.push(parent_row);
			}
		});

		return parsed;
	},
	photos :  function(json, extras){
		var parsed = [];
		if (json.stat != 'ok') 
			console.error("Error: json response error for flickr.photos.search");
		_.each(json.photos.photo, function(e,i,l){
			try {
				var row = {
					id: e.id,
					owner: e.owner,
					dateTaken : e.datetaken,
					W: parseInt(e.width_m),
					H: parseInt(e.height_m),
					place_id: e.place_id,
					longitude: parseFloat(e.longitude),
					latitude: parseFloat(e.latitude),
					views: parseInt(e.views),
					title: e.title,
					url: e.url_m.replace('.jpg', '_m.jpg'),
					flickr_url: 'http://www.flickr.com/photos/' + e.owner + '/' + e.id, 
					accuracy: e.accuracy,
				};
				if (extras) _.defaults(row, extras);
				parsed.push(row);
			} catch(ex){
				console.warn("FlickrApi.photos() parse error");
			}
		});
		// TODO: losing photos.page,pages,perpage,total
		return parsed;
	},	
};


var placeUrls = [
	'/united states/california/san francisco',
	'/united states/california/los angeles',
	'/united states/washington/seattle',
	'/united states/missouri/st louis',
	'/united states/new york/new york',
	'/united states/district of columbia/washington',
	'/brazil/rio de janeiro/rio de janeiro',
	'/United Kingdom/England/London',
	'/France/Ile-de-France/Paris',
	'/Italy/Lazio/Roma',
	'/Italy/Tuscany/Firenze',
	'/Greece/Attiki/Athens',
	'/Turkey/Istanbul/İstanbul',
	'/Tanzania/Mara',
	'/Egypt/Al Jizah/Giza',
	'/Russia/Moskva/Moscow',
	'/Republik Indonesia/Bali',
	'/China/Beijing/北京',
	'/Australia/New South Wales/Sydney',
];


var place_db = {
	ready: false,
	cached: CACHED,
	world: {
		zoom_level: 0,
		place_type_id: 0,
		places:[],
	},
	country: {
		zoom_level: 1,
		place_type_id: 12,
		places: [
			// {
			//		longitude: float,
			//		name: string,
			//		place_id: place_id,
			//		place_type: [country | region | locality | neighborhood ]
			//		place_type_id: [ 12 | 8 | 7 | 22],
			//		locality_place_id: place_id,
			// }
		],
	},
	region:{
		zoom_level: 2,
		place_type_id: 8,
		places: [],
	},
	locality:{
		zoom_level: 3,
		place_type_id: 7,
		places: [],
	},
	neighbourhood:{
		zoom_level: 4,
		place_type_id: 22,
		places: [],
	},
};

var getPlace = function (placeUrl, success){
	var method = 'findByUrl',
		options = {url: placeUrl};
	FlickrApi.get(method, options, success);
};

var exports = {
	lookups: lookups,
	initialize: function(force, cb){
		if (place_db.cached && !force) {
			console.log("place_db json string="+place_db.cached.substr(0,40));
			place_db = JSON.parse(place_db.cached);
			place_db.ready = true;
			if (_.isFunction(cb)) cb(place_db);
			return;
		}
		exports.loadPlaceDb(placeUrls, place_db, function(place_db){
			place_db.cached = JSON.stringify(place_db);
			$('#json').html(place_db.cached);
			cb(place_db);
		});
	},
	// placeUrls: placeUrls,	
	loadPlaceDb: function (placeUrls, place_db, complete){
		var done = placeUrls.length-1,
			API_DELAY = 250,
			serialized = [],
			nextFetch;
/**
* use asynch.js here
*/
		_.each(placeUrls, function(place,i,l){
			serialized.push(function(){
				getPlace(place, function(parsed_json){
					_.each(parsed_json, function(v,k,l){
						place_db[k].places.push(v);
					});
					nextFetch = serialized.shift();
					if (nextFetch) {
						_.delay(nextFetch, API_DELAY);
					} else {
						console.info("place_db loaded");
						// sort
						_.each(place_db, function(v,k,l){
							place_db[k].places = _.sortBy(v.places,function(p){
								return parseFloat(p.longitude+180);
							});
						});
						console.info("place_db sorted by longitude");
						delete place_db.cached;
						place_db.ready = true;
						if (_.isFunction(complete)) complete(place_db);
					}
				});
			});
		});
		
		nextFetch = serialized.shift();
		if (nextFetch) {
			nextFetch();
		} else {
			console.info("place_db, nothing to load");
			if (_.isFunction(complete)) complete(place_db);
		}
	},
	getPlaces: function(zoom, options, cb) {
		zoom = zoom || lookups.zoom[0];
		options = options || {};
		var zoom_level = lookups.zoom.indexOf(zoom),
			place_type_id = lookups.place_type_id[zoom],
			places;
			
		var cbcb = function(places){
			places.place_type = zoom;
			switch (zoom) {
			case 'country': // country
					// additional processing
				break;
			}
			cb(places);	
		};	
		if (place_db.ready)	cbcb(place_db[zoom]);
		else {
			// _.defer(function(){
				exports.initialize(false, function(place_db){
					cbcb(place_db[zoom]);
				});
			// });
		}
	},
	// called by GalleryCollection.sync via this.Backend['Flickr']
	getPhotos: function(place_id, options, cb){
		var method = 'photos',
			xhrOptions = {
				tags: 'landmarks',
				per_page: '10',
			},
			success = function(photos){
				// _.each(photos, function(e,i,l){
					// render photo in GalleryCollection
				// });
				if (_.isFunction(cb)) cb(photos);
			};
		xhrOptions = _.defaults({place_id: place_id}, options, xhrOptions);
		var omitKeys = ['localities', 'backend', 'perpage', 'filters', 'direction', 'sort'];
		xhrOptions = _.omit(xhrOptions, omitKeys);	
		FlickrApi.get(method,xhrOptions,success);
	},
	getUrl: function(method, options) {
		method = method || 'photos';
		var allowed = _.keys(FlickrApi.querystring);
		if (allowed.indexOf(method)==-1) return false;
		else return FlickrApi.getUrl(method,options);
	},
	/*
	 * get timeline, currently unused
	 */
	XXXgetPlaceLine: function (zoom, options, place_db){
		zoom = zoom || lookups.zoom[0];
		options = options || {};
		var zoom_level = lookups.zoom.indexOf(zoom),
		place_type_id = lookups.place_type_id[zoom],
		places = place_db[zoom];

		switch (zoom_level) {
			case 0: // country
			_.each(places.places, function(place,i,l){
				var method = 'photos',
				options = {
					place_id: place.place_id, 
							// place_id: place.locality_place_id, 
							tags: 'landmarks',
							per_page: '10',
						},
						success = function(json){
							var photos = json.photos;
							_.each(photos.photo, function(e,i,l){
								// render photo in GalleryCollection
							});
						};
						FlickrApi.get(method,options,success);
					});
			break;
		}
	},
};

mixins.FlickrPlaces = {
	'FlickrApi': exports,
};
var check;
})( snappi.mixins);