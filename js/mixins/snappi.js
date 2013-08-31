// /js/mixins/snappi.js
(function ( mixins ) {
	
	mixins.RestApi = {
		parseShotExtras : function(json, shot) {
			var shot = shot || json.response.Shot,
				shot_extras = json.response.castingCall.shot_extras[shot.id];
				shot_extras.count = parseInt(shot_extras.count);
				shot_extras.priority = parseInt(shot_extras.priority);
				shot_extras.active = !!shot_extras.active;
			return shot_extras;
		},
		parseShot: function(cc){
			
			var i, oSrc, score, id, audition, 
				parsedAuditions = {},
				page = cc.CastingCall.Auditions.Page,
				auditions = cc.CastingCall.Auditions.Audition;
				
			for (i in auditions) {
				id = auditions[i].Photo.id;
				audition = {
					shotId: auditions[i].Shot.id || null ,
					shotCount: auditions[i].Shot.count ? parseInt(auditions[i].Shot.count) : null,
					
					photoId: id,
					score: auditions[i].Photo.Fix.Score ? parseInt(auditions[i].Photo.Fix.Score) : null,
					rating: auditions[i].Photo.Fix.Rating ? parseInt(auditions[i].Photo.Fix.Rating) : null,
					caption: auditions[i].Photo.Caption,
					batchId: parseInt(auditions[i].Photo.BatchId),
					dateTaken: new Date(auditions[i].Photo.DateTaken.replace(' ', 'T')), 
					ts: auditions[i].Photo.TS,
					H: auditions[i].Photo.Img.Src.H,
					W: auditions[i].Photo.Img.Src.W,
					exifOrientation:  auditions[i].Photo.Img.Src.Orientation,	// ExifOrientation tag, [1,3,6,8]
					rootSrc: auditions[i].Photo.Img.Src.rootSrc,
					// for collections page management
					requestPage: page,
				};
				
				// adjust for ExifOrientation
				if (audition.exifOrientation < 4) {
					audition.origW = auditions[i].Photo.W;
					audition.origH = auditions[i].Photo.H;
					// fix bad origW/H data
					if (audition.H > audition.W && audition.origH < audition.origW)
					{
						audition.origW = auditions[i].Photo.H; 
						audition.origH = auditions[i].Photo.W;
						console.warn("origW/H flipped for id="+id);
					}
				} else { // ExifOrientation = 6|8 means the bp~ image is rotated
					audition.origH = auditions[i].Photo.W;
					audition.origW = auditions[i].Photo.H;
					audition.H = auditions[i].Photo.Img.Src.W;
					audition.W = auditions[i].Photo.Img.Src.H
				}
				
				audition.orientationLabel =  (audition.H > audition.W) ? 'portrait' : '';
				parsedAuditions[id] = audition;
			}
			// for debugging/introspection
			if (_DEBUG && SNAPPI) SNAPPI.Auditions = _.extend(SNAPPI.Auditions || {}, parsedAuditions); 
			return parsedAuditions;	
		},
	}
	/*
	 * helper functions for manipulating window.location.href
	 */
	mixins.Href = {
		parseQueryString : function(a) {
			a = a || (window.location.search.substr(1).split('&'));
		    if (a == "") return {};
		    var b = {};
		    for (var i = 0; i < a.length; ++i)
		    {
		        var p=a[i].split('=');
		        if (p.length != 2) continue;
		        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
		    }
		    return b;
		},
		/**
		 * 
		 * @param Object cfg 
		 * 		cfg.hostname, ex. snaphappi.com
		 * 		cfg.subdomains (array)
		 * 		cfg.baseurl
		 * 		cfg.template, underscore template
		 */
		imgServer: function(cfg){
			// get
			if (!cfg && mixins.Href._imgServer) return mixins.Href._imgServer;
			
			// set
			if (!mixins.Href._imgServer) {
				// init static
				var defaults = {
					hostname: 'snaphappi.com',
					subdomains: ['snappi','snappi1','snappi2'],
					baseurl: '/svc/STAGING/',
					template: 'http://{{subdomain}}.{{hostname}}{{baseurl}}{{stage}}/.thumbs/{{size}}~{{filename}}',
				};
				mixins.Href._imgServer = defaults;
			}
			var imgServerCfg = mixins.Href._imgServer = _.extend(mixins.Href._imgServer, cfg || {});
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
		 * 		see imgServerCfg.subdomains
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
				named = {},
				parts = url.split('/');
			for (var i in parts) {
				if (parts[i].indexOf(':')>0) {
					param = parts[i].split(':');
					named[param[0]] = decodeURIComponent(param[1].replace(/\+/g, " ")) ;
				} 
			}	
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
	}
	
	mixins.Handlebars = {
		
	}
	
	
})( snappi.mixins);