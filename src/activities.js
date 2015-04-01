var activites = (function(){ 
	  var today = new Date();
	  var dp_util = require('dp_util');
	  var BUNGIE_API = require('bungie_api');
	  var ajax = require('ajax');

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

	  function updateActivities(menu, menuConfig)
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

			      updateActivityMenu('nightfall', item, menu, menuConfig);
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

			      updateActivityMenu('weekly', item, menu, menuConfig);
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

			      updateActivityMenu('daily', item, menu, menuConfig);
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

			      updateActivityMenu('crucible', item, menu, menuConfig);
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

	  function updateActivityMenu(activity, item, menu, menuConfig)
	  {
		    var sections = [];
		    var key;

		    if(item)
		    {
			      dp_util.logUI('Updating menu for ' + activity);

			      for(key in item)
			      {
				        menuConfig[activity][key] = item[key];
			      }
		    }

		    dp_util.logUI('Updating activity menu: ' + JSON.stringify(menuConfig));

		    for(key in menuConfig)
		    {
			      if(menuConfig.hasOwnProperty(key))
			      {
				        sections.push(menuConfig[key]);
			      }
		    }

		    dp_util.logUI('New menu sections: ' + JSON.stringify(sections));
		    menu.section(0, {title: 'Activities', items: sections});
	  }

	  return {
		    init: function(menu, menuConfig) {
			      var ajax = require('ajax');
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

					          updateActivities(menu, menuConfig);
				        }, function(error){

					          dp_util.logError('Could not get response from ' +  BUNGIE_API.ADVISORS + ': ' + error);
				        });
			      }
			      else
			      {
				        dp_util.logLocal('Got locally stored activity data: ' + JSON.stringify(activityData.Response.data.nightfallActivityHash));
				        updateActivities(menu, menuConfig);
			      }
		    }	
	  };
})();

this.exports = activites;
