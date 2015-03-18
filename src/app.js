// Set to true to always pull fresh data - use sparingly!
var BUNGIE_API = require('bungie_api');
var dp_util = require('dp_util');
var activities = require('activities');
var guardian = require('guardian');

var ui = require('ui');
var ajax = require('ajax');

var DetailWindow = new ui.Card({
	title: 'Loading...',
	scrollable: true
});

var MainMenu = new ui.Menu({
	sections: [{
		title: 'Activities',
		items: {
			title: 'Loading...'
		}
	},{
		title: 'Guardian'
	}]
});

activities.init(MainMenu, {
	nightfall: {
		title: 'Weekly Nightfall',
		icon: 'IMAGES_NODE_STRIKE',
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
});

guardian.init(MainMenu);

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

var activityData;

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
