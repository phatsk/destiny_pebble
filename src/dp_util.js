var dp_util = (function(){
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
			return ENABLE_LOGGING && log('>>', message);
		}
	};
})();

String.prototype.capitalize = String.prototype.capitalize || function() {
	return this.charAt(0).toUpperCase() + this.substring(1);
};

this.exports = dp_util;
