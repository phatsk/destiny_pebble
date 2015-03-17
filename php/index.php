<!doctype html>
<html>
	<head>
		<title>Destiny Pebble Configuration</title>
		<script src="https://code.jquery.com/jquery-2.1.3.min.js"></script>
		<style>
		.error {
			background: #FF7070;
			float: left;
			padding: 8px;
			border-radius: 5px;
			display: none;
		}
		#mask {
			display: none;
			background: rgba(0,0,0,0.5);
			z-index:1000;
			float: left;
			width: 100%;
			height: 100%;
		}
		</style>
	</head>
	<body>
		<form>
			<select name="platform">
				<option value="1">XBL</option>
				<option value="2">PSN</option>
			</select>

			<input type="text" name="gamertag" placeholder="Gamertag" />

			<button type="submit">Save</button>
		</form>
		<hr />
		<div id="missing-error" class="error">
			All fields are required.
		</div>
		<div id="gamertag-error" class="error">
			Could not find the specified gamertag on the specified network.
		</div>
		<div id="mask"></div>
	</body>
	<script>
	jQuery(document).ready(function(){
		var required = {
			platform: null,
			gamertag: null
		};

		var mask = $('#mask');

		jQuery('button').on('click', function(event){
			event.preventDefault();
			event.stopPropagation();

			mask.show();

			var missing = false;

			jQuery('form input, form select').each(function(){
				if(this.name && required.hasOwnProperty(this.name))
				{
					required[this.name] = this.value;

					if(!required[this.name])
					{
						missing = true;
					}
				}
			});

			if(missing)
			{
				jQuery('#missing-error').show();
				mask.hide();
			}
			else
			{
				jQuery.ajax({
					url: [
						'http://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/',
						required.platform,
						'/',
						required.gamertag
					].join(''),
					crossDomain: true,
					dataType: 'json',
					success: function(response) {
						console.log(response);
					},
					callback: function(resposne) {
						modal.hide();
						console.log(response);
					}
				});
				window.location = 'pebblejs://close#' + encodeURIComponent(JSON.stringify(required));
			}
		});
	});
	</script>
</html>

