//# sourceURL=ThreeJsView/ThreeJsView
(function ThreeJsView() {

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		SetPosition,
		Recolor,
		DOMLoaded,
		DispatchEvent
	};

	return Viewify(dispatch);

	function Setup(com, fun) {
		this.super(com, (err, cmd) => {
			console.log('--View3D/Setup');
			let div = this.Vlt.div;
			var View = {};
			this.Vlt.div.data('View', View);

			View.Ray = new THREE.Raycaster();
			View.Renderer = new THREE.WebGLRenderer({ antialias: true });
			//View.Render.setClearColor(0xBEDCF7, 1);
			View.Renderer.setSize(div.scrollWidth, div.scrollHeight);
			View.Scene = new THREE.Scene();
			View.Focus = new THREE.Vector3(0.0, 0.0, 0.0);
			View.Camera = new THREE.PerspectiveCamera(45,
				div.scrollWidth / div.scrollHeight, 0.1, 40000);
			div.append(View.Renderer.domElement);
			View.Light = new THREE.DirectionalLight(0xFFFFFF);
			View.Light.position.set(-40, 60, 100);
			View.Scene.add(View.Light);
			View.Ambient = new THREE.AmbientLight(0x808080);
			View.Scene.add(View.Ambient);
			//var axes = new THREE.AxisHelper(100);
			//axes.position.z = 0.01;
			//View.Scene.add(axes);
			View.Camera.position.x = 20;
			View.Camera.position.y = 1;
			View.Camera.position.z = 6;
			View.Camera.up.set(0.0, 0.0, 1.0);
			View.Camera.lookAt(View.Focus);
			View.Camera.updateProjectionMatrix();


			View.geometry = new THREE.SphereGeometry(0.1, 32, 32);
			if (!("materials" in View))
				View.materials = {};

				//debugger;

			this.send({ Cmd: "GetNetwork" }, this.Par.Server, (err, cmd) => {
				this.Vlt.Network = cmd.Network;
				let sphere, position, linkedNode, position2;

				let ids = Object.keys(this.Vlt.Network)
				for (let key in this.Vlt.Network) {
					if (!this.Vlt.Network.hasOwnProperty(key))
						continue;

					if (!(`material_${this.Vlt.Network[key].Color}` in View.materials))
						View.materials[`material_${this.Vlt.Network[key].Color}`] =
							new THREE.MeshPhongMaterial({ color: this.Vlt.Network[key].Color });

					sphere = new THREE.Mesh(View.geometry, View.materials[`material_${this.Vlt.Network[key].Color}`]);
					position = this.Vlt.Network[key].Position;
					sphere.name = key;
					sphere.position.x = position[0];
					sphere.position.y = position[1];
					sphere.position.z = position[2];

					View.Scene.add(sphere);

					let red = this.Vlt.Network[key].Color >>> 16 & 0xFFFFFF;
					let green = this.Vlt.Network[key].Color >>> 8 & 0xFFFF;
					let blue = this.Vlt.Network[key].Color & 0xff;

					let r = (0 <<  16) & 0xFF0000;
					let g = (green <<  8) & 0x00FF00;
					let b = (255        ) & 0x0000FF;

					let color = r+g+b;

					//we will now add the lines radiating from this sphere
					var material = new THREE.LineBasicMaterial({ 
						color: color , 
						linewidth: 2
					});
					var geometry = new THREE.Geometry();

					for (let i = 0; i < this.Vlt.Network[key].Connections.length; i++) {
						let key2 = this.Vlt.Network[key].Connections[i];
						if (key2==key)
							continue;
						linkedNode =  this.Vlt.Network[key2];
						position2 = linkedNode.Position;
						geometry.vertices.push(new THREE.Vector3(position[0], position[1], position[2]));
						geometry.vertices.push(new THREE.Vector3(position2[0], position2[1], position2[2]));

						var line = new THREE.Line(geometry, material);
						line.name = (key<key2?`link${key}_${key2}`: `link${key2}_${key}`);
						console.log(line.name);
						View.Scene.add(line);

					}


				}

				console.log(View)
			});

			let that = this;

			loop();
			fun(null, com);

			function loop() {
				//console.log(that.Vlt.Recolor);
				if (that.Vlt.Recolor){
					
					that.send(
						{Cmd:"Recolor"},
						that.Par.Pid
					);
					that.Vlt.Recolor  = false;
				}
				View.Renderer.render(View.Scene, View.Camera);
				requestAnimationFrame(loop);
			}
		});
	}

	function Start(com, fun) {
		console.log('--View3D/Start');

		this.genModule({
			"Module": 'Scrapyard:Modules/Mouse',
			"Par": {
				"Handler": this.Par.Pid
			}
		}, (err, pidApex) => {
			this.send({ Cmd: "SetDomElement", "DomElement": this.Vlt.div.data("View").Renderer.domElement }, pidApex, (err, cmd) => {
				console.log("GenModed the Mouse and set the DomElement");
				fun(null, com);
			});
		});
	}


	function DOMLoaded(com, fun) {
		this.super(com, (err, cmd) => {
			let View = this.Vlt.div.data('View');
			View.Renderer.setSize(this.Vlt.div[0].scrollWidth, this.Vlt.div[0].scrollHeight);
			View.Camera.aspect = this.Vlt.div[0].scrollWidth / this.Vlt.div[0].scrollHeight
			View.Camera.updateProjectionMatrix();
			fun(null, com);
		});
	}



	function Recolor(com, fun){
		console.log("Recolor");
		
		let View = this.Vlt.div.data("View");

		while (View.Scene.children.length>2){
			obj = View.Scene.children[View.Scene.children.length-1];
     		View.Scene.remove(obj);
		}
		
		this.send({ Cmd: "GetNetwork" }, this.Par.Server, (err, cmd) => {

				this.Vlt.Network = cmd.Network;
				let sphere, position, linkedNode, position2;

				let matKeys = Object.keys(View.materials);
				console.log(matKeys); 
				let ids = Object.keys(this.Vlt.Network)
				for (let key in this.Vlt.Network) {
					if (!this.Vlt.Network.hasOwnProperty(key))
						continue;

					
					let matindex = Math.floor(Math.random()*5);//matKeys.length);
					console.log(matindex);
					sphere = new THREE.Mesh(View.geometry, View.materials[matKeys[matindex]]);
					position = this.Vlt.Network[key].Position;
					sphere.name = key;
					sphere.position.x = position[0];
					sphere.position.y = position[1];
					sphere.position.z = position[2];

					View.Scene.add(sphere);

					let red = this.Vlt.Network[key].Color >>> 16 & 0xFFFFFF;
					let green = this.Vlt.Network[key].Color >>> 8 & 0xFFFF;
					let blue = this.Vlt.Network[key].Color & 0xff;

					let r = (255 <<  16) & 0xFF0000; //none
					let g = (255 <<  8) & 0x00FF00;//green
					let b = (255        ) & 0x0000FF;

					let color = r+g+b;

					//we will now add the lines radiating from this sphere
					var material = new THREE.LineBasicMaterial({ 
						color: color , 
						linewidth: 2
					});
					var geometry = new THREE.Geometry();

					for (let i = 0; i < this.Vlt.Network[key].Connections.length; i++) {
						let key2 = this.Vlt.Network[key].Connections[i];
						if (key2==key)
							continue;
						linkedNode =  this.Vlt.Network[key2];
						position2 = linkedNode.Position;
						geometry.vertices.push(new THREE.Vector3(position[0], position[1], position[2]));
						geometry.vertices.push(new THREE.Vector3(position2[0], position2[1], position2[2]));

						var line = new THREE.Line(geometry, material);
						line.name = (key<key2?`link${key}_${key2}`: `link${key2}_${key}`);
						console.log(line.name);
						View.Scene.add(line);

					}


				}

				//console.log(View)
			});

	}



	//-------------------------------------------------SetPosition
	function SetPosition(com, fun) {
		//	console.log('--SetPositon');
		var Par = this.Par;
		var View = this.Vlt.div.data('View');
		obj3d = View.Inst[com.Instance];
		if ('Instance' in com) {
			if (obj3d) {
				if ('Position' in com) {
					var pos = com.Position;
					obj3d.position.x = pos[0];
					obj3d.position.y = pos[1];
					obj3d.position.z = pos[2];
				}
				if ('Axis' in com && 'Angle' in com) {
					var axis = new THREE.Vector3(...com.Axis);
					var angle = Math.PI * com.Angle / 180.0;
					obj3d.setRotationFromAxisAngle(axis, angle);
				}
			}
		}
		if (fun)
			fun(null, com);
	}


	//-----------------------------------------------------Dispatch
	function DispatchEvent(com, fun) {
		console.log("--ThreeJsView/DispatchEvent", com.info.Action);
		let info = com.info;
		let Vlt = this.Vlt;
		Vlt.Mouse = com.mouse;

		var dispatch;
		if ('Dispatch' in Vlt) {
			dispatch = Vlt.Dispatch;
		} else {
			//console.log('Harvesting for dispatch');
			Vlt.Dispatch = {};
			dispatch = Vlt.Dispatch;
			//harvest(Translate);
			harvest(Rotate);
			harvest(Zoom);
			harvest(Keyed);
		}
		var key = Vlt.Mouse.Mode + '.' + info.Action;
		if (info.Action == 'LeftMouseDown')
			info = mouseRay(info, Vlt);
		if ('Type' in info)
			key += '.' + info.Type;
		if ('Key' in info)
			key += '.' + info.Key;
		info.Key = key;
		console.log('Dispatch', key);
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
	function mouseRay(info,Vlt) {
		//var info = {};
		console.log(info.Mouse)
		let View=Vlt.div.data("View");
		View.Ray.precision = 0.00001;
		container = Vlt.div[0];
		var w = container.clientWidth;
		var h = container.clientHeight - 2 * container.clientTop;
		var vec = new THREE.Vector2();
		vec.x = 2 * (info.Mouse.x - container.offsetLeft) / w - 1;
		vec.y = 1 - 2 * (info.Mouse.y - container.offsetTop) / h;
		View.Ray.setFromCamera(vec, View.Camera);
		var hits = View.Ray.intersectObjects(View.Scene.children, true);
		var hit;
		var obj;
		console.log('Hits length is', hits);
		for (var i = 0; i < hits.length; i++) {
			hit = hits[i];
			obj = hit.object;
			var pt;
			while (obj != null) {
				//console.log('hit', hit);
				//console.log('mouseRay', data);
				switch (obj.name) {
					case 'heatField':
						info.Type = 'heatField';
						info.Point = hit.point;
						break;
					case 'bugSystem':
						info.Type = 'bugSystem';
						info.Point = hit.point;
						break;
					default: 
						console.log(obj.name);
				}
				pt = hit.point;
				obj = obj.parent;
			}
		}
		return info;
	}


	//-----------------------------------------------------Select
	// Move/Rotate model object in construction phase
	// TBD: Remove Three.js dependancy
	function Select(info, Vlt) {
		var dispatch = {
			//'Idle.LeftMouseDown.Artifact': start,
			'Select1.Move.Artifact': move,
			'Select1.Move.Terrain': move,
			'Select1.LeftMouseUp': mouseup,
			'Select2.Move.Artifact': move,
			'Select2.Move.Terrain': move,
			'Select2.Wheel': spin,
			'Select2.LeftMouseDown.Terrain': stop,
			'Select2.LeftMouseDown.Artifact': stop
		}
		if (info.Action == 'Harvest') {
			for (key in dispatch)
				info.Keys.push(key);
			return;
		}

		let View = Vlt.div.data("View");
		if (info.Key in dispatch)
			dispatch[info.Key]();

		function start() {
			console.log('..select/start', info);
			var mouse = Vew.Mouse;
			mouse.Mode = 'Select1';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
			View.pidSelect = info.Pid;
		}

		// function mouseup() {
		// 	var mouse = Vew.Mouse;
		// 	mouse.Mode = 'Select2';
		// }

		// function spin() {
		// 	var q = {};
		// 	q.Cmd = 'Move';
		// 	q.Instance = Vew.pidSelect;
		// 	q.Spin = 6.0*info.Factor;
		// 	that.send(q, Par.View);
		// }

		// function move() {
		// //	console.log('..move', info);
		// 	if (!('Point' in info))
		// 		return;
		// 	var q = {};
		// 	q.Cmd = 'Move';
		// 	q.Instance = Vew.pidSelect;
		// 	var loc = [];
		// 	loc.push(info.Point.x);
		// 	loc.push(info.Point.y);
		// 	loc.push(info.Point.z);
		// 	q.Loc = loc;
		// 	that.send(q, Par.View);
		// }

		function stop() {
			Vew.Mouse.Mode = 'Idle';
			var q = {};
			q.Cmd = 'Save';
			q.Instance = Vew.pidSelect;
			that.send(q, Par.View);
		}
	}


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
		let View = Vlt.div.data('View');

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


	//-----------------------------------------------------Zoom
	// Move camera towards or away from Focus point
	// TBD: Remove Three.js dependancy
	function Keyed(info, Vlt) {
		if (info.Action == 'Harvest') {
			console.log('Harvest-Zoom');
			info.Keys.push('Idle.keydown.n');
			return;
		}
		//console.log("Zooooooming");
		let View = Vlt.div.data('View');

		Vlt.Recolor=true;

	}


	//-----------------------------------------------------Rotate
	// Rotate view about current Focus
	// TBD: Remove Three.js dependancy
	function Rotate(info, Vlt) {
		var dispatch = {
			"Idle.LeftMouseDown":start,
			'Idle.RightMouseDown': start,
			'Rotate.Move': rotate,
			'Rotate.RightMouseUp': stop,
			'Rotate.LeftMouseUp': stop,
			'Rotate.MouseLeave': stop
		}
		if (info.Action == 'Harvest') {
			for (key in dispatch)
				info.Keys.push(key);
			return;
		}

		let View = Vlt.div.data('View');

		if (info.Key in dispatch)
			dispatch[info.Key]();

		function start() {
			//	console.log('..Rotate/start', info.Key);
			var mouse = Vlt.Mouse;
			mouse.Mode = 'Rotate';
			mouse.x = info.Mouse.x;
			mouse.y = info.Mouse.y;
		}

		function rotate() {
			//	console.log('..Rotate/move', info.Key);
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
			console.log('..Rotate/stop', info.Key);
			//var Vlt = View;
			Vlt.Mouse.Mode = 'Idle';
		}
	}

})();