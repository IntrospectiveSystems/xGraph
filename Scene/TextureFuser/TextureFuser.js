(function TextureFuser() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------rgbToHex
	function rgbaToHex(r, g, b, a) {
		return (r << 24) + (g << 16) + (b << 8) + a;
	}

	//-----------------------------------------------------Setup
	function Start(com, fun) {
		console.log('--TextureFuser/Setup');
		if(fun)
			fun();
	}

	//-----------------------------------------------------Setup
	function Setup(com, fun) {
		console.log('--TextureFuser/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------Start
	function Start(com, fun) {
		var Jimp = require('jimp');
		var blend = {};
		var target = this.Nxs.getParameter('Target');
		var path = 'C:/Archive/Raw/Marlin/TreeFarmDecid/lwo/Leaves004_green.jpg';
		var dot = path.lastIndexOf('.');
		var bar = path.lastIndexOf('_');
		var slash = path.lastIndexOf('/');
		blend.Texture = path;
		blend.Alpha = path.substr(0, bar) + '_alpha.jpg';
		blend.Diffuse = path.substr(0, bar) + '_diffuse.jpg';
		if('Alpha' in blend)
			blend.Output = path.substr(slash+1, dot-slash-1) + '.png';
		else
			blend.Output = path.substr(slash+1, dot-slash-1) + '.jpg';
		console.log('blend', JSON.stringify(blend, null, 2));
		blender(blend);

		function blender(blend) {
			var pixels;
			var width;
			var height;
			var npixels;
			Jimp.read(blend.Texture).then(function (img) {
				var pix = img.bitmap.data;
				width = img.bitmap.width;
				height = img.bitmap.height;
				npixels = 4*width*height;
				pixels = new Uint8Array(npixels);
				console.log('w, h, data', width, height, pixels.length);
				for(var i=0; i<npixels; i++)
					pixels[i] = pix[i];
				console.log('saving');
				alpha();
			}).catch(function (err) {
				console.log(' ERR:' + err);
				if(fun)
					fun(err);
				return;
			});
/*
			function alpha() {
				if(!('Alpha' in blend)) {
					save();
					return;
				}
				console.log('alpha', blend.Alpha);
				Jimp.read(blend.Alpha).then(function(img) {
					var pix = img.bitmap.data;
					var w = img.bitmap.width;
					var h = img.bitmap.height;
					if(w != width || h != height) {
						var err = 'Alpha dimensions incompatible';
						console.log(' ** ERR:' + err);
						if(fun)
							fun(err);
						return;
					}
					var n = 0;
					console.log('npixels', npixels);
					for(var ipix=0; ipix<npixels; ipix+=4) {
						//	var a = pix[ipix];
						//	if(a > 0)
						//		console.log('a', a);
						pixels[ipix + 3] = pix[ipix];
						n++;
					}
					console.log('n', n);
					save();
				}).catch(function(err) {
					console.log(' ERR:' + err);
					if(fun)
						fun(err);
					return;
				});
			}
*/
			function alpha() {
				if(!('Alpha' in blend)) {
					diffuse();
					return;
				}
				console.log('alpha', blend.Alpha);
				Jimp.read(blend.Alpha).then(function(img) {
					var pix = img.bitmap.data;
					var w = img.bitmap.width;
					var h = img.bitmap.height;
					if(w != width || h != height) {
						var err = 'Alpha dimensions incompatible';
						console.log(' ** ERR:' + err);
						if(fun)
							fun(err);
						return;
					}
					for(var ipix=0; ipix<npixels; ipix+=4) {
						pixels[ipix + 3] = pix[ipix];
					}
					diffuse();
				}).catch(function(err) {
					console.log(' ERR:' + err);
					if(fun)
						fun(err);
					return;
				});
			}

			function diffuse() {
				if(!('Diffuse' in blend)) {
					save();
					return;
				}
				console.log('diffuse', blend.Diffuse);
				Jimp.read(blend.Diffuse).then(function(img) {
					var pix = img.bitmap.data;
					var w = img.bitmap.width;
					var h = img.bitmap.height;
					if(w != width || h != height) {
						var err = 'Diffuse dimensions incompatible';
						console.log(' ** ERR:' + err);
						if(fun)
							fun(err);
						return;
					}
					for(var ipix=0; ipix<npixels; ipix+=4) {
						var fac = pix[ipix]/255;
						for(var i=0; i<3; i++)
							pixels[ipix+i] = Math.floor(fac*pixels[ipix+i]);
					}
					save();
				}).catch(function(err) {
					console.log(' ERR:' + err);
					if(fun)
						fun(err);
					return;
				});
			}

			function save() {
				console.log('...save');
				let temp = new Jimp(width, height, function (err, img) {
					if (err) {
						console.log(' ** ERR:' + err);
						fun(err);
						return;
					}
					var pix = img.bitmap.data;
					for(var i=0; i<npixels; i++)
						pix[i] = pixels[i];
					img.rgba(true);
					img.write(blend.Output, function(err) {
						if(err) {
							console.log(' ** ERR:] + err');
							if(fun)
								fun(err);
							return;
						}
						if(fun)
							fun(err);
					});
				});
			}
		}
	}

	//-----------------------------------------------------Setup
	function Startx(com, fun) {
		console.log('--TextureFuser/Setup');
		var fs = require('fs');
		var Jimp = require('jimp');
		var Jpeg = require('jpeg-js');
		var texture = this.Nxs.getParameter('Target');
		var parts = texture.split('_');
		var alpha = parts[0] + '_alpha.jpg';
		var diffuse = parts[0] + '_diffuse.jpg';
		console.log('texture', texture);
		console.log('alpha', alpha);
		console.log('diffuse', diffuse);
		var raw = fs.readFileSync(texture);
		var txtr = Jpeg.decode(raw);
		console.log('txtr', txtr.width, txtr.height, txtr.data.length);
		var raw = fs.readFileSync(texture);
		var alph = Jpeg.decode(raw);
		console.log('alph', alph.width, alph.height, alph.data.length);
		var raw = fs.readFileSync(texture);
		var diff = Jpeg.decode(raw);
		console.log('diff', diff.width, diff.height, diff.data.length);

		let image = new Jimp(128, 128, function (err, img) {
			if (err) {
				console.log(' ** ERR:' + err);
				fun(err);
				return;
			}
			var clr = [0, 255, 0, 0];
			var clr1 = rgbaToHex(0, 255, 0, 255);
			var clr2 = rgbaToHex(0, 255, 0, 0);
			img.rgba(true);
			for (x = 0; x < 128; x++) {
				for (y = 0; y < 125; y++) {
					if (x % 16 < 8 && y % 15 < 8)
						img.setPixelColor(clr1, x, y);
					else
						img.setPixelColor(clr2, x, y);
				}
			}
			img.write('test.png', pau);

			function pau(err) {
				if (err) {
					console.log(' ** ERR:' + err);
					fun(err);
					return;
				}
				fun();
			}
		});
	}

})();
