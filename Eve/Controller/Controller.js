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
			let q = {};
			var obj = [];
			q.Cmd = "SetObjects";
			q.Forward = this.Vlt.Browser;
			q.Objects = [];
			obj = {
				id: "plane",
				geometry: {
					id: "PlaneGeom",
					name: "PlaneGeometry",
					arguments: [100, 100, 99, 99]
				},
				mesh: {
					id: "planeMesh",
					name: "MeshPhongMaterial",
					arguments: {
						color: 0x333333
					}
				},
				position: {
					x: 50,
					y: 50,
					z: 0
				}, 
				elevations:[]
			};
			q.Objects.push(obj);
			// add a module
			obj = {
				id: "module",
				module: "xGraph:Scene/Modelx3D",
				parentId: "plane",
				position: {
					x: 0,
					y: 0,
					z: 0
				},
				model: "Geo.101Plants.Cactus3",
				axis: [0, 0, 1],
				angle: 0
			};
			q.Objects.push(obj);

			this.send(q, this.Par.Server, _ =>
				//callback
				console.log("we sent the objects to be added to the scene")
			);
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