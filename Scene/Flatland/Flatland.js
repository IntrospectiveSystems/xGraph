(function FlatLand() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		GetModel: GetModel
	};

	return {
		dispatch: dispatch
	};

	//-----------------------------------------------------Setup
	function Setup(com, fun) {
		console.log('--Flatland/Setup');
		var jszip = require("jszip");
		var text;
		var that = this;
		var Par = this.Par;
		var Vlt = this.Vlt;
		var w = 100;
		var h = 100;
		if ('Size' in Par) {
			var size = Par.Size;
			w = size[0];
			h = size[1];
		}
		var w2 = w / 2;
		var h2 = h / 2;
		var x3d = {};
		x3d.Name = 'Flatland';
		x3d.Root = [];
		var node = {};
		node.Name = 'NA';
		node.Hier = -1;
		node.Pivot = [0, 0, 0];
		var parts = [];
		var part = {};
		part.Diffuse = [255, 255, 255];
		var vrt = [];
		vrt.push(-w2, -h2, 0);
		vrt.push(w2, -h2, 0);
		vrt.push(w2, h2, 0);
		vrt.push(-w2, h2, 0);
		part.Vrt = vrt;
		if('Texture' in Par) {
			var sztext = [10, 10];
			if('TextureSize' in Par)
				sztext = Par.TextureSize;
			var file = Par.Texture;
			if('TextureSize' in Par)
				size = Par.TextureSize;
			var prts = file.split('/');
			text = prts[prts.length-1];
			part.Texture = text;
			var uv = [];
			var u = w / sztext[0];
			var v = h / sztext[1];
			uv.push(0, 0);
			uv.push(u, 0);
			uv.push(u, v);
			uv.push(0, v);
			part.UV = uv;
		}
		var idx = [];
		idx.push(0, 1, 2);
		idx.push(0, 2, 3);
		part.Idx = idx;
		parts.push(part);
		node.Parts = parts;
		x3d.Root.push(node);
		var jszip = require("jszip");
		var zip = new jszip();
		zip.file('Type', 'X3D');
		zip.file('X3D', JSON.stringify(x3d));
		if(text) {
			var path = Par.Texture;
			var dot = path.lastIndexOf('.');
			var suffix = path.substr(dot+1);
			var next;
			switch(suffix) {
				case 'png':
					fs.readFile(path, ping);
					break;
				case 'jpg':
					fs.readFile(path, jpeg);
					break;
				default:
					zipit();
					return;
			}
		} else {
			zipit();
		}

		function ping(err, data) {
			console.log('..add');
			if(data) {
				var str = data.toString('base64');
				zip.file(text, str);
			}
			zipit();
		}

		function jpeg(err, data) {
			console.log('..add');
			if(data) {
				var str = data.toString('base64');
				zip.file(text, str);
			}
			zipit();
		}

		function zipit() {
			zip.generateAsync({type:'base64'}).then(function(data) {
				//	test(data);
				Vlt.X3D = data;
				if(fun)
					fun();
			});
		}

		function test(data64) {
			console.log('..test');
			var zip2 = new jszip();
			console.log('A', data64.length);
			zip2.loadAsync(data64, {base64: true}).then(function(zip){
				console.log('B==========================================================');
				var dir = zip.file(/.*./);
				console.log('dir', dir);
			});
			console.log('C');
		}
	}

	//-----------------------------------------------------GetModel
	function Start(com, fun) {
		console.log('--Flatland/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------GetModel
	// Append model to scene graph
	function GetModel(com, fun) {
		console.log('--Flatland/GetModel');
		var Vlt = this.Vlt;
		if(!('X3D' in Vlt)) {
			var err = 'Model not available';
			console.log(' ** ERR:' + err);
			if(fun)
				fun(err);
			return;
		}
		com.Model = {};
		com.Model.Type = 'X3D';
		com.Model.X3D = Vlt.X3D;
		console.log('Flatland returns', com.Passport);
		if(fun)
			fun(null, com);
	}

})();
