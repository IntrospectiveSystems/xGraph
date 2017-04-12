(function ImagePng() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		GetTexture: GetTexture
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------GetTexture
	// Retrive texture object in the form used by X3D
	function GetTexture(com, fun) {
		var PNG = require('pngjs2').PNG;
		var fs = require('fs');
		var Par = this.Par;
		var path = __Path(Par.Source);
		fs.exists(path, exists);

		function exists(yes) {
			if (!yes) {
				console.log(' ** Pid <' + pid + '> not available');
				fun(' ** Not found');
				return;
			}
			fs.createReadStream(path)
			.pipe(new PNG({ filterType: 4 }))
			.on('parsed', function () {
			//	console.log('Ping size', this.height, this.width);
				var txt = {};
				txt.Size = Par.Size;
				txt.Source = __Path(Par.Source);
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
				com.Texture = txt;
				fun();
			});
		}
	}

})();
