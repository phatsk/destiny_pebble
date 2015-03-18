var BUNGIE_API = {
	ADVISORS: 'http://www.bungie.net/Platform/Destiny/Advisors/?definitions=true',
    MANIFEST: {
        ACTIVITY: 'http://www.bungie.net/platform/Destiny/Manifest/Activity/',
		ACTIVITY_TYPE: 'http://www.bungie.net/platform/Destiny/Manifest/ActivityType/'
    },
	GUARDIAN_DATA: 'http://www.bungie.net/Platform/Destiny/{type}/Account/{id}',
	HASH: {
		3159615086: 'glimmer',
		1415355184: 'cruciblemarks',
		1415355173: 'vanguardmarks',
		898834093: 'exo',
		3887404748: 'human',
		2803282938: 'awoken',
		3111576190: 'male',
		2204441813: 'female',
		671679327: 'hunter',
		3655393761: 'titan',
		2271682572: 'warlock',
		3871980777: 'newmonarchy',
		529303302: 'cryptarch',
		2161005788: 'ironbanner',
		452808717: 'queen',
		3233510749: 'vanguard',
		1357277120: 'crucible',
		2778795080: 'deadorbit',
		1424722124: 'futurewarcult'
	},
	get: function(what, config) {
		var r;

		what = BUNGIE_API[what];

		for(var key in config)
		{
			if(config.hasOwnProperty(key))
			{
				r = new RegExp('{' + key + '}', 'g');
				what = what.replace(r, config[key]);
			}
		}

		return what;
	}
};

this.exports = BUNGIE_API;
