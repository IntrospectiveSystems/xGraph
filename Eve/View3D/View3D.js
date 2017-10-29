//# sourceURL=View3D
(function _View3D() {

	//-----------------------------------------------------dispatch
	let dispatch = {
		Setup,
		Start,
		AddUnit,
		ImageCapture,
		Resize,
		Render,
		DOMLoaded,
		Cleanup,
		DispatchEvent,
		EvokeExample
	};

	return Viewify(dispatch, "3.1");

	function Setup(com, fun) {
		this.super(com, (err, cmd) => {
			console.log('--3DView/Setup');
			let div = this.Vlt.div;
			this.Vlt.View = {};
			View = this.Vlt.View;
			View.Geometries = {};
			View.Meshs = {};
			View.ResponseHandlers = {};
			View.Ray = new THREE.Raycaster();
			View.Renderer = new THREE.WebGLRenderer({ antialias: true });
			View.Renderer.setClearColor(0xBEDCF7, 1);
			View.Renderer.setSize(div.width(), div.height());
			View.Scene = new THREE.Scene();
			View.Focus = new THREE.Vector3(0.0, 0.0, 0.0);
			View.Camera = new THREE.PerspectiveCamera(45,
				div.width / div.height, 0.1, 40000);
			div.append(View.Renderer.domElement);
			View.Light = new THREE.DirectionalLight(0xFFFFFF);
			View.Light.position.set(-40, 60, 100);
			View.Scene.add(View.Light);
			View.Ambient = new THREE.AmbientLight(0x808080);
			View.Scene.add(View.Ambient);
			var axes = new THREE.AxisHelper(100);
			axes.position.z = 0.01;
			View.Scene.add(axes);
			var root = new THREE.Object3D();
			root.name = 'Root';
			View.Scene.add(root);
			View.Camera.position.x = 50;
			View.Camera.position.y = 50;
			View.Camera.position.z = 50;
			View.Camera.up.set(0.0, 0.0, 1.0);
			View.Camera.lookAt(View.Focus);
			View.Camera.updateProjectionMatrix();
			View.RenderLoop = setInterval(_ => {
				View.Renderer.render(View.Scene, View.Camera);
			}, 20);
			fun(null, com);
		});
	}

	function Start(com, fun) {
		console.log('--3DView/Start');
		if ("Controller" in this.Par) {
			this.send({ Cmd: "Register", Pid: this.Par.Pid }, this.Par.Controller, (err, com) => {
				console.log("Registered with Controller");
			});
		}
		fun(null, com);
	}

	function EvokeExample(com, fun) {
		console.log("EVOKE EXAMPLE", com.id);
		console.log("Popup");
		this.genModule({
			"Module": "xGraph:Widgets/Popup",
			"Par": {
				Left: com.mouse.x,
				Top: com.mouse.y,
				"View": "xGraph:Widgets/3DView",
				"Width": 800,
				"Height": 600
			}
		}, () => { })
		if (fun)
			fun(null, com)
	}

	function DOMLoaded(com, fun) {
		console.log("--3DView/DOMLoaded");
		this.super(com, fun);
		let div = this.Vlt.div;
		div.append(this.Vlt.View.Renderer.domElement);
		let View = this.Vlt.View;
		View.Renderer.setSize(div.width(), div.height());
		View.Camera.aspect = div.width() / div.height();
		View.Camera.updateProjectionMatrix();
		var nav = {};
		nav.Module = this.Par.Navigation;
		nav.Par = {};
		nav.Par.Handler = this.Par.Pid;
		console.log('nav', nav);
		this.genModule(nav, (err, pidApex) => {
			this.send({
				Cmd: "SetDomElement",
				"DomElement": this.Vlt.div
			}, pidApex, (err, cmd) => {
				console.log("GenModed the Mouse and set the DomElement");
				//fun(null, com);
			});
		});
	}

	function Cleanup(com, fun) {
		console.log("--3DView/Cleanup", this.Par.Pid.substr(30));
		clearInterval(this.Vlt.View.RenderLoop);
		if (fun)
			fun(null, com);
	}

	function Render(com, fun) {
		console.log("--3DView/Render", this.Par.Pid.substr(30));
		this.Vlt.div.append(this.Vlt.View.Renderer.domElement);
		this.super(com, fun);
	}


	function Resize(com, fun) {
		//console.log("--3DView/Resize")
		this.super(com, (err, cmd) => {
			let View = this.Vlt.View;
			View.Renderer.setSize(cmd.width, cmd.height);
			View.Camera.aspect = cmd.width / cmd.height;
			View.Camera.updateProjectionMatrix();
			fun(null, com);
		});
	}

	function AddUnit(com, fun) {
		console.log('--------------------------');
		console.log('AddUnit', com);
		var that = this;
		var unit = com.Unit;
		var Vlt = this.Vlt;
		this.genModule(unit.Mod, genmodel);

		function genmodel(err, pid) {
			if(err) {
				console.log(' ** ERR:' + err);
				if(fun)
					fun(err);
				return;
			}
			var q = {};
			q.Cmd = 'GenModel';
			that.send(q, pid, function(err, r) {
				if(err) {
					console.log(' ** ERR:' + err);
					if(fun)
						fun(err);
					return;
				}
				var obj3d = r.Obj3D;
				obj3d.name = com.Name;
				var parent = Vlt.View.Scene.getObjectByName(unit.Parent);
				if(parent)
					parent.add(obj3d);
				else
					console.log(' ** ERR:Cannot find parent', unit.Parent);
				if(fun)
					fun(null, com);
			});
		}
	}

	function ImageCapture(com, fun) {
		if (this.Vlt.Count)
			this.Vlt.Count++
		else
			this.Vlt.Count = 1;
		View.Renderer.render(View.Scene, View.Camera);
		let b64 = this.Vlt.View.Renderer.domElement.toDataURL();
		com.Image = b64;
		com.Name = this.Vlt.Count;
		if ("Controller" in this.Par) {
			com.Cmd = "SaveImage";
			this.send(com, this.Par.Controller);
		}
		fun(null, com);
	}


	//-----------------------------------------------------Dispatch
	function DispatchEvent(com) {
		let info = com.info;
		let Vlt = this.Vlt;
		Vlt.Mouse = com.mouse;
		// console.log(this.Par.Pid.substr(30));
		var dispatch;
		if ('Dispatch' in Vlt) {
			dispatch = Vlt.Dispatch;
		} else {
			//console.log('Harvesting for dispatch');
			Vlt.Dispatch = {};
			dispatch = Vlt.Dispatch;

			//harvest(Select);
			harvest(Rotate);
			harvest(Zoom);
			harvest(Keyed);
		}
		var key = Vlt.Mouse.Mode + '.' + info.Action;
		if (info.Action == 'LeftMouseDown') {
			info = mouseRay(info, Vlt);
			if (info.obj.responseHandler) {
				let disp = {};
				disp.Cmd = info.obj.responseHandler.Cmd;
				disp.id = info.Obj.id;
				disp.point = info.point;
				disp.mouse = info.Mouse;
				this.send(disp, info.obj.responseHandler.Handler, _ => {
					console.log("Evoke example callback")
				});
			}
			return;
		}
		if ('Type' in info)
			key += '.' + info.Type;
		if ('CharKey' in info)
			key += '.' + info.CharKey;
		info.Key = key;
		//console.log(this.Par.View, 'Dispatch', key);
		if (key in dispatch) {
			var proc = dispatch[key];
			proc(info, Vlt);
		}

		function harvest(proc) {
			var q = {};
			q.Action = 'Harvest';
			q.Keys = [];
			proc(q, Vlt);
			for (var i = 0; i < q.Keys.length; i++) {
				var key = q.Keys[i];
				dispatch[key] = proc;
				//	console.log('key', key);
			}
		}
	}

	//-----------------------------------------------------mouseRay
	function mouseRay(info, Vlt) {
		//var info = {};
		//console.log(info.Mouse)
		let View = Vlt.View;
		View.Ray.precision = 0.00001;
		container = Vlt.div;
		var w = container.width();
		var h = container.height() - 2 * container.offset().top;
		var vec = new THREE.Vector2();
		vec.x = 2 * (info.Mouse.x - container.offset().left) / w - 1;
		vec.y = 1 - 2 * (info.Mouse.y - container.offset().top) / h;
		// console.log(vec);
		View.Ray.setFromCamera(vec, View.Camera);
		var hits = View.Ray.intersectObjects(View.Scene.children, true);
		var hit;
		var obj;
		console.log('Hits length is', hits);
		for (var i = 0; i < hits.length; i++) {
			hit = hits[i];
			obj = hit.object;
			var pt;
			if (obj != null && obj.name) {
				//console.log('hit', hit);
				//console.log('mouseRay', data);
				// debugger;
				info.obj = {};
				info.obj.id = obj.name
				info.obj.responseHandler = Vlt.View.ResponseHandlers[info.obj.id] || undefined;
				info.point = hit.point;
				return info
			}
		}
		return info;
	}


	// //-----------------------------------------------------Select
	// // Move/Rotate model object in construction phase
	// // TBD: Remove Three.js dependancy
	// function Select(info, Vlt) {
	// 	var dispatch = {
	// 		'Idle.LeftMouseDown.Artifact': start,
	// 		'Select1.Move.Artifact': move,
	// 		'Select1.Move.Terrain': move,
	// 		'Select1.LeftMouseUp': mouseup,
	// 		'Select2.Move.Artifact': move,
	// 		'Select2.Move.Terrain': move,
	// 		'Select2.Wheel': spin,
	// 		'Select2.LeftMouseDown.Terrain': stop,
	// 		'Select2.LeftMouseDown.Artifact': stop
	// 	}
	// 	if (info.Action == 'Harvest') {
	// 		for (key in dispatch)
	// 			info.Keys.push(key);
	// 		return;
	// 	}

	// 	let View = Vlt.View;
	// 	if (info.Key in dispatch)
	// 		dispatch[info.Key]();

	// 	function start() {
	// 		//console.log('..select/start', info);
	// 		var mouse = View.Mouse;
	// 		mouse.Mode = 'Select1';
	// 		mouse.x = info.Mouse.x;
	// 		mouse.y = info.Mouse.y;
	// 		View.pidSelect = info.Pid;
	// 	}

	// 	function mouseup() {
	// 		var mouse = Vew.Mouse;
	// 		mouse.Mode = 'Select2';
	// 	}

	// 	function spin() {
	// 		var q = {};
	// 		q.Cmd = 'Move';
	// 		q.Instance = Vew.pidSelect;
	// 		q.Spin = 6.0*info.Factor;
	// 		that.send(q, Par.View);
	// 	}

	// 	function move() {
	// 	//	console.log('..move', info);
	// 		if (!('Point' in info))
	// 			return;
	// 		var q = {};
	// 		q.Cmd = 'Move';
	// 		q.Instance = Vew.pidSelect;
	// 		var loc = [];
	// 		loc.push(info.Point.x);
	// 		loc.push(info.Point.y);
	// 		loc.push(info.Point.z);
	// 		q.Loc = loc;
	// 		that.send(q, Par.View);
	// 	}

	// 	function stop() {
	// 		View.Mouse.Mode = 'Idle';
	// 		var q = {};
	// 		q.Cmd = 'Save';
	// 		q.Instance = View.pidSelect;
	// 		that.send(q, Par.View);
	// 	}
	// }


	//-----------------------------------------------------Zoom
	// Move camera towards or away from Focus point
	// TBD: Remove Three.js dependancy
	function Zoom(info, Vlt) {
		if (info.Action == 'Harvest') {
			console.log('Harvest-Zoom');
			info.Keys.push('Idle.Wheel');
			return;
		}
		//console.log("Zooooooming");
		let View = Vlt.View;

		var v = new THREE.Vector3();
		v.fromArray(View.Camera.position.toArray());
		var vfoc = new THREE.Vector3();
		vfoc.fromArray(View.Focus.toArray());
		v.sub(vfoc);
		var fac;
		if (info.Factor > 0)
			fac = 0.95 * info.Factor;
		else
			fac = -1.05 * info.Factor;
		v.multiplyScalar(fac);
		var vcam = vfoc.clone();
		vcam.add(v);
		View.Camera.position.fromArray(vcam.toArray());
		View.Camera.lookAt(View.Focus);
		View.Camera.updateProjectionMatrix();
	}


	//-----------------------------------------------------Keyed
	// keydown event
	// TBD: Remove Three.js dependancy
	function Keyed(info, Vlt) {
		if (info.Action == 'Harvest') {
			console.log('Harvest-Keyed');
			info.Keys.push('Idle.keydown.n');
			return;
		}
		Vlt.Update = true;
	}


	//-----------------------------------------------------Rotate
	// Rotate view about current Focus
	// TBD: Remove Three.js dependancy
	function Rotate(info, Vlt) {

		var dispatch = {
			// "Idle.LeftMouseDown":start,
			'Idle.RightMouseDown': start,
			'Rotate.Move': rotate,
			'Rotate.RightMouseUp': stop,
			//'Rotate.LeftMouseUp': stop,
			'Rotate.MouseLeave': stop
		}
		if (info.Action == 'Harvest') {
			for (key in dispatch)
				info.Keys.push(key);
			return;
		}

		let View = Vlt.View;

		if (info.Key in dispatch)
			dispatch[info.Key]();

		function start() {
			// console.log('..Rotate/start', info.Key);
			var mouse = Vlt.Mouse;
			mouse.Mode = 'Rotate';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function rotate() {
			// console.log('..Rotate/move', info.Key);
			var mouse = Vlt.Mouse;
			var vcam = new THREE.Vector3();
			vcam.fromArray(View.Camera.position.toArray());
			var vfoc = new THREE.Vector3();
			vfoc.fromArray(View.Focus.toArray());
			var v1 = new THREE.Vector3(0.0, 0.0, 1.0);
			var v2 = vcam.clone();
			v2.sub(vfoc);
			var v3 = new THREE.Vector3();
			v3.crossVectors(v1, v2);
			v3.normalize();
			var ang = 0.003 * (mouse.x - info.Mouse.x);
			v2.applyAxisAngle(v1, ang);
			ang = 0.003 * (mouse.y - info.Mouse.y);
			v2.applyAxisAngle(v3, ang);
			vcam.copy(vfoc);
			vcam.add(v2);
			View.Camera.position.fromArray(vcam.toArray());
			View.Camera.lookAt(View.Focus);
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function stop() {
			// console.log('..Rotate/stop', info.Key);
			//var Vlt = View;
			Vlt.Mouse.Mode = 'Idle';
		}
	}

})();

