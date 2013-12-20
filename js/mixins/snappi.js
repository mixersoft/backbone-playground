// /js/mixins/snappi.js
(function ( mixins ) {
	"use strict";

	mixins.RestApi = {
		parseShotExtras_CC : function(json, shot) {
			shot = shot || json.response.Shot;
			var shot_extras = json.response.castingCall.shot_extras[shot.id];
			shot_extras.count = parseInt(shot_extras.count);
			shot_extras.priority = parseInt(shot_extras.priority);
			shot_extras.active = !!shot_extras.active;
			return shot_extras;
		},
		parseShot_CC: function(cc){
			var i, oSrc, score, id, audition, 
				parsedAuditions,
				page = parseInt(cc.CastingCall.Auditions.Page),
				auditions = cc.CastingCall.Auditions.Audition;
				
			parsedAuditions = _.reduce(auditions, function(hash, row, i, l){	
				id = row.Photo.id;
				audition = {
					shotId: row.Shot.id || null ,
					shotCount: row.Shot.count ? parseInt(row.Shot.count) : null,

					photoId: id,
					score: row.Photo.Fix.Score ? Math.round(parseFloat(row.Photo.Fix.Score)*10)/10 : null,
					rating: row.Photo.Fix.Rating ? parseInt(row.Photo.Fix.Rating) : null,
					rotate: row.Photo.Fix.Rotate ? parseInt(row.Photo.Fix.Rotate) : 1,
					caption: row.Photo.Caption,
					batchId: parseInt(row.Photo.BatchId),
					dateTaken: new Date(row.Photo.DateTaken.replace(' ', 'T')), 
					ts: row.Photo.TS,
					H: row.Photo.Img.Src.H,
					W: row.Photo.Img.Src.W,
					exifOrientation:  row.Photo.Img.Src.Orientation || 1,	// ExifOrientation tag, [1,3,6,8]
					rootSrc: row.Photo.Img.Src.rootSrc,
					// for collections page management
					requestPage: page,
				};
				
				// adjust for ExifOrientation
				if (audition.exifOrientation < 4) {
					audition.origW = row.Photo.W;
					audition.origH = row.Photo.H;
					// fix bad origW/H data
					if (audition.H > audition.W && audition.origH < audition.origW)
					{
						audition.origW = row.Photo.H; 
						audition.origH = row.Photo.W;
						console.warn("origW/H flipped for id="+id);
					}
				} else { // ExifOrientation = 6|8 means the bp~ image is rotated
					audition.origH = row.Photo.W;
					audition.origW = row.Photo.H;
					audition.H = row.Photo.Img.Src.W;
					audition.W = row.Photo.Img.Src.H;
				}
				
				audition.orientationLabel = (audition.H > audition.W) ? 'portrait' : '';
				hash[id] = audition;
				return hash;
			}, {});
			// for debugging/introspection
			if (_DEBUG && SNAPPI) SNAPPI.Auditions = _.extend(SNAPPI.Auditions || {}, parsedAuditions); 
			return parsedAuditions;	
		},
		// flat response, Assets model attrs only. from nodejs
		parseShotExtras_Assets : function(assets, bestshotId) {
			var bestshot = _.findWhere(assets, {id: bestshotId}),
				shot_extras = {
					id : bestshot.shot_id,
					owner_id : bestshot.shot_owner_id,
					priority : bestshot.shot_priority,	
					active : bestshot.shot_active,
					count : bestshot.shot_count,
				};
			return shot_extras;
		},
		parseShot_Assets: function(response){
			var i, row, photo, exif, preview, src,
				parsedPhotos,
				assets = response.assets;
			
			parsedPhotos = _.reduce(assets, function(hash, row, i, l){
				exif = JSON.parse(row.json_exif);
				preview = exif.root || exif.preview; // exif.preview is legacy
				src = JSON.parse(row.json_src);
				photo = {
					id: row.id,
					shotId: row.shot_id,
					shotCount: row.shot_count ? parseInt(row.shot_count) : null,
					photoId: row.id,
					score: row.score ? Math.round(parseFloat(row.score)*10)/10 : null,
					rating: row.rating ? parseInt(row.rating) : null,
					rotate: row.rotate ? parseInt(row.rotate) : 1,
					caption: row.caption,
					batchId: parseInt(row.batchId),
					dateTaken: new Date(row.dateTaken.replace(' ', 'T')), 
					TS_UTC: parseInt(row.TS_UTC),
					// ts: row.Photo.TS,
					H: preview.imageHeight,
					W: preview.imageWidth,
					exifOrientation:  exif.Orientation || 1,	// ExifOrientation tag, [1,3,6,8]
					rootSrc: src.root,
				};
				// extras
				// for collections page management
				if (response.request && response.request.page) 
					photo.requestPage = parseInt(response.request.page); 
				
				// adjust for ExifOrientation
				// TODO: add math to include photo.rotate
				if (photo.exifOrientation < 4) {
					photo.origW = exif.ExifImageWidth;
					photo.origH = exif.ExifImageLength;
					// fix bad origW/H data
					if (photo.H > photo.W && photo.origH < photo.origW)
					{
						photo.origW = exif.ExifImageLength; 
						photo.origH = exif.ExifImageWidth;
						console.warn("origW/H flipped for id="+photo.id);
					}
				} else { // ExifOrientation = 6|8 means the bp~ image is rotated
					photo.origH = exif.ExifImageWidth;
					photo.origW = exif.ExifImageLength;
					photo.H = exif.root.imageWidth;
					photo.W = exif.root.imageHeight;
				}
				
				photo.orientationLabel =  (photo.H > photo.W) ? 'portrait' : '';
				hash[photo.id] = photo;
				return hash;
			}, {});

			if (_DEBUG && SNAPPI) SNAPPI.Auditions = _.extend(SNAPPI.Auditions || {}, parsedPhotos); 
			return parsedPhotos;	
		},
	};
	/*
	 * helper functions for manipulating window.location.href
	 */
	var _hostname;
	mixins.Href = {
		hostname: function(host){
			if (!!host) _hostname = host;
			if (!_hostname) {
				var qs = snappi.qs || this.parseQueryString();
				_hostname = qs.host || 'dev.snaphappi.com';
			}
			return _hostname;
		},
		parseQueryString : function(a) {
			a = a || (window.location.search.substr(1).split('&'));
			if (a === "") return {};
			var b = {};
			for (var i = 0; i < a.length; ++i){
				var p=a[i].split('=');
				if (p.length != 2) continue;
				b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
			}
			return b;
		},
		/**
		 * 
		 * @param Object cfg 
		 *	cfg.hostname, ex. snaphappi.com
		 *	cfg.subdomains (array)
		 *	cfg.baseurl
		 *	cfg.template, underscore template
		 */
		imgServer: function(cfg){
			// get
			if (!cfg && mixins.Href._imgServer) return mixins.Href._imgServer;
			
			// set
			if (!mixins.Href._imgServer) {
				// init static
				var defaults = {
					hostname: 'snaphappi.com',
					subdomains: [''],
					baseurl: '/svc/STAGING/',
					template: 'http://{{subdomain}}{{hostname}}{{baseurl}}{{stage}}/.thumbs/{{size}}~{{filename}}',
				};
				mixins.Href._imgServer = defaults;
			}

			var imgServerCfg = _.extend(mixins.Href._imgServer, cfg || {});
			if (imgServerCfg.hostname=='snaphappi.com'){
				imgServerCfg.subdomains = ['snappi.','snappi1.','snappi2.']; 
			}

			if (typeof imgServerCfg.template == 'string') {
				var settings = { interpolate : /\{\{(.+?)\}\}/g, };
				imgServerCfg.template = _.template(imgServerCfg.template, null, settings);
			}
			return imgServerCfg;
		},
		getThumbsizePrefix: function(mixed){
			var THUMB_SIZE, 
				maxDim = 640;
			if (mixed.width || mixed.height){
				maxDim = Math.max(mixed.width, mixed.height);
			} else if (mixed.tagName == 'IMG') {
				mixed = $(mixed);
				maxDim = Math.max(mixed.width(), mixed.height());
			} else if (mixed.jquery && mixed.attr('tagName') == 'IMG') {
				maxDim = Math.max(mixed.width(), mixed.height());	
			} else if (mixed.W || mixed.H){
				maxDim = Math.max(mixed.W, mixed.H);
			}
			if (maxDim <= 120) THUMB_SIZE='tn';
			else if (maxDim <= 240) THUMB_SIZE='bs';
			else if (maxDim <= 320) THUMB_SIZE='bm';
			else THUMB_SIZE='bp';
			return THUMB_SIZE;
		},
		/**
		 * 
		 * @param {Object} data, {width:, height:}, IMG tag, or {w:, h:}
		 * @param String prefix thumbnail size prefix, [bp|bm|bs|tn|ll|lm|sq]
		 * @param Int i, index used to hash staging server subdomain
		 *	see imgServerCfg.subdomains
		 */
		getImgSrc: function(data, prefix, i ){
			var parts = data.rootSrc.split('/',2),
				imgServerCfg = mixins.Href.imgServer();
				i = i || 0;
			var o = {
				subdomain: imgServerCfg.subdomains[i % imgServerCfg.subdomains.length],
				hostname: imgServerCfg.hostname,
				baseurl: imgServerCfg.baseurl,
				stage: parts[0],
				size: prefix || 'tn',
				filename: parts[1],
			};  
			return imgServerCfg.template(o);
		},
		// extract cakephp named params into object hash, ex. /page:1/perpage:32
		getNamedParams : function(url){
			url = url || window.location.pathname;
			var param, 
				parts = url.split('/');
			var named = _.reduce(parts, function(out, e,i,l){
				if (e.indexOf(':')>0) {
					param = e.split(':');
					out[param[0]] = decodeURIComponent(param[1].replace(/\+/g, " ")) ;
				}
				return out;
			}, {});	
			return named;
		},
		
		// deprecate, use getImgSrc with template
		getImgSrcBySize : function(src, size){
			size = size || 'tn';
			var parts = SNAPPI._parseSrcString(src);
			if (size && !parts.dirname.match(/.thumbs\/$/)) 
				parts.dirname += '.thumbs/';
			return parts.dirname + (size ? size + '~' : '') + parts.filename + (parts.crop ? '~' + parts.crop : '');
		},
		// deprecate, use getImgSrc with template
		_parseSrcString : function(src){
			var i = src.lastIndexOf('/');
			var name = {
				dirname: '',
				size: '',
				filename: '',
				crop: ''
			};
			name.dirname = src.substring(0, i + 1);
			var parts = src.substring(i + 1).split('~');
			switch (parts.length) {
				case 3:
					name.size = parts[0];
					name.filename = parts[1];
					name.crop = parts[2];
					break;
				case 2:
					if (parts[0].length == 2) {
						name.size = parts[0];
						name.filename = parts[1];
					}
					else {
						name.filename = parts[0];
						name.crop = parts[1];
					}
					break;
				case 1:
					name.filename = parts[0];
					break;
				default:
					name.filename = src.substring(i + 1);
					break;
			}
			return name;
		},
	};
	
	mixins.Handlebars = {
		
	};
	
	
})( snappi.mixins);