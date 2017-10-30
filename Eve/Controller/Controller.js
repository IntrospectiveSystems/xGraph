//# sourceURL=Controller.js
//jshint esversion: 6
(function Controller() {
	let fs;
	let path;
	let async;

	class Controller {
		Start(com, fun) {
			fs = this.require('fs');
			path = this.require('path');
			async = this.require('async');
			var Vlt = this.Vlt;
			var Par = this.Par;
			Vlt.Model = {};
			//TBD: Load Eve.json here
			let mods = fs.readdirSync('cache');
			console.log('mods', mods);
			async.eachSeries(mods, function(mod, func) {
				console.log('=====Module:' + mod);
				var modpath = path.join('cache', mod, 'Module.json');
				console.log('modpath', modpath);
				var str = fs.readFileSync(modpath).toString();
				var obj = JSON.parse(str);
				var keys = Object.keys(obj);
				console.log('keys', keys);
				func();
			}, done);

			function done(err) {
				fun(null, com);
			}
		}

		Register(com, fun){
			console.log("Browser has Registered");
			this.Vlt.Browser = com.Pid;
			
			//add some objects to the world

			let board = {};
			board.Module = 'xGraph.Eve.Board';
			var par = {};
			par.Grid = [10, 8, 10];
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

			let geom = {};
			geom.Module = 'xGraph.Eve.Geometry';
			par = {};
			par.Color = 0xFF0000;
			par.Type = 'Cylinder';
			par.Args = [1, 1, 2, 32];
			geom.Par = par;

			unit = {};
			unit.Mod = geom;
			unit.Parent = 'Board';
			unit.Name = 'Artichoke.Mode';
			unit.Title = 'Unicorn.Party';
			q.Cmd = "AddUnit";
			q.Forward = this.Vlt.Browser;
			q.Unit = unit;
			this.send(q, this.Par.Server, function(err, r) {
				console.log("we sent the objects to be added to the scene")
			});
			if(fun)
				fun(null, com);
		}

		SaveImage(com, fun){
			let renderFolder = path.join(process.cwd(), 'renders');
			console.log("Saving image to", renderFolder);
			if (!fs.existsSync(renderFolder)) fs.mkdirSync(renderFolder);
			let imagepath = path.join(renderFolder, com.Name + '.png');
			fs.writeFile(imagepath, new Buffer(com.Image.split(',')[1], 'base64'), (err) => {
				if (fun)
					fun(err, com);
			});
			
		}
		
	}

	return {
		dispatch: Controller.prototype
	};

})();