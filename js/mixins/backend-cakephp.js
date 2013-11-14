(function ( mixins, models ) {
	"use strict";

/*
 * Backend - wrapper for different dev backends
 *	'cakephp': original cakephp backend. DEFAULT
 *		- a lot of bloat, but AAA properly implemented
 *		- ex:  http://snappi-dev/person/photos/51cad9fb-d130-4150-b859-1bd00afc6d44/page:2/perpage:32/sort:score/direction:desc/.json?debug=0
 *	'nodejs': nodejs, minimal REST API implemented in node.js, 
 *		- use hostname=nodejs host, ?backend=node 
 *		- GET eliminates a lot of bloat
 *		- PUT/PATCH partially implemented using CakePHP backend
 *		- WARNING: still USES BACKDOOR AUTHENTICATION, not appropriate for PRODUCTION release
 *		- ex: http://localhost:3000/asset.json?userid=5013ddf3-069c-41f0-b71e-20160afc480d&type=Workorder:11&perpage=1000
 *	'bootstrap': uses JS file with static JSON
 *		- use ?bootstrap=[2011|mb|venice]
 *		- see /js/snappi-bootstrap.js    
 */
var Cakephp = {
	dataType: 'jsonp',
	templates: {	// used by Backend['cakephp'] only
		url_photo_guest: _.template('http://<%=hostname%>/person/photos/<%=ownerid%><%=optional_rating%>/perpage:<%=perpage%>/page:<%=page%>/sort:<%=sort%>/direction:<%=direction%>/min:typeset/.json'),
		url_photo_odesk: _.template('http://<%=hostname%>/person/odesk_photos/<%=ownerid%><%=optional_rating%>/perpage:<%=perpage%>/page:<%=page%>/sort:<%=sort%>/direction:<%=direction%>/min:typeset/.json'),
		url_photo_owner: _.template('http://<%=hostname%>/my/photos<%=optional_hidden%><%=optional_rating%>/perpage:<%=perpage%>/page:<%=page%>/sort:<%=sort%>/direction:<%=direction%>/min:typeset/.json'),
		url_photo_workorder: _.template('http://<%=hostname%>/<%=controller%>/photos/<%=id%><%=rating%>/perpage:<%=perpage%>/page:<%=page%>/sort:<%=sort%>/direction:<%=direction%>/min:typeset/.json'),
		url_shot: _.template('http://<%=hostname%>/photos/hiddenShots/<%=shotId%>/Usershot//min:typeset/.json'),
	},
	url:  function(){
		var collection = this, 
			qs = collection.parseQueryString();		
		var templateId, type, 
			request = {
				hostname: collection.hostname(),
				sort: qs.sort || 'score',
				direction: qs.direction || qs.dir || 'ASC',
				ownerid : qs.owner || "51cad9fb-d130-4150-b859-1bd00afc6d44",
				page: collection.currentPage,
				perpage: collection.perPage, 
				optional_rating: _.isString(qs.rating) ? '/rating:'+qs.rating : '',
				optional_hidden: _.isString(qs.hidden) ? '/hidden:'+qs.hidden : '',
			};
			if (/dateTaken|rating|score/.test(request.sort)) request.direction = 'ASC';
			
		// adjust for request by workorder, 
		type = !!qs.type && ['owner', 'odesk', 'tw','TasksWorkorder','wo','Workorder'].indexOf(qs.type.split(':')[0]);
			
		switch (type){
			case false:
			case -1: // guest access, default, show public photos for userid
				templateId = 'guest';		// ?owner=[uuid] || "51cad9fb-d130-4150-b859-1bd00afc6d44"
				if (qs.owner && /^[a-z]+$/i.test(qs.owner)) {
					templateId = 'odesk';   // same as ?type=odesk&owner=paris
				}
				break;
			case 0: // guest access, show public photos for userid
				templateId = 'owner'; 
				delete request.ownerid;		// ?type=owner, fetch /my/photos, ignore &owner=[] param
				break;
			case 1:
				templateId = 'odesk';		// ?type=odesk&owner=paris or ?type=demo&owner=paris  
				break; 
			default: // workorder access, 
				request.id = qs.type.split(':')[1];
				request.controller = type>3 ? 'workorders' : 'tasks_workorders';
				templateId = 'workorder';		// ?type=wo:17 or ?type=workorder:17
				break;
		}
		return function(){ // return as function to modify queryOptions using this  
			var queryOptions = this, 
				url;
			switch (queryOptions.type){
				case 'GET':
					url = Cakephp.templates['url_photo_'+templateId](request);
					queryOptions.timeout = 20000;
					queryOptions.error = function(xhr, status, msg){
						console.error(status+': '+msg);
					}
					break;
				case 'PUT':	
					// use model.save() instead
				default:
			}
			return url;
		};
	},
	parse: function(response) {
if (_DEBUG) console.timeEnd("GalleryCollection.fetch()");		

		var paging = response.response.castingCall.CastingCall.Auditions,
			serverPaging = {
				page: paging.Page,
				perpage: paging.Perpage,
				pages: paging.Pages,
				total: paging.Total,
				count: paging.Audition.length,
				targetHeight: 160,
			};
			
		// config image server for this request
		snappi.mixins.Href.imgServer({
			baseurl: paging.Baseurl,
		});
			
		// for clientPaging	
		this.paginator_ui.totalPages = Math.ceil(serverPaging.total / this.paginator_ui.perPage); 
		this.paginator_ui.serverPaging = serverPaging;
		
		
		// for requestPaging template
		if (!this.fetchedServerPages) this.fetchedServerPages = {}; 
		this.fetchedServerPages[serverPaging.page]=true;  
		this.totalRecords = serverPaging.total;
		this.totalPages = serverPaging.pages;
		var parsed = this.parseShot_CC(response.response.castingCall); // from mixin
if (_DEBUG) console.time("GalleryCollection: create models");	
		var shots = (1 || snappi.qs['show-hidden'] || snappi.qs.raw) ? {} : false;	
		var photos = _.map(parsed, function(v, k, l) {
			if (v.shotId) {
				if (shots && shots[v.shotId]) {
					// TODO: for /hidden:1, need to identify bestshot!
					// use sort order for now, add reference to bestshot
					var hiddenshot =  new models.Hiddenshot(v, {bestshotId: shots[v.shotId].get('photoId') });
					// add hiddenshots to bestshots
					var hiddenshotC = shots[v.shotId].get('hiddenshot');
					var current_count = hiddenshotC.models.push(hiddenshot);
					// if (current_count === hiddenshotC.shot_core.count) 
					// 	hiddenshotC.shot_core.stale = false; // don't have shot_extras yet
					return hiddenshot;
				} else {
					var shot = new models.Shot(v);
					shots[v.shotId] = shot;
					return shot;
				}
			} else return new models.Photo(v);
		});
if (_DEBUG) console.timeEnd("GalleryCollection: create models");		
		$('body').removeClass('wait');
		return photos;
	},	
};

var Backend = _.extend(mixins.BackendHelpers && mixins.BackendHelpers['Backend']  || {}, {
	'Cakephp': Cakephp,
});
mixins.BackendHelpers = mixins.BackendHelpers || {Backend:{}};
mixins.BackendHelpers['Backend'] = Backend;
var check;
})( snappi.mixins, snappi.models);