(function Viewer() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		SetPosition: SetPosition,
		'*':Relay
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--View/Setup');
		var that = this;
		var Vlt = this.Vlt;
		var Par = this.Par;
//		var div = document.getElementById(Par.Div);
		var div = document.createElement('div');
		div.id = Par.Div;
		div.style.height = '100%';
		document.getElementsByTagName('body')[0].appendChild(div);
		var Vew = {};
		$('#'+Par.Div).data('View', Vew);
//		__Share[Par.Div] = Vew;
		Vew.Inst = {};
		Vew.Render = new THREE.WebGLRenderer({antialias: true});
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

		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--View/Start');
		var that = this;
		var Par = this.Par;
		var Vew = $('#'+Par.Div).data('View');
		var q = {};
		q.Cmd = 'GetGraph';
		this.send(q, Par.Scene, scene);

		function scene(err, q) {
			console.log('..View/scene');
			console.log(JSON.stringify(q.Graph, null, 2));
			if(err) {
				console.log(' ** ERR:' + err);
				if (fun)
					fun(err);
				return;
			}
			var root = new THREE.Object3D();
			var tree = q.Graph; // Array of instances
			async.eachSeries(tree, instance, subscribe);

			function instance(inst, func) {
				if(!('Model' in inst)) {
					if(fun)
						fun();
					return;
				}
				var q = {};
				q.Cmd = 'GetModel';
				q.Instance = inst.Instance;
				// TBD: Need to change to route through Scene
				that.send(q, Par.Scene, reply);

				function reply(err, r) {
				//	console.log('..reply', r);
					var type = r.Model.Type;
					if(!(type in Par.Gen)) {
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
						if(err) {
							func(err);
							return;
						}
						if(!('Obj3D' in x)) {
							var err = 'No model returned';
							console.log(' ** ERR:' + err);
							func(err);
							return;
						}
						var objinst = new THREE.Object3D();
						if('Position' in inst) {
							var pos = inst.Position;
							objinst.position.x = pos[0];
							objinst.position.y = pos[1];
							objinst.position.z = pos[2];
						}
						if('Axis' in inst && 'Angle' in inst) {
							var axis = inst.Axis;
							var ang = inst.Angle*Math.PI/180.0;
							var vec = new THREE.Vector3(axis[0], axis[1], axis[2]);
							objinst.setRotationFromAxisAngle(vec, ang);
						}
						var data = {};
						if('Role' in inst)
							data.Role = inst.Role;
						else
							data.Role = 'Fixed';
						data.Pid = inst.Instance;
						objinst.userData = data;
						objinst.add(x.Obj3D);
						Vew.Scene.add(objinst);
						Vew.Inst[inst.Instance] = objinst;
						if('Inst' in inst) {
							async.eachSeries(inst.Inst, instance, func);
						} else {
							func();
						}
					}
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
				if(fun)
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

	}

	//-------------------------------------------------SetPosition
	function SetPosition(com, fun) {
	//	console.log('--SetPositon');
		var Par = this.Par;
		var Vew = $('#'+Par.Div).data('View');
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

