// Test Urls and params


var sample_Urls: {
	'node/timeline': [
		// CORS issue forces use of nodejs backend, http://localhost:3000
		'http://localhost:3000/bb/?pager=timeline&backend=node',	
		'http://localhost:3000/bb/?userid=5013ddf3-069c-41f0-b71e-20160afc480d&type=wo:13&perpage=20&backend=node&sort=date-taken&pager=timeline',
		'http://localhost:3000/bb/?role=USER&owner=12345678-1111-0000-0000-paris-------&perpage=20&backend=node&sort=date-taken&pager=timeline',
		],
	'node/pager':[
		'http://localhost:3000/bb/?userid=5013ddf3-069c-41f0-b71e-20160afc480d&type=wo:13&perpage=20&backend=node&sort=date-taken&pager=page',
		'http://localhost:3000/bb/?role=USER&owner=12345678-1111-0000-0000-paris-------&perpage=20&backend=node&sort=date-taken&pager=page'
		],		
	'file':[
		'http://github/backbone-playground/?backend=file&owner=2011&perpage=20',
		],
	'flickr/placeline':[
		'http://github/backbone-playground/?pager=placeline&perpage=20&size=m',
		],
}


var querystring_params = {
	'page': 1,
	'perpage': 20,
	'size': [S,M,L],
	'sort': {	// valid values depend on &backend=
		backend=node: ['date-taken', 'most-recent', 'top-rated', 'score', 'rating'],
		backend=flickr: ['interestingness-desc', 'relevance' ], // see flickr api
		backend=cake: ['dateTaken','rating', 'batch_id', 'owner_id', 'caption'],
	},
	'direction': ['asc','desc'], // works with differnet &sort= values
	'from': 'timestamp or SQL date',
	'to': 'timestamp or SQL date',
	'rating': ['null', 'integer'], // 'null' should unset filter.rating
	'backend': {
		'cake': null, // cakephp backend
			'owner': ['UUID','username'],  // User.id or User.username 
			'type':{	
				// for access to public photos, backend=cake 
				'guest': '&owner=UUID', // guest access, default, show public photos for &userid=
				'owner': null, // override &owner, &backend=cakephp, /my/photos
				'odesk': '&owner=username', // &owner=username, see cakephp:PersonController.odesk_photos()
				// uses auto-login(?) for cakephp backend?
				'wo:[woid]': '&userid=[Editor]',
				'tw:[twid]': '&userid=[Editor]',
			},
		'node': null, 
			// REQUIRED: use http://localhost:3000/ to avoid CORS
			'role': ['VISITOR', 'USER', 'EDITOR'], // default VISITOR
			'owner': ['venice', 'mb', '2011', 'or valid userid'], // check &role for permissions
			// WARNING: &role=USER&userid=[UUID] does an auto-login!!!
			'userid': ['UUID', 'or &owner=value'], // nodejs editor.id, DEFAULT 'manager'
			'ownerid': ['UUID', 'or &owner=value'], // nodejs default 'mb' User.id
			'type':{	
				// uses &role= for permissions, 
				// auto sets &role=EDITOR
				'wo:[woid]': '&userid=[Editor]',
				'tw:[twid]': '&userid=[Editor]',
			},
		'file': {
			'pager': 'page', // override, set in js/main.js
			'owner': [2011,venice,mb], // see js/snappi-bootstrap.js for cached JSON, 
		},
	},
	'pager':{
		'timeline': ['node','cake'],
		'placeline': ['flickr only'],
		'page': ['node', 'cake', 'file'],
	}
}

