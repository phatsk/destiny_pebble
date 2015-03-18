// Set to true to always pull fresh data - use sparingly!
var BUNGIE_API = require('bungie_api');
var dp_util = require('dp_util');

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
		dp_util.logUI('Updating menu for ' + activity);

		for(key in item)
		{
			MenuActivities[activity][key] = item[key];
		}
	}

	dp_util.logUI('Updating activity menu: ' + JSON.stringify(MenuActivities));

	for(key in MenuActivities)
	{
		if(MenuActivities.hasOwnProperty(key))
		{
			sections.push(MenuActivities[key]);
		}
	}

	dp_util.logUI('New menu sections: ' + JSON.stringify(sections));
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

	dp_util.logUI('Showing details for ' + event.item.userdata.key);

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
	dp_util.logError('Tried (unsuccessfully) to grab local data: ' + e);
	activityData = false;
}

/**
 * We didn't get any valid activityData so let's pull
 * fresh data from Bungie
 */
if(!activityData || !activityData.Response.definitions || dp_util.get('CACHE_INVALIDATE'))
{
	AjaxWait(); // AJAX Waiter

	ajax({
		url: BUNGIE_API.ADVISORS,
		type: 'json'
	}, function(data){
		activityData = data;
		localStorage.setItem('activityData', JSON.stringify(data));
		ClearWait();

		dp_util.logRemote('Got remote activity data: ' + JSON.stringify(data));

		updateActivities();
	}, function(error){
		ClearWait();

		dp_util.logError('Could not get response from ' +  BUNGIE_API.ADVISORS + ': ' + error);
	});
}
else
{
	dp_util.logLocal('Got locally stored activity data: ' + JSON.stringify(activityData.Response.data.nightfallActivityHash));
	updateActivities();
}

var guardian_config = localStorage.getItem('guardian_config');

if(guardian_config && !dp_util.get('CACHE_INVALIDATE'))
{
	guardian_config = JSON.parse(guardian_config);
	dp_util.logLocal('Found user config: ' + JSON.stringify(guardian_config));

	dp_util.logInfo('Grabbing latest guardian stats');

	ajax({
		url: BUNGIE_API.get('GUARDIAN_DATA', {type: guardian_config.platform, id: guardian_config.guardianId }),
		type: 'json'
	}, function(data){
		dp_util.logRemote('Testing URL: ' + BUNGIE_API.get('GUARDIAN_DATA', {type: guardian_config.platform, id: guardian_config.guardianId }));
		dp_util.logJSON(data);	
	}, function(error){
		dp_util.logError(error);
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

	dp_util.logInfo('Getting local data for hash: ' + hash);

	try
	{
		data = localStorage.getItem(hash);
		data = JSON.parse(data);

		dp_util.logLocal('Data gathered from localStorage for hash `' + hash + '`: ' + JSON.stringify(data));

		if(!data || !data.Response.definitions)
			throw 'No activity data for ' + hash + ', fetching fresh data';

        if(dp_util.get('CACHE_INVALIDATE'))
            throw 'Manually flushing cache!';
	}
	catch(e) {
		var activityUrl = BUNGIE_API.MANIFEST.ACTIVITY + hash.split('-')[hash.split('-').length-1];
		dp_util.logError('Tried (unsuccessfully) to grab local data for ' + hash + ': ' + e);
		dp_util.logInfo('Pulling data for ' + hash + ' from: ' + activityUrl);

		AjaxWait();

		ajax({
			url: activityUrl + '?definitions=true',
			type: 'json'
		}, function(data){
			localStorage.setItem(hash, JSON.stringify(data));
			ClearWait();

			dp_util.logRemote('Got remote activity data: ' + JSON.stringify(data));

			callback(data);
		}, function(error){
			ClearWait();

			dp_util.logError('Could not get response from ' +  activityUrl + ': ' + error);
		});
	}

	if(data)
	{
		dp_util.logLocal('Found local data for hash ' + hash + ', executing callback');
		callback(data);
	}
}

// configuration stuffs
Pebble.addEventListener('showConfiguration', function(e){
	Pebble.openURL('http://destiny-phatsk.rhcloud.com/config.php');
});

Pebble.addEventListener('webviewclosed', function(e){
	var config = JSON.parse(decodeURIComponent(e.response));
    dp_util.logLocal('Configuration window returned: ', JSON.stringify(config));

	if(config)
	{
		localStorage.setItem('guardian_config', JSON.stringify(config));
	}
});
