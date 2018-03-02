//# sourceURL=HoloView/View3D
(function View3D() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		SetPosition: SetPosition,
		DOMLoaded: DOMLoaded,
		'*':Relay
	};

	return Viewify(dispatch);

	function Setup(com, fun) {
		this.super(com, (err, cmd) => {
			console.log('--View3D/Setup');
			var that = this;
			var Vlt = this.Vlt;
			var Par = this.Par;

			var div = this.Vlt.div[0];
			
			this.Vlt.View = {};

			var Vew = this.Vlt.View;

			Vew.Inst = {};
			Vew.Render = new THREE.WebGLRenderer({ antialias: true });
			Vew.Render.setClearColor(0xBEDCF7, 1);
			Vew.Render.setSize(div.scrollWidth, div.scrollHeight);
			Vew.Scene = new THREE.Scene();
			Vew.Focus = new THREE.Vector3(0.0, 0.0, 0.0);
			Vew.Camera = new THREE.PerspectiveCamera(45,
				div.scrollWidth / div.scrollHeight, 0.1, 40000);
			div.appendChild(Vew.Render.domElement);
			Vew.Light = new THREE.DirectionalLight(0xFFFFFF);
			Vew.Light.position.set(-40, 60, 100);
			Vew.Scene.add(Vew.Light);
			Vew.Ambient = new THREE.AmbientLight(0x808080);
			Vew.Scene.add(Vew.Ambient);
			var axes = new THREE.AxisHelper(100);
			axes.position.z = 0.01;
			Vew.Scene.add(axes);
			Vew.Camera.position.x = -7;
			Vew.Camera.position.y = -20.0;
			Vew.Camera.position.z = 20.0;
			Vew.Camera.up.set(0.0, 0.0, 1.0);
			Vew.Camera.lookAt(Vew.Focus);
			Vew.Camera.updateProjectionMatrix();
			TestFont(that, Vew, "Hello World");

			if (fun)
				fun();
		});
	}

	function DOMLoaded(com, fun) {
		this.Vlt.div.on("keydown", "canvas", (function(evt) {
			console.log("Keydown event", evt.code)
			switch(evt.code) {
				case 'F2':
					console.log("Popup");
					that.genModule({
						"Module": "xGraph.Popup",
						"Par": {
							"View": "xGraph:Widgets/AceEditorView",
							"Width": 400,
							"Height" : 300
						}
					}, ()=>{})
				default:
			}
		}));
		let Vew = this.Vlt.View;
		Vew.Render.setSize(this.Vlt.div[0].scrollWidth, this.Vlt.div[0].scrollHeight);
		Vew.Camera.aspect = this.Vlt.div[0].scrollWidth / this.Vlt.div[0].scrollHeight
		Vew.Camera.updateProjectionMatrix();

		this.super(com, fun);
	}

	function Start(com, fun) {
		this.super(com, (err, cmd) => {

			console.log('--View3D/Start');
			var that = this;
			var Par = this.Par;
			var Vew = this.Vlt.View;
			var Inst;
			var Terrain;
			var q = {};
			q.Cmd = 'GetGraph';
			this.send(q, Par.Scene, scene);

			function scene(err, r) {
				console.log('..View3D/scene');
				Terrain = r.Terrain;
				Inst = r.Inst;
				//	console.log(JSON.stringify(q.Graph, null, 2));
				console.log('Terrain', JSON.stringify(Terrain, null, 2));
				console.log('Knst', JSON.stringify(Inst, null, 2));
				if (err) {
					console.log(' ** ERR:' + err);
					if (fun)
						fun(err);
					return;
				}
				var root = new THREE.Object3D();
				var pidmod = Terrain.Instance;
				var q = {};
				q.Cmd = 'GetModel';
				q.Instance = pidmod;
				that.send(q, Par.Scene, terra);

				function terra(err, r) {
					genmod(Terrain, r, function (err) {
						async.eachSeries(Inst, instance, subscribe);
					});
				}

				function instance(inst, func) {
					var q = {};
					q.Cmd = 'GetModel';
					q.Instance = inst.Instance;
					//debugger;
					that.send(q, Par.Scene, rply);

					function rply(err, r) {
						genmod(inst, r, func);
					}
				}

				function genmod(inst, r, func) {
					var type = r.Model.Type;
					if (!(type in Par.Gen)) {
						var err = 'No translation for type ' + type;
						console.log(' ** ERR:' + err);
						func(err);
						return;
					}
					var gen = {};
					gen.Cmd = 'GenModel';
					gen.Model = r.Model.X3D;
					that.send(gen, Par.Gen[type], back);

					function back(err, x) {
						if (err) {
							func(err);
							return;
						}
						if (!('Obj3D' in x)) {
							var err = 'No model returned';
							console.log(' ** ERR:' + err);
							func(err);
							return;
						}
						var objinst = new THREE.Object3D();
						if ('Position' in inst) {
							var pos = inst.Position;
							objinst.position.x = pos[0];
							objinst.position.y = pos[1];
							objinst.position.z = pos[2];
						}
						if ('Axis' in inst && 'Angle' in inst) {
							var axis = inst.Axis;
							var ang = inst.Angle * Math.PI / 180.0;
							var vec = new THREE.Vector3(axis[0], axis[1], axis[2]);
							objinst.setRotationFromAxisAngle(vec, ang);
						}
						var data = {};
						if ('Role' in inst)
							data.Role = inst.Role;
						else
							data.Role = 'Fixed';
						data.Pid = inst.Instance;
						objinst.userData = data;
						objinst.add(x.Obj3D);
						Vew.Scene.add(objinst);
						func();
					}
				}

				// Request scen to stream commands
				function subscribe() {
					var q = {};
					q.Cmd = 'Subscribe';
					q.Pid = Par.Pid;
					that.send(q, Par.Scene);
					render();
				}

				function render() {
					renderLoop();
					if (fun)
						fun();
				}
			}

			//-----------------------------------------------------Render
			function renderLoop() {
				loop();

				function loop() {
					Vew.Render.render(Vew.Scene, Vew.Camera);
					requestAnimationFrame(loop);
				}
			}
		});
	}

	function TestFont(context, vew, text) {
		console.log('--TestFont');
		var font = context.getFont('Helvetiker.Bold');
		var mesh;
		var size = 0.5;
		var height = 0.25 * size;
		var clr = 0x00ff00;
		var geo = new THREE.TextGeometry(text, {
			font: font,
			size: size,
			height: height
		});
		geo.computeBoundingBox();
		geo.computeVertexNormals();
		var mat = new THREE.MeshPhongMaterial({ color: clr, shading: THREE.FlatShading });
		mesh = new THREE.Mesh(geo, mat);
		var box = geo.boundingBox;
		mesh.position.x = -0.5 * (box.max.x - box.min.x);
		mesh.position.y = -0.5 * (box.max.y - box.min.y);
		mesh.position.z = -0.5 * (box.max.z - box.min.z) + 5.0;
		vew.Scene.add(mesh);
	}

	// function Startx(com, fun) {
	// 	console.log('--View3D/Start');
	// 	var that = this;
	// 	var Par = this.Par;
	// 	var Vew = this.Vlt.div.data('View');
	// 	var q = {};
	// 	q.Cmd = 'GetGraph';
	// 	this.send(q, Par.Scene, scene);

	// 	function scene(err, q) {
	// 		console.log('..View3D/scene');
	// 	//	console.log(JSON.stringify(q.Graph, null, 2));
	// 		console.log(JSON.stringify(q, null, 2));
	// 		if(err) {
	// 			console.log(' ** ERR:' + err);
	// 			if (fun)
	// 				fun(err);
	// 			return;
	// 		}
	// 		var root = new THREE.Object3D();
	// 		var tree = q.Graph; // Array of instances
	// 		async.eachSeries(tree, instance, subscribe);

	// 		function instance(inst, func) {
	// 			console.log('..instance', inst);
	// 			if(!('Model' in inst)) {
	// 				if(fun)
	// 					fun();
	// 				return;
	// 			}
	// 			var q = {};
	// 			q.Cmd = 'GetModel';
	// 			q.Instance = inst.Instance;
	// 			console.log('Sending', q);
	// 			// TBD: Need to change to route through Scene
	// 			that.send(q, Par.Scene, reply);

	// 			function reply(err, r) {
	// 			//	console.log('..reply', r);
	// 				var type = r.Model.Type;
	// 				if(!(type in Par.Gen)) {
	// 					var err = 'No translation for type ' + type;
	// 					console.log(' ** ERR:' + err);
	// 					func(err);
	// 					return;
	// 				}
	// 				var gen = {};
	// 				gen.Cmd = 'GenModel';
	// 				gen.Model = r.Model.X3D;
	// 				that.send(gen, Par.Gen[type], back);

	// 				function back(err, x) {
	// 					if(err) {
	// 						func(err);
	// 						return;
	// 					}
	// 					if(!('Obj3D' in x)) {
	// 						var err = 'No model returned';
	// 						console.log(' ** ERR:' + err);
	// 						func(err);
	// 						return;
	// 					}
	// 					var objinst = new THREE.Object3D();
	// 					if('Position' in inst) {
	// 						var pos = inst.Position;
	// 						objinst.position.x = pos[0];
	// 						objinst.position.y = pos[1];
	// 						objinst.position.z = pos[2];
	// 					}
	// 					if('Axis' in inst && 'Angle' in inst) {
	// 						var axis = inst.Axis;
	// 						var ang = inst.Angle*Math.PI/180.0;
	// 						var vec = new THREE.Vector3(axis[0], axis[1], axis[2]);
	// 						objinst.setRotationFromAxisAngle(vec, ang);
	// 					}
	// 					var data = {};
	// 					if('Role' in inst)
	// 						data.Role = inst.Role;
	// 					else
	// 						data.Role = 'Fixed';
	// 					data.Pid = inst.Instance;
	// 					objinst.userData = data;
	// 					objinst.add(x.Obj3D);
	// 					Vew.Scene.add(objinst);
	// 					Vew.Inst[inst.Instance] = objinst;
	// 					if('Inst' in inst) {
	// 						async.eachSeries(inst.Inst, instance, func);
	// 					} else {
	// 						func();
	// 					}
	// 				}
	// 			}
	// 		}

	// 		// Request scen to stream commands
	// 		function subscribe() {
	// 			var q = {};
	// 			q.Cmd = 'Subscribe';
	// 			q.Pid = Par.Pid;
	// 			that.send(q, Par.Scene);
	// 			render();
	// 		}

	// 		function render() {
	// 			renderLoop();
	// 			if(fun)
	// 				fun();
	// 		}
	// 	}

	// 	//-----------------------------------------------------Render
	// 	function renderLoop() {
	// 		loop();

	// 		function loop() {
	// 			Vew.Render.render(Vew.Scene, Vew.Camera);
	// 			requestAnimationFrame(loop);
	// 		}
	// 	}

	// }

	//-------------------------------------------------SetPosition
	function SetPosition(com, fun) {
	//	console.log('--SetPositon');
		var Par = this.Par;
		var Vew = this.Vlt.View;
		obj3d = Vew.Inst[com.Instance];
		if('Instance' in com) {
			if(obj3d) {
				if('Position' in com) {
					var pos = com.Position;
					obj3d.position.x = pos[0];
					obj3d.position.y = pos[1];
					obj3d.position.z = pos[2];
				}
				if('Axis' in com && 'Angle' in com) {
					var axis = new THREE.Vector3(...com.Axis);
					var angle = Math.PI*com.Angle/180.0;
					obj3d.setRotationFromAxisAngle(axis, angle);
				}
			}
		}
		if(fun)
			fun(null, com);
	}

	//-------------------------------------------------Relay
	// Relay simply sends everyting else to its vertualization
	// of a Scene on the server.
	function Relay(com, fun) {
	//	console.log('--View.Relay', com);
		this.send(com, this.Par.Scene);
		if(fun)
			fun(null, com);
	}

})();

