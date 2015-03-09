var ui = require('ui');
var ajax = require('ajax');

// Check for local activity data
var activityData = localStorage.getItem('activity_data');
console.log(activityData);

if(activityData)
{
	console.log(activityData);
}
else
{
	ajax({
		url: 'http://www.bungie.net/Platform/Destiny/Advisors/',
		type: 'json'
	}, function(data){
		activityData = data;
		localStorage.setItem('activity_data', data);
		console.log(data);
	}, function(error){
		console.log('Error! ' + error);	
	});
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

MainMenu.show();
