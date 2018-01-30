//# sourceURL=Controller.js
//jshint esversion: 6
(function Controller() {
	let fs;
	let path;
	let async;

	//-----------------------------------------------------dispatch
	var dispatch = {
		Start: Start,
		Register: Register,
		SaveImage: SaveImage
	};

	return {
		dispatch: dispatch
	};

	function Start(com, fun) {
		fs = this.require('fs');
		path = this.require('path');
		async = this.require('async');
		var Vlt = this.Vlt;
		var Par = this.Par;
		Vlt.Model = {};
		var modules = {};
		//TBD: Load Eve.json here
		let mods = fs.readdirSync('cache');
		console.log('mods', mods);
		async.eachSeries(mods, function(mod, func) {
			console.log('=====Module:' + mod);
			modules[mod] = {};
			var modpath = path.join('cache', mod, 'Module.json');
			console.log('modpath', modpath);
			var str = fs.readFileSync(modpath).toString();
			var obj = JSON.parse(str);
			var keys = Object.keys(obj);
			console.log('keys', keys);
			func();
		}, done);

		function done(err) {
			Vlt.Model.Modules = modules;
			fun(null, com);
		}
	}

	function Register(com, fun){
		console.log("Browser has Registered");
		var Vlt = this.Vlt;
		Vlt.Browser = com.Pid;

		//add some objects to the world

		let board = {};
		board.Module = 'xGraph.Eve.Board';
		var par = {};
		par.Grid = [50, 50, 10];
		par.Color = 0xFFC87C; // Topaz
		par.Color = 0xBC987E; // Taupe
		par.Color = 0x9C7C38; // Metallic sunbusrt
		par.Color = 0xE5AA70; // Fawn
		par.Color = 0xC19A6B; // Desert
		par.Color = 0xDEB887; // Burlywood
		par.Color = 0xA0785A; // Chamoisee
		board.Par = par;

		var unit = {};
		unit.Mod = board;
		unit.Parent = 'Root';
		unit.Name = 'Board';

		let q = {};
		q.Cmd = "AddUnit";
		q.Forward = this.Vlt.Browser;
		q.Unit = unit;
		this.send(q, this.Par.Server, function(err, r) {
			console.log("we sent the objects to be added to the scene")
		});

		var Model = Vlt.Model;
		var mods = Object.keys(Model.Modules);
		ix = -10*Math.floor(mods.length/2);
		for(var i=0; i<mods.length; i++) {
			let geom = {};
			geom.Module = 'xGraph.Eve.Geometry';
			par = {};
			par.Color = 0x8B4513;
			par.Type = 'Cylinder';
			par.Args = [1, 1, 2, 32];
			geom.Par = par;

			unit = {};
			unit.Mod = geom;
			unit.Parent = 'Board';
			unit.Name = 'Artichoke.Mode';
			unit.Title = mods[i];
			unit.Location = [ix, 0];
			ix += 10;
			q.Cmd = "AddUnit";
			q.Forward = this.Vlt.Browser;
			q.Unit = unit;
			this.send(q, this.Par.Server, function(err, r) {
				console.log("we sent the objects to be added to the scene")
			});
		}
		if(fun)
			fun(null, com);
	}

	function SaveImage(com, fun){
		let renderFolder = path.join(process.cwd(), 'renders');
		console.log("Saving image to", renderFolder);
		if (!fs.existsSync(renderFolder)) fs.mkdirSync(renderFolder);
		let imagepath = path.join(renderFolder, com.Name + '.png');
		fs.writeFile(imagepath, new Buffer(com.Image.split(',')[1], 'base64'), (err) => {
			if (fun)
				fun(err, com);
		});

	}
		
})();