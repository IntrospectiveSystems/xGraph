//# sourceURL=Controller.js
//jshint esversion: 6
(function Controller() {

	let fs, path;

	class Controller {
		Start(com, fun) {
			fs = this.require('fs');
			path = this.require('path');
			fun(null, com);
		}

		Register(com, fun){
			log.v("Browser has Registered");
			this.Vlt.Browser = com.Pid;
			fun();
			log.v("Returned Fun from register");
			
			//add some objects to the world
			let q = {}, obj;
			q.Cmd = "SetObjects";
			q.Forward = this.Vlt.Browser;
			q.Objects = [];
			//add 10 ellipsoids with random location and scales
			for (let idx = 0; idx < 10; idx++) {
				obj = {
					id: idx,
					geometry: {
						id: "geom",
						name: "SphereGeometry",
						arguments: [1, 64, 64]
					},
					mesh: {
						id: "mesh",
						name: "MeshPhongMaterial",
						arguments: {
							color: 0xFFFFFF * Math.random()
						}
					},
					position: {
						x: 100 * Math.random(),
						y: 100 * Math.random(),
						z: 100 * Math.random()
					},
					scale: {
						x: 10 * Math.random(),
						y: 10 * Math.random(),
						z: 10 * Math.random()
					}
				};
				q.Objects.push(obj);
			}
			//add a plane

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
			//debugger;
			
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