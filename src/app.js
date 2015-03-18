// Set to true to always pull fresh data - use sparingly!
var BUNGIE_API = require('bungie_api');
var dp_util = require('dp_util');
var activities = require('activities');

var ui = require('ui');
var ajax = require('ajax');

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

var MainMenu = new ui.Menu({
	sections: [{
		title: 'Activities'
	},{
		title: 'Guardian'
	}]
});

activities.init(MainMenu);

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
