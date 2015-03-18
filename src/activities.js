// var dp_util = require('dp_util');

var activites = (function(){ 
	var activityData = false;

	/**
	 * First we try to get activity data from localStorage. This may be invalidated if 
	 * #1 It's Tuesday and we haven't pulled the latest data after reset or
	 * #2 We need to grab new daily info
	 * @TODO Needs weekly event (Iron Banner, Queen's Wrath, etc)
	 */
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

	function updateActivities(MainMenu)
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

			updateActivityMenu('nightfall', item, MainMenu);
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

			updateActivityMenu('weekly', item, MainMenu);
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

			updateActivityMenu('daily', item, MainMenu);
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

			updateActivityMenu('crucible', item, MainMenu);
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

	function updateActivityMenu(activity, item, MainMenu)
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

	return {
		init: function(MainMenu) {
			/**
			* We didn't get any valid activityData so let's pull
			* fresh data from Bungie
			*/
			if(!activityData || !activityData.Response.definitions || dp_util.get('CACHE_INVALIDATE'))
			{
				ajax({
					url: BUNGIE_API.ADVISORS,
					type: 'json'
				}, function(data){
					activityData = data;
					localStorage.setItem('activityData', JSON.stringify(data));

					dp_util.logRemote('Got remote activity data: ' + JSON.stringify(data));

					updateActivities(MainMenu);
				}, function(error){

					dp_util.logError('Could not get response from ' +  BUNGIE_API.ADVISORS + ': ' + error);
				});
			}
			else
			{
				dp_util.logLocal('Got locally stored activity data: ' + JSON.stringify(activityData.Response.data.nightfallActivityHash));
				updateActivities(MainMenu);
			}
		}	
	};
})();

this.exports = activites;
