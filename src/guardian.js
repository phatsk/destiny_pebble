this.exports = (function(){
	var dp_util = require('dp_util');
	var BUNGIE_API = require('bungie_api');
	var ajax = require('ajax');

	// Check for local activity data
	var guardian_config = localStorage.getItem('guardian_config');

	function get_guardian_data(callback)
	{
		if(guardian_config && !dp_util.get('CACHE_INVALIDATE'))
		{
			guardian_config = JSON.parse(guardian_config);
			dp_util.logLocal('Found user config: ' + JSON.stringify(guardian_config));

			dp_util.logInfo('Grabbing latest guardian stats');

			var guardian_info = JSON.parse(localStorage.getItem('guardian_info'));

			var today = new Date();

			if(guardian_info.expires < today || dp_util.get('CACHE_INVALIDATE'))
			{
				ajax({
					url: BUNGIE_API.get('GUARDIAN_DATA', {type: guardian_config.platform, id: guardian_config.guardianId }),
					type: 'json'
				}, function(data){
					dp_util.logRemote('Found remote guardian data');
					dp_util.logJSON(data);	

					dp_util.logInfo('Storing guardian config for one hour');
					today.setHours(today.getHours()+1);
					data.expires = today;

					localStorage.setItem('guardian_info', JSON.stringify(data));
					callback(data);

				}, function(error){
					dp_util.logError(error);
					callback(false, true);
				});
			}
		}
		else
		{
			callback(false, true);
		}
	}

	return {
		init: function(menu) {
			get_guardian_data(function(data, is_error){
				if(is_error)
				{
					return menu.section(1, {title: 'Guardian', items: [{
						title: 'Error',
						subtitle: 'Check app settings'
					}]});
				}

				logInfo('Got guardian data');

				menu.setction(1, {
					title: 'Loading info',
					subtitle: 'Please wait'
				});
			});	
		}
	};
})();