var BUNGIE_API = {
	ADVISORS: 'http://www.bungie.net/Platform/Destiny/Advisors/'
};

var ui = require('ui');
var ajax = require('ajax');
var activityData = false;
var MenuActivities = {
	nightfall: {
		title: 'Nightfall',
		subtitle: 'Loading...'
	},
	weekly: {
		title: 'Weekly',
		subtitle: 'Loading...'
	},
	daily: {
		title: 'Daily',
		subtitle: 'Loading...'
	}
};

function updateMenu(activity, item)
{
	var sections = [];


	if(item)
	{
		console.log('Updating menu for ' + activity);
		MenuActivities[activity] = item;
	}

	console.log('Updating activity menu: ' + JSON.stringify(activity));

	var i = 0;

	for(var key in MenuActivities)
	{
		if(MenuActivities.hasOwnProperty(key))
		{
			MainMenu.section(i, MenuActivities[key]);
		}

		i++;
	}
}

var MainMenu = new ui.Menu({
	sections: [{
		title: 'Activities',
		items: [{
			title: 'Weekly Nightfall',
			subtitle: ['NF', 'E', 'AB', 'A', 'LS'].join('*')
	},{
			title: 'Weekly Heroic',
			subtitle: ['H', 'LS'].join('*')
		}]
	}]
});

var waitCard = new ui.Card({
	title: 'Loading',
	subtitle: '.'
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
		// Reset for Tuesday - weeklies reset together, so we can check against the Nightfall
		if(today.getDay() == 2 && (nfreset = new Date(activityData.Response.data.nightfallResetDate)) && today > nfreset) // Tuesday
		{
			throw "Weekly data is stale, pulling some fresh";
		}
		else if((dailyreset = new Date(activityData.Response.data.dailyChapterResetDate)) && today > dailyreset)
		{
			throw "Daily data is stale, pulling some fresh";
		}
	}
}
catch(e) {
	console.log('Tried (unsuccessfully) to grab local data: ' + e);
	activityData = false;
}

/**
 * We didn't get any valid activityData so let's pull
 * fresh data from Bungie
 */
if(!activityData)
{
	AjaxWait(); // AJAX Waiter

	ajax({
		url: BUNGIE_API.ADVISORS,
		type: 'json'
	}, function(data){
		activityData = data;
		localStorage.setItem('activityData', JSON.stringify(data));
		ClearWait();
		console.log('Got remote activity data: ' + JSON.stringify(data));
		updateActivities();
	}, function(error){
		ClearWait();
		console.log('Could not get response from ' +  BUNGIE_API.ADVISORS + ': ' + error);
	});
}
else
{
	console.log('Got locally stored activity data: ' + JSON.stringify(activityData.Response.data.nightfallActivityHash));
	updateActivities();
}

MainMenu.show();

var waitInterval;
var waitTick = 1;

function AjaxWait()
{
	waitCard.show();
	MainMenu.hide();

	waitInterval = setInterval(function() {
		var sub = '.';

		if(waitTick == 10)
			waitTick = 1;

		for(var i = 0; i < waitTick; i++)
			sub += '.';

		waitTick++;

		waitCard.subtitle(sub);
	}, 500);	
}

function ClearWait()
{
	clearInterval(waitInterval);
	MainMenu.show();
	waitCard.hide();
}

function updateActivities()
{
	var nightfallHash = 'activity-nightfall-' + activityData.Response.data.nightfallActivityHash;
	var weeklyHash = 'activity-weekly-' + activityData.Response.data.heroicStrikeHashes.join('-');
	var dailyHash = 'activity-daily-' + activityData.Response.data.dailyChapterHashes.join('-');

	getLocalData(nightfallHash, function(data){
		var item = {
			title: data.Response.data.activity.activityName,
			subtitle: data.Response.data.activity.activityDescription
		};

		updateMenu('nightfall', item);
	});
}

function getLocalData(hash, callback)
{
	var data;
	callback = callback || function() {};

	console.log('Getting local data for hash: ' + hash);

	try 
	{
		data = localStorage.getItem(hash);
		data = JSON.parse(data);

		if(!data)
			throw 'No activity data for ' + hash + ', fetching fresh data';

		console.log('Found local data, executing callback');
		callback(data);
	}
	catch(e) {
		console.log('Tried (unsuccessfully) to grab local data for ' + hash + ': ' + e);
		var activityUrl = 'http://www.bungie.net/platform/Destiny/Manifest/Activity/' + hash.split('-')[hash.split('-').length-1];

		AjaxWait();

		ajax({
			url: activityUrl,
			type: 'json'
		}, function(data){
			localStorage.setItem(hash, JSON.stringify(data));
			ClearWait();
			console.log('Got remote activity data: ' + JSON.stringify(data));
			callback(data);
		}, function(error){
			ClearWait();
			console.log('Could not get response from ' +  activityUrl + ': ' + error);
		});
	}
}
