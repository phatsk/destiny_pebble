var dp_util = (function(){
	var config = {
		CACHE_INVALIDATE: false,
		ENABLE_LOGGING: true
	};

	function log(prefix, message)
	{
		return console.log('[' + prefix + '] ' + message);
	}

	return {
		logUI: function(message)
		{
			return log('UI', message);
		},
		logError: function(message)
		{
			return log('EE', message);
		},
		logInfo: function(message)
		{
			return log('II', message);
		},
		logRemote: function(message)
		{
			return log('<<', message);
		},
		logJSON: function(message)
		{
			return log('{}', JSON.stringify(message));
		},
		logLocal: function(message)
		{
			return dp_util.get('ENABLE_LOGGING') && log('>>', message);
		},
		get: function(what) {
			return config[what] || null;
		},
		set: function(what, value) {
			return config[what] ? (config[what] = value) : false;
		}
	};
})();

String.prototype.capitalize = String.prototype.capitalize || function() {
	var s = this.split(' ');
	for(var i = s.length; i--;)
	{
		s[i] = s[i].charAt(0).toUpperCase() + s[i].substring(1);
	}

	return s.join(' ');
};

this.exports = dp_util;
