var ui = require('ui');

var data = {
    "Response": {
        "data": {
            "nightfallActivityHash": 3468792475,
            "heroicStrikeHashes": [
                3468792472,
                3468792473,
                3468792474
            ],
            "dailyChapterHashes": [
                1422833049,
                1422833050,
                1422833051
            ],
            "nightfallResetDate": "2015-03-10T09:00:00Z",
            "heroicStrikeResetDate": "2015-03-10T09:00:00Z",
            "dailyChapterResetDate": "2015-03-10T09:00:00Z",
            "events": {
                "events": []
            },
            "dailyCrucibleHash": 1553742942,
            "dailyCrucibleResetDate": "2015-03-10T09:00:00Z",
            "nightfallRewardIndexes": [
                0
            ],
            "dailyCrucibleRewardIndexes": [
                0,
                1,
                2
            ],
            "heroicStrikeRewardIndexes": {
                "3468792472": [
                    0,
                    1,
                    2
                ],
                "3468792473": [
                    0,
                    1,
                    2
                ],
                "3468792474": [
                    0,
                    1,
                    2
                ]
            },
            "dailyChapterRewardIndexes": {
                "1422833049": [
                    0,
                    1,
                    2
                ],
                "1422833050": [
                    1,
                    2,
                    3
                ],
                "1422833051": [
                    1,
                    2,
                    3
                ]
            }
        }
    },
    "ErrorCode": 1,
    "ThrottleSeconds": 0,
    "ErrorStatus": "Success",
    "Message": "Ok",
    "MessageData": {}
};

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
