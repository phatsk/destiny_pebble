var ui = require('ui');
var ajax = require('ajax');

// Check for local activity data
var activityData = localStorage.getItem('activity_data');

var waitCard = new ui.Card({
	title: 'Loading',
	subtitle: '.'
});

if(!activityData)
{
	AjaxWait();
	ajax({
		url: 'http://www.bungie.net/Platform/Destiny/Advisors/',
		type: 'json'
	}, function(data){
		activityData = data;
		localStorage.setItem('activity_data', data);
		ClearWait();
	}, function(error){
		ClearWait();
	});
}

console.log('Got activity data. ' + JSON.stringify(activityData));

// console.log('Got activity data. ' + activityData.Response.data.nightfallActivityHash);

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
