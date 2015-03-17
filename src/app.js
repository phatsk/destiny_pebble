// Set to true to always pull fresh data - use sparingly!
var CACHE_INVALIDATE = false;
var ENABLE_LOGGING = true;
var BUNGIE_API = {
	ADVISORS: 'http://www.bungie.net/Platform/Destiny/Advisors/?definitions=true',
    MANIFEST: {
        ACTIVITY: 'http://www.bungie.net/platform/Destiny/Manifest/Activity/',
		ACTIVITY_TYPE: 'http://www.bungie.net/platform/Destiny/Manifest/ActivityType/'
    },
	GUARDIAN_DATA: 'http://www.bungie.net/Platform/Destiny/{type}/Account/{id}',
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

var ui = require('ui');
var ajax = require('ajax');
var activityData = false;

var DetailWindow = new ui.Card({
	title: 'Loading...',
	scrollable: true
});

var MenuActivities = {
	nightfall: {
		title: 'Weekly Nightfall',
		subtitle: 'Loading...',
		userdata: {
			key: 'NIGHTFALL'
		}
	},
	weekly: {
		title: 'Weekly Heroic',
		subtitle: 'Loading...',
		userdata: {
			key: 'WEEKLY'
		}
	},
	daily: {
		title: 'Daily Heroic',
		subtitle: 'Loading...',
		userdata: {
			key: 'DAILY'
		}
	},
	crucible: {
		title: 'Daily Crucible',
		subtitle: 'Loading...',
		userdata: {
			key: 'CRUCIBLE'
		}
	}
};

function updateActivityMenu(activity, item)
{
	var sections = [];
	var key;

	if(item)
	{
		logUI('Updating menu for ' + activity);

		for(key in item)
		{
			MenuActivities[activity][key] = item[key];
		}
	}

	logUI('Updating activity menu: ' + JSON.stringify(MenuActivities));

	for(key in MenuActivities)
	{
		if(MenuActivities.hasOwnProperty(key))
		{
			sections.push(MenuActivities[key]);
		}
	}

	logUI('New menu sections: ' + JSON.stringify(sections));
	MainMenu.section(0, {title: 'Activities', items: sections});
}

var MainMenu = new ui.Menu({
	sections: [{
		title: 'Activities'
	},{
		title: 'Guardian'
	}]
});

MainMenu.on('select', function(event){
	var sections = event.item.userdata.getDetails();

	logUI('Showing details for ' + event.item.userdata.key);

	for(var key in sections)
	{
		if(sections.hasOwnProperty(key) && DetailWindow[key])
		{
			DetailWindow[key](sections[key]);
		}
	}

	DetailWindow.show();
});

var waitCard = new ui.Card({
	title: 'Loading...'
});

var today = new Date();
var activityData;

// Check for local activity data
try
{
    activityData = localStorage.getItem('activityData');
	activityData = JSON.parse(activityData);

	if(activityData)
	{
        var nfreset;
        var dailyreset;

		// Reset for Tuesday - weeklies reset together, so we can check against the Nightfall
		if(today.getDay() == 2 && (nfreset = new Date(activityData.Response.data.nightfallResetDate)) && today > nfreset) // Tuesday
		{
			throw "Weekly data is stale, pulling some fresh";
		}

        if((dailyreset = new Date(activityData.Response.data.dailyChapterResetDate)) && today > dailyreset)
		{
			throw "Daily data is stale, pulling some fresh";
		}
	}
}
catch(e) {
	logError('Tried (unsuccessfully) to grab local data: ' + e);
	activityData = false;
}

/**
 * We didn't get any valid activityData so let's pull
 * fresh data from Bungie
 */
if(!activityData || !activityData.Response.definitions || CACHE_INVALIDATE)
{
	AjaxWait(); // AJAX Waiter

	ajax({
		url: BUNGIE_API.ADVISORS,
		type: 'json'
	}, function(data){
		activityData = data;
		localStorage.setItem('activityData', JSON.stringify(data));
		ClearWait();

		logRemote('Got remote activity data: ' + JSON.stringify(data));

		updateActivities();
	}, function(error){
		ClearWait();

		logError('Could not get response from ' +  BUNGIE_API.ADVISORS + ': ' + error);
	});
}
else
{
	logLocal('Got locally stored activity data: ' + JSON.stringify(activityData.Response.data.nightfallActivityHash));
	updateActivities();
}

var guardian_config = localStorage.getItem('guardian_config');

if(guardian_config && !CACHE_INVALIDATE)
{
	guardian_config = JSON.parse(guardian_config);
	logLocal('Found user config: ' + JSON.stringify(guardian_config));

	logInfo('Grabbing latest guardian stats');

	ajax({
		url: BUNGIE_API.get('GUARDIAN_DATA', {type: guardian_config.platform, id: guardian_config.guardianId }),
		type: 'json'
	}, function(data){
		logRemote('Testing URL: ' + BUNGIE_API.get('GUARDIAN_DATA', {type: guardian_config.platform, id: guardian_config.guardianId }));
		logJSON(data);	
	}, function(error){
		logError(error);
	});
}
else
{
	MainMenu.section(1, {title: 'Guardian', items: [{
		title: 'Error',
		subtitle: 'Check app settings'
	}]});
}

MainMenu.show();

function AjaxWait()
{
	waitCard.show();
	MainMenu.hide();
}

function ClearWait()
{
	MainMenu.show();
	waitCard.hide();
}

function updateActivities()
{
	var nightfallHash = 'activity-nightfall-' + activityData.Response.data.nightfallActivityHash;
	var weeklyHash = 'activity-weekly-' + activityData.Response.data.heroicStrikeHashes.join('-');
	var dailyHash = 'activity-daily-' + activityData.Response.data.dailyChapterHashes.join('-');
	var crucibleHash = 'activity-crucible-' + activityData.Response.data.dailyCrucibleHash;

	getLocalData(nightfallHash, function(data){
		var item = {
			subtitle: data.Response.data.activity.activityDescription,
			userdata: {
				key: nightfallHash,
				getDetails: function() {
					return {
						title: 'Weekly Nightfall',
						subtitle: 'Strike',
						body: data.Response.data.activity.activityDescription
					};
				}
			}
		};

		updateActivityMenu('nightfall', item);
	});

	getLocalData(weeklyHash, function(data){
		var item = {
			subtitle: data.Response.data.activity.activityDescription,
			userdata: {
				key: weeklyHash,
				getDetails: function() {
					return {
						title: 'Weekly Heroic',
						subtitle: 'Strike',
						body: data.Response.data.activity.activityDescription
					};
				}
			}
		};

		updateActivityMenu('weekly', item);
	});

    getLocalData(dailyHash, function(data){
        var item = {
            title: data.Response.data.activity.activityName,
            subtitle: data.Response.data.activity.activityDescription,
			userdata: {
				key: dailyHash,
				getDetails: function() {
					return {
						title: 'Daily Heroic',
						subtitle: data.Response.data.activity.activityName,
						body: data.Response.data.activity.activityDescription
					};
				}
			}
        };

        updateActivityMenu('daily', item);
    });

    getLocalData(crucibleHash, function(data){
		var activityHash = data.Response.data.activity.activityTypeHash;
		var activityType = data.Response.definitions.activityTypes[activityHash].activityTypeName;

        var item = {
			title: activityType + ': ' + data.Response.data.activity.activityName,
            subtitle: data.Response.data.activity.activityDescription,
			userdata: {
				key: crucibleHash,
				getDetails: function() {
					return {
						title: activityType,
						subtitle: data.Response.data.activity.activityName,
						body: data.Response.data.activity.activityDescription
					};
				}
			}
        };

        updateActivityMenu('crucible', item);
    });
}

function getLocalData(hash, callback)
{
	var data;
	callback = callback || function() {};

	logInfo('Getting local data for hash: ' + hash);

	try
	{
		data = localStorage.getItem(hash);
		data = JSON.parse(data);

		logLocal('Data gathered from localStorage for hash `' + hash + '`: ' + JSON.stringify(data));

		if(!data || !data.Response.definitions)
			throw 'No activity data for ' + hash + ', fetching fresh data';

        if(CACHE_INVALIDATE)
            throw 'Manually flushing cache!';
	}
	catch(e) {
		var activityUrl = BUNGIE_API.MANIFEST.ACTIVITY + hash.split('-')[hash.split('-').length-1];
		logError('Tried (unsuccessfully) to grab local data for ' + hash + ': ' + e);
		logInfo('Pulling data for ' + hash + ' from: ' + activityUrl);

		AjaxWait();

		ajax({
			url: activityUrl + '?definitions=true',
			type: 'json'
		}, function(data){
			localStorage.setItem(hash, JSON.stringify(data));
			ClearWait();

			logRemote('Got remote activity data: ' + JSON.stringify(data));

			callback(data);
		}, function(error){
			ClearWait();

			logError('Could not get response from ' +  activityUrl + ': ' + error);
		});
	}

	if(data)
	{
		logLocal('Found local data for hash ' + hash + ', executing callback');
		callback(data);
	}
}

function log(prefix, message)
{
	return console.log('[' + prefix + '] ' + message);
}

function logUI(message)
{
	return log('UI', message);
}

function logError(message)
{
	return log('EE', message);
}

function logInfo(message)
{
	return log('II', message);
}

function logRemote(message)
{
	return log('<<', message);
}

function logJSON(message)
{
	return log('{}', JSON.stringify(message));
}

function logLocal(message)
{
	return ENABLE_LOGGING && log('>>', message);
}

// configuration stuffs
Pebble.addEventListener('showConfiguration', function(e){
	Pebble.openURL('http://destiny-phatsk.rhcloud.com/config.php');
});

Pebble.addEventListener('webviewclosed', function(e){
	var config = JSON.parse(decodeURIComponent(e.response));
    console.log('Configuration window returned: ', JSON.stringify(config));

	if(config)
	{
		localStorage.setItem('guardian_config', JSON.stringify(config));
	}
});
