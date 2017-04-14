(function ImagePng() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetTexture: GetTexture
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------Setup
	function Setup(com, fun) {
		console.log('--Texture/Setup');
		if(fun)
			fun();
	}

	//-----------------------------------------------------GetModel
	function Start(com, fun) {
		console.log('--Texture/Start');
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		if(!('Texture' in Par)) {
			var err = 'No Texture in Par';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		var path = Par.Texture;
		var parts = path.split('.');
		if(parts.length < 2) {
			var err = 'Invalid path:' + path;
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		switch(parts[parts.length-1]) {
			case 'png':
				ping();
				break;
			case 'jpg':
				jpeg();
				break;
			default:
				var err = 'Unknown texture type <' + parts[parts.length-1] + '>';
				console.log(' ** ERR:' + err);
				if(fun)
					fun(err);
				break;
		}

		function ping() {
			console.log('..Texture/ping');
			var PNG = require('pngjs2').PNG;
			var fs = require('fs');
			fs.exists(path, exists);

			function exists(yes) {
				if (!yes) {
					var err = 'Texture <' + path + '> not available';
					console.log(' ** ERR:' + err);
					if(fun)
						fun(err);
					return;
				}
				fs.createReadStream(path)
				.pipe(new PNG({ filterType: 4 }))
				.on('parsed', function () {
					console.log('Ping size', this.height, this.width);
					var txt = {};
					txt.Size = Par.Size;
					txt.Source = Nxs.genPath(Par.Texture);
					txt.Width = this.width;
					txt.Height = this.height;
					txt.Type = 'RGB';
					var img = [];
					var n = this.height * this.width;
					var ix = 0;
					var data = this.data;
					for (var i = 0; i < n; i++) {
						img.push(data[ix], data[ix + 1], data[ix + 2]);
						ix += 4;
					}
					txt.Img = img;
					Vlt.Texture = txt;
					console.log('Vlt.Texture', Vlt.Texture);
					if(fun)
						fun();
				});
			}
		}

		function jpeg() {
			var err = 'Jpeg not yet implemented';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
		}
	}

	//-----------------------------------------------------GetTexture
	// Retrive texture object in the form used by X3D
	function GetTexture(com, fun) {
		console.log('--Texture/Start');
		var Vlt = this.Vlt;
		if('Texture' in Vlt) {
			com.Texture = Vlt.Texture;
			if(fun)
				fun(null, com);
			return;
		}
		var err = 'Texture not initizlized';
		console.log(' ** ERR:' + err);
		if(fun)
			fun(err);
		return;
	}

})();
